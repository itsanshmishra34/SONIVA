import { WebSearchResult } from '../types';

export interface GoogleSearchResponse {
  success: boolean;
  query: string;
  results?: WebSearchResult[];
  source: string;
  error?: string;
  code?: string;
}

/**
 * Client-side service to communicate with the SONIVA Google Search API.
 * This service proxies requests through the SONIVA backend to keep API keys secure.
 */
export class GoogleSearchClient {
  /**
   * Search the web using the official Google Search integration.
   */
  public static async search(query: string): Promise<GoogleSearchResponse> {
    const q = (query || '').trim();
    if (!q) {
      return { success: false, query: q, source: 'google', error: 'Empty query' };
    }

    try {
      const idToken = await this.getFirebaseIdToken();
      if (!idToken) {
        return { success: false, query: q, source: 'google', error: 'Authentication required', code: 'GOOGLE_SEARCH_UNAUTHORIZED' };
      }

      const url = `/api/search/google?q=${encodeURIComponent(q)}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Accept': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          query: q,
          source: 'google',
          error: data.error || `Search failed with status ${response.status}`,
          code: data.code || 'GOOGLE_SEARCH_NETWORK_ERROR'
        };
      }

      return {
        success: true,
        query: data.query,
        results: data.results || [],
        source: 'google'
      };
    } catch (err: any) {
      console.error('[GOOGLE_SEARCH_CLIENT_ERROR]', err);
      return {
        success: false,
        query: q,
        source: 'google',
        error: 'Network request failed',
        code: 'GOOGLE_SEARCH_NETWORK_ERROR'
      };
    }
  }

  /**
   * Helper to get fresh Firebase ID token for authenticated API calls.
   */
  private static async getFirebaseIdToken(): Promise<string | null> {
    try {
      // Dynamic import to avoid SSR issues if applicable, though this is a SPA
      const { auth } = await import('./firebase');
      const currentUser = auth.currentUser;
      if (!currentUser) return null;
      return await currentUser.getIdToken(true);
    } catch {
      return null;
    }
  }
}
