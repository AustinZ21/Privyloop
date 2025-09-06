/**
 * Facebook Platform Scraper
 * Extracts privacy settings from Facebook privacy controls and ad preferences
 * Supports: Privacy Settings, Ad Preferences, Data & Privacy
 */

import { BaseScraper } from './base-scraper';
import {
  type ScrapingContext,
  type ScrapingResult,
  type UserPrivacySettings,
} from '../types';

export class FacebookScraper extends BaseScraper {
  readonly platform = 'facebook';
  readonly version = '1.0.0';

  async scrape(context: ScrapingContext): Promise<ScrapingResult> {
    const startTime = new Date();

    try {
      const extractedSettings: UserPrivacySettings = {};

      // Extract privacy settings
      const privacySettings = await this.extractPrivacySettings();
      if (privacySettings && Object.keys(privacySettings).length > 0) {
        extractedSettings['privacy'] = privacySettings;
      }

      // Extract ad preferences
      const adSettings = await this.extractAdSettings();
      if (adSettings && Object.keys(adSettings).length > 0) {
        extractedSettings['advertising'] = adSettings;
      }

      // Extract timeline and tagging settings
      const timelineSettings = await this.extractTimelineSettings();
      if (timelineSettings && Object.keys(timelineSettings).length > 0) {
        extractedSettings['timeline-tagging'] = timelineSettings;
      }

      // Extract location settings
      const locationSettings = await this.extractLocationSettings();
      if (locationSettings && Object.keys(locationSettings).length > 0) {
        extractedSettings['location'] = locationSettings;
      }

      // Extract apps and websites settings
      const appsSettings = await this.extractAppsSettings();
      if (appsSettings && Object.keys(appsSettings).length > 0) {
        extractedSettings['apps-websites'] = appsSettings;
      }

      if (Object.keys(extractedSettings).length === 0) {
        return this.createErrorResult(
          'No privacy settings found on Facebook pages',
          'no_settings_found',
          'parsing',
          true,
          startTime
        );
      }

      return this.createSuccessResult(extractedSettings, startTime);

    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error during Facebook scraping',
        'scraping_error',
        'unknown',
        true,
        startTime,
        { originalError: error }
      );
    }
  }

  /**
   * Extract Facebook Privacy Settings
   */
  private async extractPrivacySettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Future posts privacy
      const futurePostsPrivacy = await this.extractSelectSetting(
        'future-posts',
        '[data-testid="privacy_selector"] [role="button"]',
        ['Public', 'Friends', 'Friends except...', 'Specific friends', 'Only me']
      );
      if (futurePostsPrivacy) {
        settings['future-posts'] = futurePostsPrivacy;
      }

      // Friend requests
      const friendRequests = await this.extractSelectSetting(
        'friend-requests',
        '[data-testid="friend_requests_selector"] [role="button"]',
        ['Everyone', 'Friends of friends', 'Friends']
      );
      if (friendRequests) {
        settings['friend-requests'] = friendRequests;
      }

      // Email lookup
      const emailLookup = await this.extractSelectSetting(
        'email-lookup',
        '[data-testid="email_lookup_selector"] [role="button"]',
        ['Everyone', 'Friends of friends', 'Friends']
      );
      if (emailLookup) {
        settings['email-lookup'] = emailLookup;
      }

      // Phone number lookup
      const phoneLookup = await this.extractSelectSetting(
        'phone-lookup',
        '[data-testid="phone_lookup_selector"] [role="button"]',
        ['Everyone', 'Friends of friends', 'Friends']
      );
      if (phoneLookup) {
        settings['phone-lookup'] = phoneLookup;
      }

    } catch (error) {
      console.error('Error extracting Facebook privacy settings:', error);
    }

    return settings;
  }

  /**
   * Extract Facebook Ad Settings
   */
  private async extractAdSettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Ads based on data from partners
      const adsBasedOnData = await this.extractToggleSetting(
        'ads-based-on-data',
        '[data-testid="ads_based_on_data"] [role="switch"]'
      );
      if (adsBasedOnData !== null) {
        settings['ads-based-on-data'] = adsBasedOnData;
      }

      // Ads based on your activity
      const adsBasedOnActivity = await this.extractToggleSetting(
        'ads-based-on-activity',
        '[data-testid="ads_based_on_activity"] [role="switch"]'
      );
      if (adsBasedOnActivity !== null) {
        settings['ads-based-on-activity'] = adsBasedOnActivity;
      }

      // Ads in other apps and websites
      const adsInOtherApps = await this.extractToggleSetting(
        'ads-in-other-apps',
        '[data-testid="ads_in_other_apps"] [role="switch"]'
      );
      if (adsInOtherApps !== null) {
        settings['ads-in-other-apps'] = adsInOtherApps;
      }

      // Ad interests
      const adInterests = await this.extractAdInterests();
      if (adInterests.length > 0) {
        settings['ad-interests'] = adInterests;
      }

    } catch (error) {
      console.error('Error extracting Facebook ad settings:', error);
    }

    return settings;
  }

  /**
   * Extract Timeline and Tagging Settings
   */
  private async extractTimelineSettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Review posts you're tagged in
      const reviewTaggedPosts = await this.extractToggleSetting(
        'review-tagged-posts',
        '[data-testid="review_tagged_posts"] [role="switch"]'
      );
      if (reviewTaggedPosts !== null) {
        settings['review-tagged-posts'] = reviewTaggedPosts;
      }

      // Review tags people add to your posts
      const reviewTagsOnPosts = await this.extractToggleSetting(
        'review-tags-on-posts',
        '[data-testid="review_tags_on_posts"] [role="switch"]'
      );
      if (reviewTagsOnPosts !== null) {
        settings['review-tags-on-posts'] = reviewTagsOnPosts;
      }

      // Who can post on your timeline
      const whoCanPost = await this.extractSelectSetting(
        'who-can-post',
        '[data-testid="who_can_post_selector"] [role="button"]',
        ['Friends', 'Only me']
      );
      if (whoCanPost) {
        settings['who-can-post'] = whoCanPost;
      }

      // Who can see posts on your timeline
      const whoCanSeeTimelinePosts = await this.extractSelectSetting(
        'who-can-see-timeline-posts',
        '[data-testid="who_can_see_timeline_posts"] [role="button"]',
        ['Public', 'Friends', 'Friends except...', 'Specific friends', 'Only me']
      );
      if (whoCanSeeTimelinePosts) {
        settings['who-can-see-timeline-posts'] = whoCanSeeTimelinePosts;
      }

    } catch (error) {
      console.error('Error extracting Facebook timeline settings:', error);
    }

    return settings;
  }

  /**
   * Extract Location Settings
   */
  private async extractLocationSettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Location services
      const locationServices = await this.extractToggleSetting(
        'location-services',
        '[data-testid="location_services"] [role="switch"]'
      );
      if (locationServices !== null) {
        settings['location-services'] = locationServices;
      }

      // Location history
      const locationHistory = await this.extractToggleSetting(
        'location-history',
        '[data-testid="location_history"] [role="switch"]'
      );
      if (locationHistory !== null) {
        settings['location-history'] = locationHistory;
      }

    } catch (error) {
      console.error('Error extracting Facebook location settings:', error);
    }

    return settings;
  }

  /**
   * Extract Apps and Websites Settings
   */
  private async extractAppsSettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Apps, websites and games
      const appsWebsitesGames = await this.extractToggleSetting(
        'apps-websites-games',
        '[data-testid="apps_websites_games"] [role="switch"]'
      );
      if (appsWebsitesGames !== null) {
        settings['apps-websites-games'] = appsWebsitesGames;
      }

      // Business tools
      const businessTools = await this.extractToggleSetting(
        'business-tools',
        '[data-testid="business_tools"] [role="switch"]'
      );
      if (businessTools !== null) {
        settings['business-tools'] = businessTools;
      }

    } catch (error) {
      console.error('Error extracting Facebook apps settings:', error);
    }

    return settings;
  }

  /**
   * Extract toggle setting value
   */
  private async extractToggleSetting(settingId: string, selector: string): Promise<boolean | null> {
    try {
      const element = await this.waitForSelector(selector);
      if (!element) {
        console.warn(`Element not found for ${settingId}: ${selector}`);
        return null;
      }

      return this.getToggleState(element);

    } catch (error) {
      console.error(`Error extracting toggle setting ${settingId}:`, error);
      return null;
    }
  }

  /**
   * Extract select/dropdown setting value
   */
  private async extractSelectSetting(
    settingId: string,
    selector: string,
    expectedValues: string[]
  ): Promise<string | null> {
    try {
      const element = await this.waitForSelector(selector);
      if (!element) {
        console.warn(`Element not found for ${settingId}: ${selector}`);
        return null;
      }

      // Get the selected value from the button text or data attribute
      const selectedValue = element.textContent?.trim() || element.getAttribute('data-value');
      
      if (selectedValue && expectedValues.includes(selectedValue)) {
        return selectedValue;
      }

      // Try to find the selected value in child elements
      const selectedChild = element.querySelector('[aria-selected="true"], .selected, [data-selected="true"]');
      if (selectedChild) {
        const childValue = selectedChild.textContent?.trim();
        if (childValue && expectedValues.includes(childValue)) {
          return childValue;
        }
      }

      return null;

    } catch (error) {
      console.error(`Error extracting select setting ${settingId}:`, error);
      return null;
    }
  }

  /**
   * Extract ad interests
   */
  private async extractAdInterests(): Promise<string[]> {
    try {
      const interests: string[] = [];

      // Look for ad interest elements
      const interestElements = document.querySelectorAll('[data-interest-id], [data-topic-name]');
      
      interestElements.forEach(element => {
        const interestText = element.getAttribute('data-topic-name') || 
                           element.textContent?.trim();
        
        if (interestText && !interests.includes(interestText)) {
          interests.push(interestText);
        }
      });

      return interests.slice(0, 25); // Limit to first 25 interests

    } catch (error) {
      console.error('Error extracting Facebook ad interests:', error);
      return [];
    }
  }

  /**
   * Determine toggle state from Facebook UI element
   */
  private getToggleState(element: Element): boolean {
    // Facebook uses various patterns for toggles
    if (element.hasAttribute('aria-checked')) {
      return element.getAttribute('aria-checked') === 'true';
    }

    if (element.hasAttribute('data-checked')) {
      return element.getAttribute('data-checked') === 'true';
    }

    // Check for Facebook-specific classes
    if (element.classList.contains('_5dsk') || element.classList.contains('_4nma')) {
      return true;
    }

    if (element.classList.contains('_5dsm') || element.classList.contains('_4nmb')) {
      return false;
    }

    // Look for nested switch elements
    const nestedSwitch = element.querySelector('[role="switch"]');
    if (nestedSwitch && nestedSwitch !== element) {
      return this.getToggleState(nestedSwitch);
    }

    // Look for input elements
    const input = element.querySelector('input[type="checkbox"], input[type="radio"]') as HTMLInputElement;
    if (input) {
      return input.checked;
    }

    return false;
  }

  protected getPermissionPatterns(): string[] {
    return [
      '*://www.facebook.com/*',
      '*://facebook.com/*',
      '*://m.facebook.com/*',
    ];
  }

  protected supportsFirecrawl(): boolean {
    // Facebook requires authentication and has anti-bot measures
    return false;
  }

  /**
   * Facebook-specific setting descriptions
   */
  protected getSettingDescription(settingId: string): string {
    const descriptions: Record<string, string> = {
      'future-posts': 'Controls who can see your future posts by default',
      'friend-requests': 'Controls who can send you friend requests',
      'email-lookup': 'Controls who can find you using your email address',
      'phone-lookup': 'Controls who can find you using your phone number',
      'ads-based-on-data': 'Shows ads based on data from advertising partners',
      'ads-based-on-activity': 'Shows ads based on your Facebook activity',
      'ads-in-other-apps': 'Shows Facebook ads in other apps and websites',
      'review-tagged-posts': 'Review posts you are tagged in before they appear on your timeline',
      'review-tags-on-posts': 'Review tags people add to your posts before they appear',
      'who-can-post': 'Controls who can post on your timeline',
      'who-can-see-timeline-posts': 'Controls who can see posts on your timeline',
      'location-services': 'Allows Facebook to access your device location',
      'location-history': 'Stores your location history for location-based features',
      'apps-websites-games': 'Allows apps, websites, and games to access your Facebook information',
      'business-tools': 'Allows businesses to use your information for their tools and analytics',
    };

    return descriptions[settingId] || super.getSettingDescription(settingId);
  }

  /**
   * Facebook-specific risk assessment
   */
  protected assessRiskLevel(settingId: string, value: any): 'low' | 'medium' | 'high' {
    const highRiskSettings = [
      'location-services',
      'location-history',
      'ads-based-on-data',
      'business-tools'
    ];
    
    const mediumRiskSettings = [
      'ads-based-on-activity',
      'ads-in-other-apps',
      'apps-websites-games',
      'email-lookup',
      'phone-lookup'
    ];

    const privacySettings = [
      'future-posts',
      'who-can-see-timeline-posts',
      'friend-requests'
    ];

    if (highRiskSettings.includes(settingId)) {
      return value === true ? 'high' : 'medium';
    }

    if (mediumRiskSettings.includes(settingId)) {
      return value === true ? 'medium' : 'low';
    }

    // For privacy settings, more restrictive = lower risk
    if (privacySettings.includes(settingId)) {
      if (typeof value === 'string') {
        if (value === 'Public') return 'high';
        if (value === 'Friends') return 'medium';
        return 'low'; // Friends except, Specific friends, Only me
      }
    }

    return 'low';
  }

  /**
   * Facebook-specific recommendations
   */
  protected getSettingRecommendation(settingId: string, value: any): string | undefined {
    if (settingId === 'future-posts' && value === 'Public') {
      return 'Consider changing to "Friends" or "Only me" for better privacy';
    }

    if (settingId === 'location-services' && value === true) {
      return 'Consider disabling location services for better privacy';
    }

    if (settingId === 'ads-based-on-data' && value === true) {
      return 'Disable to prevent ads based on external data sources';
    }

    if (settingId === 'business-tools' && value === true) {
      return 'Consider disabling to limit business access to your data';
    }

    if ((settingId === 'email-lookup' || settingId === 'phone-lookup') && value === 'Everyone') {
      return 'Consider changing to "Friends" to limit who can find you';
    }

    return super.getSettingRecommendation(settingId, value);
  }
}