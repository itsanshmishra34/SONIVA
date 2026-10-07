import type { WebSearchResult } from '../types/index.ts';

export interface GoogleSearchOptions {
  safeSearch?: 'active' | 'off';
  resultLimit?: number;
  language?: string;
  region?: string;
}

/**
 * Dedicated server-side service for Google Search integration.
 * This service communicates with the official Google Custom Search JSON API.
 */
export class GoogleSearchService {
  private static getApiKey() { return process.env.GOOGLE_SEARCH_API_KEY; }
  private static getEngineId() { return process.env.GOOGLE_SEARCH_ENGINE_ID; }

  public static isConfigured(): boolean {
    const key = this.getApiKey();
    const cx = this.getEngineId();
    return !!(
      key && 
      key.trim().length > 0 && 
      !key.includes('YOUR_') && 
      !key.includes('MY_') &&
      cx && 
      cx.trim().length > 0 && 
      !cx.includes('YOUR_') &&
      !cx.includes('MY_')
    );
  }

  public static getStatus(): 'CONNECTED' | 'NOT_CONFIGURED' | 'QUOTA_LIMITED' | 'FORBIDDEN' | 'ERROR' {
    if (!this.isConfigured()) {
      return 'NOT_CONFIGURED';
    }
    return 'CONNECTED';
  }

  /**
   * Perform a search via Google Custom Search JSON API.
   * Enforces normalization and safe search by default.
   */
  public static async searchGoogle(query: string, options: GoogleSearchOptions = {}): Promise<WebSearchResult[]> {
    if (!this.isConfigured()) {
      throw new Error('GOOGLE_SEARCH_NOT_CONFIGURED');
    }

    const q = (query || '').trim();
    if (!q) return [];

    const { safeSearch = 'active', resultLimit = 10, language, region } = options;
    const apiKey = this.getApiKey();
    const cx = this.getEngineId();

    try {
      const url = new URL('https://www.googleapis.com/customsearch/v1');
      url.searchParams.append('key', apiKey!);
      url.searchParams.append('cx', cx!);
      url.searchParams.append('q', q);
      url.searchParams.append('safe', safeSearch);
      url.searchParams.append('num', Math.min(Math.max(1, resultLimit), 10).toString());
      
      if (language) url.searchParams.append('lr', `lang_${language}`);
      if (region) url.searchParams.append('gl', region);

      const response = await fetch(url.toString(), {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'SONIVA-Backend/1.0'
        }
      });
      
      if (!response.ok) {
        const status = response.status;
        console.error(`[GOOGLE_SEARCH_PROVIDER_ERROR] status=${status} query="${q}"`);
        
        if (status === 403) throw new Error('GOOGLE_SEARCH_INVALID_KEY');
        if (status === 429) throw new Error('GOOGLE_SEARCH_QUOTA_EXCEEDED');
        if (status === 400) throw new Error('GOOGLE_SEARCH_EMPTY');
        throw new Error('GOOGLE_SEARCH_NETWORK_ERROR');
      }

      const data = await response.json();
      
      if (!data.items || !Array.isArray(data.items)) {
        return [];
      }

      // Normalize results to application internal format
      return data.items.map((item: any) => ({
        type: 'web',
        title: (item.title || 'Untitled').slice(0, 200),
        url: this.validateUrl(item.link),
        displayUrl: (item.displayLink || '').slice(0, 100),
        snippet: (item.snippet || '').slice(0, 500),
        source: 'google'
      }));
    } catch (err: any) {
      if (err.message.startsWith('GOOGLE_SEARCH_')) {
        throw err;
      }
      console.error('[GOOGLE_SEARCH_SERVICE_EXCEPTION]', err);
      throw new Error('GOOGLE_SEARCH_NETWORK_ERROR');
    }
  }

  /**
   * Ensures the URL uses a safe scheme (https/http) and rejects dangerous ones.
   */
  private static validateUrl(url: any): string {
    const fallback = '#';
    if (typeof url !== 'string') return fallback;
    
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return url;
      }
      return fallback;
    } catch {
      return fallback;
    }
  }
}
