import { resourceTracker } from './resourceTracker';

type MessageHandler = (data: any) => void;

export type SocketState = 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING' | 'FAILED';

class SocketService {
  private ws: WebSocket | null = null;
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectTimer: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isExplicitlyDisconnected = false;
  
  private currentUserId = '';
  private currentRoomId = '';
  private currentToken = '';
  private state: SocketState = 'DISCONNECTED';

  public getState(): SocketState {
    return this.state;
  }

  private transitionState(newState: SocketState, reason?: string) {
    const prevState = this.state;
    if (prevState === newState) return;
    this.state = newState;
    resourceTracker.logTransition('WebSocket', {
      safeIdentifier: this.currentUserId || 'anonymous',
      previousState: prevState,
      nextState: newState,
      event: reason || 'state_transition'
    });
  }

  public connect(userId: string, token?: string) {
    if (!userId) return;
    this.currentUserId = userId;
    if (token) {
      this.currentToken = token;
    }
    this.isExplicitlyDisconnected = false;

    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.transitionState('CONNECTING', 'initiating_connection');
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
    const wsUrl = `${protocol}//${host}/ws`;

    console.log(`[SOCKET_SERVICE] Connecting to: ${wsUrl} (userId: ${userId})`);

    try {
      this.ws = new WebSocket(wsUrl);
      resourceTracker.trackWebSocket(1);

      this.ws.onopen = () => {
        console.log('[SOCKET_SERVICE] Connection established successfully');
        this.reconnectAttempts = 0;
        this.transitionState('CONNECTED', 'open');

        // Authenticate
        this.send({
          type: 'auth',
          userId: this.currentUserId,
          roomId: this.currentRoomId,
          token: this.currentToken
        });

        if (this.currentRoomId) {
          this.send({
            type: 'room:join',
            roomId: this.currentRoomId
          });
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const type = data.type;
          const specificHandlers = this.handlers.get(type);
          if (specificHandlers) {
            specificHandlers.forEach(handler => {
              try {
                handler(data);
              } catch (e) {
                console.error(`[SOCKET_SERVICE] Error in handler for ${type}:`, e);
              }
            });
          }
          // Wildcard handlers
          const wildcardHandlers = this.handlers.get('*');
          if (wildcardHandlers) {
            wildcardHandlers.forEach(handler => {
              try {
                handler(data);
              } catch (e) {
                console.error('[SOCKET_SERVICE] Error in wildcard handler:', e);
              }
            });
          }
        } catch (e) {
          console.error('[SOCKET_SERVICE] Message parse error:', e);
        }
      };

      this.ws.onclose = (event) => {
        resourceTracker.trackWebSocket(-1);
        console.log(`[SOCKET_SERVICE] Connection closed: code=${event.code}, reason=${event.reason || 'none'}`);
        if (!this.isExplicitlyDisconnected) {
          this.transitionState('DISCONNECTED', `closed_${event.code}`);
          this.scheduleReconnect();
        } else {
          this.transitionState('DISCONNECTED', 'explicit_disconnect');
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[SOCKET_SERVICE] Socket error event caught:', err);
        this.ws?.close();
      };
    } catch (e) {
      console.error('[SOCKET_SERVICE] Initialization error:', e);
      if (!this.isExplicitlyDisconnected) {
        this.scheduleReconnect();
      }
    }
  }

  private scheduleReconnect() {
    if (this.isExplicitlyDisconnected || !this.currentUserId) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[SOCKET_SERVICE] Max reconnect attempts reached');
      this.transitionState('FAILED', 'max_attempts_exceeded');
      return;
    }

    this.reconnectAttempts++;
    this.transitionState('RECONNECTING', `attempt_${this.reconnectAttempts}`);

    // Bounded exponential backoff: 1s, 2s, 4s, max 8s
    const delay = Math.min(8000, 1000 * Math.pow(1.5, this.reconnectAttempts - 1));
    console.log(`[SOCKET_SERVICE] Scheduling reconnect attempt #${this.reconnectAttempts} in ${Math.round(delay)}ms...`);
    
    this.reconnectTimer = setTimeout(() => {
      if (!this.isExplicitlyDisconnected && this.currentUserId) {
        this.connect(this.currentUserId, this.currentToken);
      }
    }, delay);
  }

  public joinRoom(roomId: string) {
    this.currentRoomId = roomId;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'room:join',
        roomId
      });
    }
  }

  public send(payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(payload));
      } catch (e) {
        console.error('[SOCKET_SERVICE] Send error:', e);
      }
    }
  }

  public on(event: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);

    return () => {
      this.handlers.get(event)?.delete(handler);
    };
  }

  public disconnect() {
    console.log('[SOCKET_SERVICE] Explicit disconnect requested');
    this.isExplicitlyDisconnected = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
    this.transitionState('DISCONNECTED', 'logout_or_manual_disconnect');
  }
}

export const socketService = new SocketService();
