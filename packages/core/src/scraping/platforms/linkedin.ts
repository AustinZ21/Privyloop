/**
 * LinkedIn Platform Scraper
 * Extracts privacy settings from LinkedIn privacy controls
 * Supports: Profile Privacy, Activity Broadcasting, Data Privacy, Ad Preferences
 */

import { BaseScraper } from './base-scraper';
import {
  type ScrapingContext,
  type ScrapingResult,
  type UserPrivacySettings,
} from '../types';

export class LinkedInScraper extends BaseScraper {
  readonly platform = 'linkedin';
  readonly version = '1.0.0';

  async scrape(context: ScrapingContext): Promise<ScrapingResult> {
    const startTime = new Date();

    try {
      const extractedSettings: UserPrivacySettings = {};

      // Extract profile privacy settings
      const profileSettings = await this.extractProfilePrivacySettings();
      if (profileSettings && Object.keys(profileSettings).length > 0) {
        extractedSettings['profile-privacy'] = profileSettings;
      }

      // Extract activity broadcasting settings
      const activitySettings = await this.extractActivitySettings();
      if (activitySettings && Object.keys(activitySettings).length > 0) {
        extractedSettings['activity'] = activitySettings;
      }

      // Extract data privacy settings
      const dataSettings = await this.extractDataPrivacySettings();
      if (dataSettings && Object.keys(dataSettings).length > 0) {
        extractedSettings['data-privacy'] = dataSettings;
      }

      // Extract advertising settings
      const adSettings = await this.extractAdvertisingSettings();
      if (adSettings && Object.keys(adSettings).length > 0) {
        extractedSettings['advertising'] = adSettings;
      }

      // Extract communications settings
      const communicationsSettings = await this.extractCommunicationsSettings();
      if (communicationsSettings && Object.keys(communicationsSettings).length > 0) {
        extractedSettings['communications'] = communicationsSettings;
      }

      if (Object.keys(extractedSettings).length === 0) {
        return this.createErrorResult(
          'No privacy settings found on LinkedIn pages',
          'no_settings_found',
          'parsing',
          true,
          startTime
        );
      }

      return this.createSuccessResult(extractedSettings, startTime);

    } catch (error) {
      return this.createErrorResult(
        error instanceof Error ? error.message : 'Unknown error during LinkedIn scraping',
        'scraping_error',
        'unknown',
        true,
        startTime,
        { originalError: error }
      );
    }
  }

  /**
   * Extract Profile Privacy Settings
   */
  private async extractProfilePrivacySettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Public profile visibility
      const publicProfileVisibility = await this.extractRadioSetting(
        'public-profile-visibility',
        '[data-control-name="public_profile"] input[type="radio"]:checked',
        ['public', 'limited']
      );
      if (publicProfileVisibility) {
        settings['public-profile-visibility'] = publicProfileVisibility;
      }

      // Profile photo visibility
      const profilePhotoVisibility = await this.extractSelectSetting(
        'profile-photo-visibility',
        '[data-control-name="profile_photo_visibility"] select',
        ['public', 'network', 'connections']
      );
      if (profilePhotoVisibility) {
        settings['profile-photo-visibility'] = profilePhotoVisibility;
      }

      // Profile discovery by email
      const discoveryByEmail = await this.extractToggleSetting(
        'profile-discovery-email',
        '[data-control-name="profile_discovery_email"] input[type="checkbox"]'
      );
      if (discoveryByEmail !== null) {
        settings['profile-discovery-email'] = discoveryByEmail;
      }

      // Profile discovery by phone
      const discoveryByPhone = await this.extractToggleSetting(
        'profile-discovery-phone',
        '[data-control-name="profile_discovery_phone"] input[type="checkbox"]'
      );
      if (discoveryByPhone !== null) {
        settings['profile-discovery-phone'] = discoveryByPhone;
      }

    } catch (error) {
      console.error('Error extracting LinkedIn profile privacy settings:', error);
    }

    return settings;
  }

  /**
   * Extract Activity Broadcasting Settings
   */
  private async extractActivitySettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Activity broadcasts
      const activityBroadcasts = await this.extractToggleSetting(
        'activity-broadcasts',
        '[data-control-name="activity_feed"] input[type="checkbox"]'
      );
      if (activityBroadcasts !== null) {
        settings['activity-broadcasts'] = activityBroadcasts;
      }

      // Profile changes
      const profileChanges = await this.extractToggleSetting(
        'profile-changes',
        '[data-control-name="profile_changes"] input[type="checkbox"]'
      );
      if (profileChanges !== null) {
        settings['profile-changes'] = profileChanges;
      }

      // Job changes
      const jobChanges = await this.extractToggleSetting(
        'job-changes',
        '[data-control-name="job_changes"] input[type="checkbox"]'
      );
      if (jobChanges !== null) {
        settings['job-changes'] = jobChanges;
      }

      // Education changes
      const educationChanges = await this.extractToggleSetting(
        'education-changes',
        '[data-control-name="education_changes"] input[type="checkbox"]'
      );
      if (educationChanges !== null) {
        settings['education-changes'] = educationChanges;
      }

    } catch (error) {
      console.error('Error extracting LinkedIn activity settings:', error);
    }

    return settings;
  }

  /**
   * Extract Data Privacy Settings
   */
  private async extractDataPrivacySettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Data for personalization
      const dataForPersonalization = await this.extractToggleSetting(
        'data-for-personalization',
        '[data-control-name="data_personalization"] input[type="checkbox"]'
      );
      if (dataForPersonalization !== null) {
        settings['data-for-personalization'] = dataForPersonalization;
      }

      // Profile data for research
      const profileDataResearch = await this.extractToggleSetting(
        'profile-data-research',
        '[data-control-name="profile_data_research"] input[type="checkbox"]'
      );
      if (profileDataResearch !== null) {
        settings['profile-data-research'] = profileDataResearch;
      }

      // Social actions for ad relevance
      const socialActionsForAds = await this.extractToggleSetting(
        'social-actions-ads',
        '[data-control-name="social_actions_ads"] input[type="checkbox"]'
      );
      if (socialActionsForAds !== null) {
        settings['social-actions-ads'] = socialActionsForAds;
      }

    } catch (error) {
      console.error('Error extracting LinkedIn data privacy settings:', error);
    }

    return settings;
  }

  /**
   * Extract Advertising Settings
   */
  private async extractAdvertisingSettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Interest-based ads
      const interestBasedAds = await this.extractToggleSetting(
        'interest-based-ads',
        '[data-control-name="interest_ads"] input[type="checkbox"]'
      );
      if (interestBasedAds !== null) {
        settings['interest-based-ads'] = interestBasedAds;
      }

      // Ads based on profile information
      const profileBasedAds = await this.extractToggleSetting(
        'profile-based-ads',
        '[data-control-name="profile_ads"] input[type="checkbox"]'
      );
      if (profileBasedAds !== null) {
        settings['profile-based-ads'] = profileBasedAds;
      }

      // Data collection by advertising partners
      const partnerDataCollection = await this.extractToggleSetting(
        'partner-data-collection',
        '[data-control-name="partner_data"] input[type="checkbox"]'
      );
      if (partnerDataCollection !== null) {
        settings['partner-data-collection'] = partnerDataCollection;
      }

    } catch (error) {
      console.error('Error extracting LinkedIn advertising settings:', error);
    }

    return settings;
  }

  /**
   * Extract Communications Settings
   */
  private async extractCommunicationsSettings(): Promise<Record<string, any>> {
    const settings: Record<string, any> = {};

    try {
      // Connection invitations by email
      const invitationsByEmail = await this.extractSelectSetting(
        'invitations-by-email',
        '[data-control-name="invitations_email"] select',
        ['anyone', 'only-people-who-know-email', 'no-one']
      );
      if (invitationsByEmail) {
        settings['invitations-by-email'] = invitationsByEmail;
      }

      // Messages from members
      const messagesFromMembers = await this.extractSelectSetting(
        'messages-from-members',
        '[data-control-name="messages_members"] select',
        ['anyone', 'only-connections', 'no-one']
      );
      if (messagesFromMembers) {
        settings['messages-from-members'] = messagesFromMembers;
      }

      // Research invites
      const researchInvites = await this.extractToggleSetting(
        'research-invites',
        '[data-control-name="research_invites"] input[type="checkbox"]'
      );
      if (researchInvites !== null) {
        settings['research-invites'] = researchInvites;
      }

    } catch (error) {
      console.error('Error extracting LinkedIn communications settings:', error);
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

      // For checkboxes, check the checked property
      if (element instanceof HTMLInputElement && element.type === 'checkbox') {
        return element.checked;
      }

      return this.getToggleState(element);

    } catch (error) {
      console.error(`Error extracting toggle setting ${settingId}:`, error);
      return null;
    }
  }

  /**
   * Extract radio button setting value
   */
  private async extractRadioSetting(
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

      if (element instanceof HTMLInputElement && element.type === 'radio' && element.checked) {
        const value = element.value;
        return expectedValues.includes(value) ? value : null;
      }

      return null;

    } catch (error) {
      console.error(`Error extracting radio setting ${settingId}:`, error);
      return null;
    }
  }

  /**
   * Extract select dropdown setting value
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

      if (element instanceof HTMLSelectElement) {
        const selectedValue = element.value;
        return expectedValues.includes(selectedValue) ? selectedValue : null;
      }

      // Handle custom select elements
      const selectedOption = element.querySelector('[selected], [aria-selected="true"], .selected');
      if (selectedOption) {
        const value = selectedOption.getAttribute('data-value') || 
                     selectedOption.getAttribute('value') ||
                     selectedOption.textContent?.trim();
        
        if (value && expectedValues.includes(value)) {
          return value;
        }
      }

      return null;

    } catch (error) {
      console.error(`Error extracting select setting ${settingId}:`, error);
      return null;
    }
  }

  /**
   * Determine toggle state from LinkedIn UI element
   */
  private getToggleState(element: Element): boolean {
    if (element.hasAttribute('aria-checked')) {
      return element.getAttribute('aria-checked') === 'true';
    }

    if (element.hasAttribute('data-checked')) {
      return element.getAttribute('data-checked') === 'true';
    }

    // Check for LinkedIn-specific classes
    if (element.classList.contains('checked') || element.classList.contains('enabled')) {
      return true;
    }

    if (element.classList.contains('unchecked') || element.classList.contains('disabled')) {
      return false;
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
      '*://www.linkedin.com/*',
      '*://linkedin.com/*',
    ];
  }

  protected supportsFirecrawl(): boolean {
    // LinkedIn requires authentication
    return false;
  }

  /**
   * LinkedIn-specific setting descriptions
   */
  protected getSettingDescription(settingId: string): string {
    const descriptions: Record<string, string> = {
      'public-profile-visibility': 'Controls whether your profile appears in public search results',
      'profile-photo-visibility': 'Controls who can see your profile photo',
      'profile-discovery-email': 'Allows people to find your profile using your email address',
      'profile-discovery-phone': 'Allows people to find your profile using your phone number',
      'activity-broadcasts': 'Shares your LinkedIn activity with your network',
      'profile-changes': 'Announces profile updates to your network',
      'job-changes': 'Announces job changes to your network',
      'education-changes': 'Announces education updates to your network',
      'data-for-personalization': 'Uses your data to personalize LinkedIn experience',
      'profile-data-research': 'Allows LinkedIn to use your profile data for research',
      'social-actions-ads': 'Uses your social actions to make ads more relevant',
      'interest-based-ads': 'Shows ads based on your interests and activity',
      'profile-based-ads': 'Shows ads based on your profile information',
      'partner-data-collection': 'Allows advertising partners to collect data about you',
      'invitations-by-email': 'Controls who can send you connection invitations',
      'messages-from-members': 'Controls who can send you messages',
      'research-invites': 'Allows you to receive invitations to participate in LinkedIn research',
    };

    return descriptions[settingId] || super.getSettingDescription(settingId);
  }

  /**
   * LinkedIn-specific risk assessment
   */
  protected assessRiskLevel(settingId: string, value: any): 'low' | 'medium' | 'high' {
    const highRiskSettings = [
      'public-profile-visibility',
      'profile-discovery-email',
      'profile-discovery-phone',
      'partner-data-collection'
    ];
    
    const mediumRiskSettings = [
      'activity-broadcasts',
      'profile-changes',
      'job-changes',
      'data-for-personalization',
      'profile-data-research',
      'social-actions-ads',
      'interest-based-ads',
      'profile-based-ads'
    ];

    if (highRiskSettings.includes(settingId)) {
      if (settingId === 'public-profile-visibility') {
        return value === 'public' ? 'high' : 'medium';
      }
      return value === true ? 'high' : 'medium';
    }

    if (mediumRiskSettings.includes(settingId)) {
      return value === true ? 'medium' : 'low';
    }

    // Communications settings - more open = higher risk
    if (settingId === 'invitations-by-email' || settingId === 'messages-from-members') {
      if (value === 'anyone') return 'medium';
      if (value === 'only-people-who-know-email' || value === 'only-connections') return 'low';
    }

    return 'low';
  }

  /**
   * LinkedIn-specific recommendations
   */
  protected getSettingRecommendation(settingId: string, value: any): string | undefined {
    if (settingId === 'public-profile-visibility' && value === 'public') {
      return 'Consider setting to "limited" for better privacy while maintaining discoverability';
    }

    if (settingId === 'profile-discovery-email' && value === true) {
      return 'Consider disabling to prevent people from finding you via email';
    }

    if (settingId === 'partner-data-collection' && value === true) {
      return 'Disable to prevent third-party advertisers from collecting your data';
    }

    if (settingId === 'activity-broadcasts' && value === true) {
      return 'Consider disabling if you prefer to keep your LinkedIn activity private';
    }

    if (settingId === 'invitations-by-email' && value === 'anyone') {
      return 'Consider changing to "only-people-who-know-email" to reduce spam invitations';
    }

    if (settingId === 'messages-from-members' && value === 'anyone') {
      return 'Consider changing to "only-connections" to reduce unwanted messages';
    }

    return super.getSettingRecommendation(settingId, value);
  }

  /**
   * Override categorization for LinkedIn settings
   */
  protected categorizeSettings(settings: UserPrivacySettings): UserPrivacySettings {
    // LinkedIn settings are already properly categorized by extraction methods
    return settings;
  }
}