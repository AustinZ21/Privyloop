/**
 * Firecrawl Integration Service
 * Provides fallback scraping capabilities when browser extension cannot access pages
 * Used for platforms that change their structure or require additional scraping methods
 */

import { type ExtractedPrivacyData, type ScrapingResult, type ScrapingContext } from '../types';

export interface FirecrawlConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface FirecrawlCrawlOptions {
  formats?: string[];
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  headers?: Record<string, string>;
  waitFor?: number;
}

export class FirecrawlService {
  private apiKey: string;
  private baseUrl: string;
  private timeout: number;

  constructor(config: FirecrawlConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.firecrawl.dev';
    this.timeout = config.timeout || 30000;
  }

  /**
   * Scrape a privacy settings page using Firecrawl
   */
  async scrapePrivacyPage(
    url: string,
    context: ScrapingContext,
    options: FirecrawlCrawlOptions = {}
  ): Promise<ScrapingResult> {
    const startTime = new Date();
    const scanId = `firecrawl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Crawl the page
      const crawlResult = await this.crawlUrl(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000,
        ...options,
      });

      if (!crawlResult.success) {
        return this.createErrorResult(
          crawlResult.error || 'Firecrawl request failed',
          'firecrawl_error',
          true,
          startTime,
          scanId
        );
      }

      // Extract privacy settings from crawled content
      const extractedSettings = await this.extractPrivacySettings(
        crawlResult.data,
        context.platformId
      );

      const endTime = new Date();

      return {
        success: true,
        data: {
          platformId: context.platformId,
          extractedSettings,
          raw: {
            html: crawlResult.data.html,
            metadata: {
              url: crawlResult.data.metadata?.url || url,
              title: crawlResult.data.metadata?.title,
              description: crawlResult.data.metadata?.description,
              firecrawlJobId: crawlResult.data.metadata?.jobId,
            },
          },
        },
        metadata: {
          scanId,
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          method: 'firecrawl',
          completionRate: this.calculateCompletionRate(extractedSettings),
          confidenceScore: this.calculateConfidenceScore(extractedSettings),
          elementsFound: this.countElements(extractedSettings),
          elementsExpected: 10, // Default expectation
        },
      };

    } catch (error) {
      console.error('Firecrawl scraping error:', error);
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown Firecrawl error',
        'firecrawl_exception',
        true,
        startTime,
        scanId
      );
    }
  }

  /**
   * Crawl URL using Firecrawl API
   */
  private async crawlUrl(url: string, options: FirecrawlCrawlOptions) {
    const response = await fetch(`${this.baseUrl}/v0/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        url,
        crawlerOptions: {
          formats: options.formats || ['markdown'],
          onlyMainContent: options.onlyMainContent ?? true,
          includeTags: options.includeTags,
          excludeTags: options.excludeTags,
          waitFor: options.waitFor || 0,
        },
        pageOptions: {
          headers: options.headers,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Firecrawl API error: ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const result = await response.json();
    
    // Handle job-based responses
    if (result.jobId) {
      return await this.waitForJobCompletion(result.jobId);
    }

    return result;
  }

  /**
   * Wait for Firecrawl job completion
   */
  private async waitForJobCompletion(jobId: string, maxWaitTime = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const statusResponse = await fetch(`${this.baseUrl}/v0/crawl/status/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!statusResponse.ok) {
        throw new Error(`Firecrawl job status error: ${statusResponse.statusText}`);
      }

      const status = await statusResponse.json();
      
      if (status.status === 'completed') {
        return { success: true, data: status.data };
      }
      
      if (status.status === 'failed') {
        return { success: false, error: status.error || 'Job failed' };
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    throw new Error('Firecrawl job timeout');
  }

  /**
   * Extract privacy settings from crawled content
   * This is a basic implementation - would need platform-specific logic
   */
  private async extractPrivacySettings(
    crawlData: any,
    platformId: string
  ): Promise<Record<string, Record<string, any>>> {
    const settings: Record<string, Record<string, any>> = {};
    
    try {
      const { markdown, html, metadata } = crawlData;
      
      // Basic privacy keyword extraction from markdown content
      if (markdown) {
        const privacySettings = this.extractSettingsFromText(markdown);
        if (Object.keys(privacySettings).length > 0) {
          settings['extracted'] = privacySettings;
        }
      }

      // Could add HTML parsing here for more structured extraction
      if (html && Object.keys(settings).length === 0) {
        const htmlSettings = this.extractSettingsFromHTML(html);
        if (Object.keys(htmlSettings).length > 0) {
          settings['html-extracted'] = htmlSettings;
        }
      }

    } catch (error) {
      console.error('Error extracting privacy settings from Firecrawl data:', error);
    }

    return settings;
  }

  /**
   * Extract settings from text using keyword matching
   */
  private extractSettingsFromText(text: string): Record<string, any> {
    const settings: Record<string, any> = {};
    
    // Privacy setting patterns
    const patterns = [
      { key: 'ad-personalization', pattern: /ad personalization|advertising personalization|personalized ads/i },
      { key: 'location-tracking', pattern: /location tracking|location history|track location/i },
      { key: 'activity-tracking', pattern: /activity tracking|track activity|web activity/i },
      { key: 'data-sharing', pattern: /data sharing|share data|third party/i },
      { key: 'analytics', pattern: /analytics|tracking analytics|usage analytics/i },
      { key: 'cookies', pattern: /cookies|cookie preferences|cookie settings/i },
    ];

    for (const { key, pattern } of patterns) {
      if (pattern.test(text)) {
        // Try to determine if it's enabled/disabled from context
        const context = this.extractContextAroundMatch(text, pattern);
        settings[key] = this.inferSettingValue(context);
      }
    }

    return settings;
  }

  /**
   * Extract settings from HTML structure
   */
  private extractSettingsFromHTML(html: string): Record<string, any> {
    const settings: Record<string, any> = {};
    
    try {
      // Basic toggle detection
      const togglePatterns = [
        /<input[^>]*type="checkbox"[^>]*checked/gi,
        /<[^>]*role="switch"[^>]*aria-checked="true"/gi,
        /<[^>]*aria-pressed="true"/gi,
      ];

      let toggleCount = 0;
      togglePatterns.forEach(pattern => {
        const matches = html.match(pattern);
        if (matches) {
          toggleCount += matches.length;
        }
      });

      if (toggleCount > 0) {
        settings['detected-toggles'] = toggleCount;
        settings['estimated-enabled'] = Math.floor(toggleCount * 0.7); // Assume 70% are enabled
      }

    } catch (error) {
      console.error('Error extracting HTML settings:', error);
    }

    return settings;
  }

  /**
   * Extract context around pattern match
   */
  private extractContextAroundMatch(text: string, pattern: RegExp): string {
    const match = text.match(pattern);
    if (!match) return '';

    const matchIndex = match.index || 0;
    const contextStart = Math.max(0, matchIndex - 100);
    const contextEnd = Math.min(text.length, matchIndex + match[0].length + 100);
    
    return text.slice(contextStart, contextEnd);
  }

  /**
   * Infer setting value from context
   */
  private inferSettingValue(context: string): any {
    const enabledWords = /enabled|on|active|allow|yes|true/i;
    const disabledWords = /disabled|off|inactive|block|no|false/i;

    if (enabledWords.test(context)) {
      return true;
    } else if (disabledWords.test(context)) {
      return false;
    }

    // Default to enabled if unclear (privacy-conscious assumption)
    return true;
  }

  /**
   * Calculate completion rate based on extracted settings
   */
  private calculateCompletionRate(settings: Record<string, Record<string, any>>): number {
    const extractedCount = this.countElements(settings);
    const expectedMin = 5; // Minimum expected privacy settings
    
    return Math.min(extractedCount / expectedMin, 1);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidenceScore(settings: Record<string, Record<string, any>>): number {
    const extractedCount = this.countElements(settings);
    
    // Lower confidence for Firecrawl extraction due to indirect method
    if (extractedCount === 0) return 0;
    if (extractedCount < 3) return 0.3;
    if (extractedCount < 5) return 0.5;
    return 0.7; // Max confidence for Firecrawl
  }

  /**
   * Count extracted elements
   */
  private countElements(settings: Record<string, Record<string, any>>): number {
    let count = 0;
    for (const category of Object.values(settings)) {
      count += Object.keys(category).length;
    }
    return count;
  }

  /**
   * Create error result
   */
  private createErrorResult(
    message: string,
    code: string,
    retryable: boolean,
    startTime: Date,
    scanId: string
  ): ScrapingResult {
    const endTime = new Date();

    return {
      success: false,
      error: {
        code,
        message,
        type: 'network',
        retryable,
      },
      metadata: {
        scanId,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        method: 'firecrawl',
        completionRate: 0,
        confidenceScore: 0,
        elementsFound: 0,
        elementsExpected: 0,
      },
    };
  }

  /**
   * Test Firecrawl service connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v0/crawl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          url: 'https://httpbin.org/json',
          crawlerOptions: {
            formats: ['markdown'],
            onlyMainContent: true,
          },
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Firecrawl connection test failed:', error);
      return false;
    }
  }
}