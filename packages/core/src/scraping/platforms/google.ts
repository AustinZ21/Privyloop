/**
 * Google Platform Scraper
 * Extracts privacy settings from Google Account privacy controls
 * Supports: Web Activity, Location History, Ad Personalization, YouTube History
 */

import { BaseScraper } from './base-scraper';
import {
  type ScrapingContext,
  type ScrapingResult,
  type UserPrivacySettings,
} from '../types';

export class GoogleScraper extends BaseScraper {
  readonly platform = 'google';
  readonly version = '1.0.0';

  constructor() {
    // Default Google scraping configuration
    super({
      selectors: {
        'web-activity': {
          selector: '[data-id="WAA"] [role="switch"]',
          type: 'toggle',
        },
        'location-history': {
          selector: '[data-id="LH"] [role="switch"]',
          type: 'toggle',
        },
        'ad-personalization': {
          selector: '[data-id="AdsPersonalization"] [role="switch"]',
          type: 'toggle',
        },
        'youtube-history': {
          selector: '[data-id="YTH"] [role="switch"]',
          type: 'toggle',
        },
      },
      waitForSelectors: ['[role="switch"]'],
      rateLimit: {
        requestsPerMinute: 5,
        cooldownMinutes: 2,
      },
    });
  }

  // Robust selector configuration with fallback strategies
  private readonly selectors = {
    webActivity: [
      '[data-id="WAA"] [role="switch"]',
      '[aria-label*="Web & App Activity"] [role="switch"]',
      '[data-testid="web-activity-toggle"]',
      'button[aria-describedby*="web-activity"]'
    ],
    locationHistory: [
      '[data-id="LH"] [role="switch"]',
      '[aria-label*="Location History"] [role="switch"]',
      '[data-testid="location-history-toggle"]',
      'button[aria-describedby*="location-history"]'
    ],
    youtubeHistory: [
      '[data-id="YTH"] [role="switch"]',
      '[aria-label*="YouTube History"] [role="switch"]',
      '[data-testid="youtube-history-toggle"]',
      'button[aria-describedby*="youtube-history"]'
    ],
    adInterests: [
      '[data-topic-id] [role="button"]',
      '[aria-label*="interest"] button',
      '.interest-category button',
      '[data-testid="ad-interest"]'
    ],
    locationSharing: [
      '[data-sharing-type] [role="switch"]',
      '[aria-label*="location sharing"] [role="switch"]',
      '[data-testid="location-sharing-toggle"]',
      'button[data-location-type]'
    ]
  } as const;

  /**
   * Try multiple selectors with fallback strategy
   */
  private async findElementWithFallback(selectors: readonly string[]): Promise<Element | null> {
    // Check if we're in a browser environment
    if (typeof document === 'undefined') {
      return null;
    }

    for (const selector of selectors) {
      try {
        const element = await this.waitForSelector(selector, 1000); // Shorter timeout per selector
        if (element) {
          return element;
        }
      } catch (error) {
        // Continue to next selector on error
        console.debug(`Selector failed: ${selector}`, error);
      }
    }
    return null;
  }

  /**
   * Extract toggle setting with fallback selectors
   */
  private async extractToggleSettingWithFallback(
    settingName: string, 
    selectors: readonly string[]
  ): Promise<boolean | null> {
    for (const selector of selectors) {
      try {
        const result = await this.extractToggleSetting(settingName, selector);
        if (result !== null) {
          return result;
        }
      } catch (error) {
        // Continue to next selector on error
        console.debug(`Toggle extraction failed for ${settingName} with selector: ${selector}`, error);
      }
    }
    
    console.warn(`No toggle found for ${settingName} with any selector`);
    return null;
  }

  async scrape(context: ScrapingContext): Promise<ScrapingResult> {
    const startTime = new Date();

    try {
      // Initialize settings object
      const extractedSettings: UserPrivacySettings = {};

      // Extract activity controls
      const activitySettings = await this.extractActivityControls();
      if (activitySettings && Object.keys(activitySettings).length > 0) {
        extractedSettings['activity-controls'] = activitySettings;
      }

      // Extract ad settings
      const adSettings = await this.extractAdSettings();
      if (adSettings && Object.keys(adSettings).length > 0) {
        extractedSettings['advertising'] = adSettings;
      }

      // Extract location settings
      const locationSettings = await this.extractLocationSettings();
      if (locationSettings && Object.keys(locationSettings).length > 0) {
        extractedSettings['location'] = locationSettings;
      }

      // Extract YouTube settings
      const youtubeSettings = await this.extractYouTubeSettings();
      if (youtubeSettings && Object.keys(youtubeSettings).length > 0) {
        extractedSettings['youtube'] = youtubeSettings;
      }

      // Validate that we found some settings
      if (Object.keys(extractedSettings).length === 0) {
        return this.createErrorResult(
          'No privacy settings found on Google pages',
          'no_settings_found',
          'parsing',
          true,
          startTime
        );
      }

      return this.createSuccessResult(extractedSettings, startTime);

    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error during Google scraping',
        'scraping_error',
        'unknown',
        true,
        startTime,
        { originalError: error }
      );
    }
  }

  /**
   * Extract Google Activity Controls settings
   */
  private async extractActivityControls(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Web & App Activity
      const webActivityToggle = await this.extractToggleSettingWithFallback('web-activity', this.selectors.webActivity);
      if (webActivityToggle !== null) {
        settings['web-activity'] = webActivityToggle;
      }

      // Location History
      const locationHistoryToggle = await this.extractToggleSettingWithFallback('location-history', this.selectors.locationHistory);
      if (locationHistoryToggle !== null) {
        settings['location-history'] = locationHistoryToggle;
      }

      // YouTube History
      const youtubeHistoryToggle = await this.extractToggleSettingWithFallback('youtube-history', this.selectors.youtubeHistory);
      if (youtubeHistoryToggle !== null) {
        settings['youtube-history'] = youtubeHistoryToggle;
      }

    } catch (error) {
      console.error('Error extracting Google activity controls:', error);
    }

    return settings;
  }

  /**
   * Extract Google Ad Settings
   */
  private async extractAdSettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Ad Personalization
      const adPersonalizationToggle = await this.extractToggleSetting(
        'ad-personalization',
        '[data-id="AdsPersonalization"] [role="switch"]'
      );
      if (adPersonalizationToggle !== null) {
        settings['ad-personalization'] = adPersonalizationToggle;
      }

      // Also known interests (if available)
      const interests = await this.extractAdInterests();
      if (interests.length > 0) {
        settings['ad-interests'] = interests;
      }

    } catch (error) {
      console.error('Error extracting Google ad settings:', error);
    }

    return settings;
  }

  /**
   * Extract Google Location Settings
   */
  private async extractLocationSettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Location History (also extracted in activity controls)
      const locationHistoryToggle = await this.extractToggleSetting(
        'location-history',
        '[data-id="LH"] [role="switch"], [aria-label*="Location History"] [role="switch"]'
      );
      if (locationHistoryToggle !== null) {
        settings['location-history'] = locationHistoryToggle;
      }

      // Location Sharing
      const locationSharingSettings = await this.extractLocationSharing();
      if (Object.keys(locationSharingSettings).length > 0) {
        Object.assign(settings, locationSharingSettings);
      }

    } catch (error) {
      console.error('Error extracting Google location settings:', error);
    }

    return settings;
  }

  /**
   * Extract YouTube-specific Settings
   */
  private async extractYouTubeSettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Search History
      const searchHistoryToggle = await this.extractToggleSetting(
        'youtube-search-history',
        '[data-id="YTSearchHistory"] [role="switch"]'
      );
      if (searchHistoryToggle !== null) {
        settings['search-history'] = searchHistoryToggle;
      }

      // Watch History
      const watchHistoryToggle = await this.extractToggleSetting(
        'youtube-watch-history',
        '[data-id="YTH"] [role="switch"]'
      );
      if (watchHistoryToggle !== null) {
        settings['watch-history'] = watchHistoryToggle;
      }

    } catch (error) {
      console.error('Error extracting YouTube settings:', error);
    }

    return settings;
  }

  /**
   * Extract toggle setting value
   */
  private async extractToggleSetting(settingId: string, selector: string): Promise<boolean | null> {
    try {
      // In a real browser extension, this would use DOM manipulation
      // For now, we'll simulate the extraction
      
      const element = await this.waitForSelector(selector);
      if (!element) {
        console.warn(`Element not found for ${settingId}: ${selector}`);
        return null;
      }

      // Check if the toggle is enabled
      // This would typically check aria-checked, data-checked, or similar attributes
      const isEnabled = this.getToggleState(element);
      return isEnabled;

    } catch (error) {
      console.error(`Error extracting toggle setting ${settingId}:`, error);
      return null;
    }
  }

  /**
   * Extract ad interests from Google Ads Settings
   */
  private async extractAdInterests(): Promise<string[]> {
    try {
      const interests: string[] = [];

      // Check if we're in a browser environment
      if (typeof document === 'undefined') {
        console.warn('Document not available, skipping ad interests extraction');
        return [];
      }

      // Look for interest categories using fallback selectors
      let interestElements: NodeListOf<Element> | null = null;
      for (const selector of this.selectors.adInterests) {
        interestElements = document.querySelectorAll(selector);
        if (interestElements.length > 0) {
          break;
        }
      }
      
      if (interestElements && interestElements.length > 0) {
        interestElements.forEach(element => {
          const interestText = element.textContent?.trim();
          if (interestText && !interests.includes(interestText)) {
            interests.push(interestText);
          }
        });
      }

      return interests.slice(0, 20); // Limit to first 20 interests

    } catch (error) {
      console.error('Error extracting ad interests:', error);
      return [];
    }
  }

  /**
   * Extract location sharing settings
   */
  private async extractLocationSharing(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Check if we're in a browser environment
      if (typeof document === 'undefined') {
        console.warn('Document not available, skipping location sharing extraction');
        return settings;
      }

      // Check for location sharing toggles using fallback selectors
      let sharingToggles: NodeListOf<Element> | null = null;
      for (const selector of this.selectors.locationSharing) {
        sharingToggles = document.querySelectorAll(selector);
        if (sharingToggles.length > 0) {
          break;
        }
      }
      
      if (sharingToggles && sharingToggles.length > 0) {
        sharingToggles.forEach(toggle => {
          const sharingType = toggle.closest('[data-sharing-type]')?.getAttribute('data-sharing-type');
          if (sharingType) {
            settings[`location-sharing-${sharingType}`] = this.getToggleState(toggle);
          }
        });
      }

    } catch (error) {
      console.error('Error extracting location sharing settings:', error);
    }

    return settings;
  }

  /**
   * Determine toggle state from element
   */
  private getToggleState(element: Element): boolean {
    // Check various attributes that indicate toggle state
    if (element.hasAttribute('aria-checked')) {
      return element.getAttribute('aria-checked') === 'true';
    }

    if (element.hasAttribute('data-checked')) {
      return element.getAttribute('data-checked') === 'true';
    }

    if (element.hasAttribute('checked')) {
      return true;
    }

    // Check for CSS classes that might indicate state
    if (element.classList.contains('enabled') || element.classList.contains('on')) {
      return true;
    }

    if (element.classList.contains('disabled') || element.classList.contains('off')) {
      return false;
    }

    // Look for nested elements that might indicate state
    const nestedIndicator = element.querySelector('[aria-checked], [data-checked], .enabled, .disabled');
    if (nestedIndicator) {
      return this.getToggleState(nestedIndicator);
    }

    // Default assumption based on Google's UI patterns
    return false;
  }

  /**
   * Override categorization for Google settings
   */
  protected categorizeSettings(settings: UserPrivacySettings): UserPrivacySettings {
    // Google settings are already properly categorized by extraction methods
    return settings;
  }

  protected getPermissionPatterns(): string[] {
    return [
      '*://myaccount.google.com/*',
      '*://adssettings.google.com/*',
      '*://myactivity.google.com/*',
      '*://takeout.google.com/*',
    ];
  }

  protected supportsFirecrawl(): boolean {
    // Google requires authentication, so Firecrawl won't work well
    return false;
  }

  /**
   * Google-specific setting descriptions
   */
  protected getSettingDescription(settingId: string): string {
    const descriptions: Record<string, string> = {
      'web-activity': 'Saves your activity on Google sites and apps to improve Google services',
      'location-history': 'Saves where you go with your devices to improve location-based services',
      'ad-personalization': 'Uses your activity to show more relevant ads across Google services',
      'youtube-history': 'Saves your YouTube watch and search activity to improve recommendations',
      'youtube-search-history': 'Saves your YouTube search activity to improve search suggestions',
      'youtube-watch-history': 'Saves videos you watch to improve recommendations',
    };

    return descriptions[settingId] || super.getSettingDescription(settingId);
  }

  /**
   * Google-specific risk assessment
   */
  protected assessRiskLevel(settingId: string, value: any): 'low' | 'medium' | 'high' {
    const highRiskSettings = ['location-history', 'ad-personalization'];
    const mediumRiskSettings = ['web-activity', 'youtube-history'];

    if (highRiskSettings.includes(settingId)) {
      return value === true ? 'high' : 'medium';
    }

    if (mediumRiskSettings.includes(settingId)) {
      return value === true ? 'medium' : 'low';
    }

    return 'low';
  }

  /**
   * Google-specific recommendations
   */
  protected getSettingRecommendation(settingId: string, value: any): string | undefined {
    if (settingId === 'location-history' && value === true) {
      return 'Consider disabling location history for better privacy, though this may reduce location-based service quality';
    }

    if (settingId === 'ad-personalization' && value === true) {
      return 'Disabling ad personalization will show less relevant ads but improves privacy';
    }

    if (settingId === 'web-activity' && value === true) {
      return 'Disabling may reduce service quality but improves privacy';
    }

    return super.getSettingRecommendation(settingId, value);
  }
}