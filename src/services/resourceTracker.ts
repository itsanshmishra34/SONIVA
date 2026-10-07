/**
 * Centralized Resource and Lifecycle Diagnostic Tracker
 * Maintains safe counters for active persistent resources and provides
 * structured observability without logging sensitive credentials or content.
 */

export interface ResourceCounts {
  audioInstances: number;
  webSocketConnections: number;
  mediaStreams: number;
  peerConnections: number;
  firestoreListeners: number;
}

class ResourceTracker {
  private counts: ResourceCounts = {
    audioInstances: 0,
    webSocketConnections: 0,
    mediaStreams: 0,
    peerConnections: 0,
    firestoreListeners: 0
  };

  public trackAudioInstance(delta: 1 | -1): void {
    this.counts.audioInstances = Math.max(0, this.counts.audioInstances + delta);
    this.logResourceState('AudioInstance', delta > 0 ? 'CREATED' : 'RELEASED');
  }

  public trackWebSocket(delta: 1 | -1): void {
    this.counts.webSocketConnections = Math.max(0, this.counts.webSocketConnections + delta);
    this.logResourceState('WebSocket', delta > 0 ? 'CONNECTED' : 'DISCONNECTED');
  }

  public trackMediaStream(delta: 1 | -1): void {
    this.counts.mediaStreams = Math.max(0, this.counts.mediaStreams + delta);
    this.logResourceState('MediaStream', delta > 0 ? 'ACQUIRED' : 'STOPPED');
  }

  public trackPeerConnection(delta: 1 | -1): void {
    this.counts.peerConnections = Math.max(0, this.counts.peerConnections + delta);
    this.logResourceState('PeerConnection', delta > 0 ? 'OPENED' : 'CLOSED');
  }

  public trackFirestoreListener(delta: 1 | -1): void {
    this.counts.firestoreListeners = Math.max(0, this.counts.firestoreListeners + delta);
    this.logResourceState('FirestoreListener', delta > 0 ? 'SUBSCRIBED' : 'UNSUBSCRIBED');
  }

  public getSnapshot(): Readonly<ResourceCounts> {
    return { ...this.counts };
  }

  public logTransition(feature: string, data: {
    sessionId?: string;
    safeIdentifier?: string;
    previousState: string;
    nextState: string;
    event: string;
  }): void {
    console.log(`[LIFECYCLE_TRANSITION] [${feature}]`, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  private logResourceState(resource: string, action: string): void {
    console.log(`[RESOURCE_TRACKER] [${resource}:${action}]`, {
      currentSnapshot: { ...this.counts },
      timestamp: new Date().toISOString()
    });
  }
}

export const resourceTracker = new ResourceTracker();
