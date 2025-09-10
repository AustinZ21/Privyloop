/**
 * Base Platform Scraper
 * Provides common functionality for all platform-specific scrapers
 */

import { randomUUID } from 'crypto';
import {
  type PlatformScraper,
  type ScrapingContext,
  type ScrapingResult,
  type ExtractedPrivacyData,
  type ScrapingError,
  type UserPrivacySettings,
  SCRAPING_TIMEOUTS,
  CONFIDENCE_THRESHOLDS,
} from '../types';
import { type PrivacyTemplate, type PrivacySettingsStructure } from '../../database/schema/privacy-templates';
import { type PlatformScrapingConfig } from '../../database/schema/platforms';

export abstract class BaseScraper implements PlatformScraper {
  abstract readonly platform: string;
  abstract readonly version: string;
  
  protected scrapingConfig: PlatformScrapingConfig;
  protected rateLimit: { requestsPerMinute: number; cooldownMinutes: number };

  constructor(scrapingConfig: PlatformScrapingConfig) {
    this.scrapingConfig = scrapingConfig;
    this.rateLimit = scrapingConfig.rateLimit || { requestsPerMinute: 10, cooldownMinutes: 1 };
  }

  /**
   * Check if this scraper can handle the given context
   */
  async canScrape(context: ScrapingContext): Promise<boolean> {
    // Basic checks - can be overridden by specific scrapers
    try {
      // Check if we have required selectors
      if (!this.scrapingConfig.selectors || Object.keys(this.scrapingConfig.selectors).length === 0) {
        return false;
      }

      // Check method compatibility
      if (context.method === 'extension') {
        return true; // Most scrapers support extension method
      }

      if (context.method === 'firecrawl') {
        return this.supportsFirecrawl();
      }

      return false;
    } catch (error) {
      console.error(`Error checking scraper capability for ${this.platform}:`, error);
      return false;
    }
  }

  /**
   * Main scraping method - must be implemented by specific scrapers
   */
  abstract scrape(context: ScrapingContext): Promise<ScrapingResult>;

  /**
   * Validate extracted settings
   */
  validateSettings(settings: UserPrivacySettings): boolean {
    try {
      // Check if we have any settings
      if (!settings || Object.keys(settings).length === 0) {
        return false;
      }

      // Validate each setting against expected configuration
      for (const [categoryId, categorySettings] of Object.entries(settings)) {
        if (!categorySettings || Object.keys(categorySettings).length === 0) {
          continue;
        }

        for (const [settingId, value] of Object.entries(categorySettings)) {
          // Find the selector configuration for this setting
          const selectorConfig = this.scrapingConfig.selectors[settingId];
          if (selectorConfig && !this.validateSettingValue(selectorConfig.type, value, selectorConfig.expectedValues)) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error(`Error validating settings for ${this.platform}:`, error);
      return false;
    }
  }

  /**
   * Generate template from extracted data
   */
  generateTemplate(data: ExtractedPrivacyData): PrivacySettingsStructure {
    const categories: PrivacySettingsStructure['categories'] = {};

    // Group settings by category (inferred from setting names)
    const settingsByCategory = this.categorizeSettings(data.extractedSettings);

    for (const [categoryId, settings] of Object.entries(settingsByCategory)) {
      const categorySettings: Record<string, any> = {};

      for (const [settingId, value] of Object.entries(settings)) {
        const selectorConfig = this.scrapingConfig.selectors[settingId];
        
        categorySettings[settingId] = {
          name: this.formatSettingName(settingId),
          description: this.getSettingDescription(settingId),
          type: selectorConfig?.type || this.inferSettingType(value),
          defaultValue: value,
          riskLevel: this.assessRiskLevel(settingId, value),
          impact: this.getSettingImpact(settingId),
          recommendation: this.getSettingRecommendation(settingId, value),
        };

        // Add options for select/radio types
        if (selectorConfig?.expectedValues) {
          categorySettings[settingId].options = selectorConfig.expectedValues.map(val => ({
            label: this.formatOptionLabel(val),
            value: val,
          }));
        }
      }

      categories[categoryId] = {
        name: this.formatCategoryName(categoryId),
        description: this.getCategoryDescription(categoryId),
        settings: categorySettings,
      };
    }

    return {
      categories,
      metadata: {
        totalSettings: Object.values(categories).reduce(
          (sum, cat) => sum + Object.keys(cat.settings).length,
          0
        ),
        lastScrapedAt: new Date().toISOString(),
        platformVersion: this.version,
      },
    };
  }

  /**
   * Calculate template match confidence
   */
  matchTemplate(template: PrivacyTemplate, data: ExtractedPrivacyData): number {
    const structure = template.settingsStructure;
    const extracted = data.extractedSettings;

    let matchingSettings = 0;
    let totalSettings = 0;

    for (const [categoryId, category] of Object.entries(structure.categories)) {
      const extractedCategory = extracted[categoryId];

      for (const [settingId, setting] of Object.entries(category.settings)) {
        totalSettings++;

        if (extractedCategory && extractedCategory[settingId] !== undefined) {
          const extractedValue = extractedCategory[settingId];
          
          // Check type compatibility
          if (this.validateSettingValue(setting.type, extractedValue)) {
            matchingSettings++;
          }
        }
      }
    }

    return totalSettings > 0 ? matchingSettings / totalSettings : 0;
  }

  /**
   * Get required browser permissions
   */
  getRequiredPermissions(): string[] {
    return this.getPermissionPatterns();
  }

  /**
   * Get rate limiting configuration
   */
  getRateLimits(): { requestsPerMinute: number; cooldownMinutes: number } {
    return this.rateLimit;
  }

  /**
   * Protected helper methods
   */

  protected createSuccessResult(
    extractedSettings: UserPrivacySettings,
    startTime: Date,
    scanId: string = randomUUID()
  ): ScrapingResult {
    const endTime = new Date();
    const totalElements = this.countExpectedElements();
    const foundElements = this.countExtractedElements(extractedSettings);

    return {
      success: true,
      data: {
        platformId: this.platform,
        extractedSettings,
      },
      metadata: {
        scanId,
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        method: 'extension',
        completionRate: totalElements > 0 ? foundElements / totalElements : 1,
        confidenceScore: this.calculateConfidenceScore(extractedSettings),
        elementsFound: foundElements,
        elementsExpected: totalElements,
      },
    };
  }

  protected createErrorResult(
    message: string,
    code: string,
    type: ScrapingError['type'] = 'unknown',
    retryable: boolean = true,
    startTime: Date = new Date(),
    details?: any
  ): ScrapingResult {
    const endTime = new Date();

    return {
      success: false,
      error: {
        code,
        message,
        type,
        retryable,
        details,
      },
      metadata: {
        scanId: randomUUID(),
        startTime,
        endTime,
        duration: endTime.getTime() - startTime.getTime(),
        method: 'extension',
        completionRate: 0,
        confidenceScore: 0,
        elementsFound: 0,
        elementsExpected: this.countExpectedElements(),
      },
    };
  }

  protected async waitForSelector(selector: string, timeout: number = 5000): Promise<Element | null> {
    // Check if we're in a browser environment
    if (typeof document === 'undefined') {
      console.warn('Document not available, skipping selector wait:', selector);
      return null;
    }

    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime >= timeout) {
          resolve(null);
          return;
        }
        
        setTimeout(checkElement, 100);
      };
      
      checkElement();
    });
  }

  protected validateSettingValue(
    expectedType: string,
    value: any,
    expectedValues?: string[]
  ): boolean {
    switch (expectedType) {
      case 'toggle':
        return typeof value === 'boolean';
      case 'radio':
      case 'select':
        if (typeof value !== 'string') return false;
        return !expectedValues || expectedValues.includes(value);
      case 'text':
        return typeof value === 'string';
      default:
        return false;
    }
  }

  protected categorizeSettings(settings: UserPrivacySettings): UserPrivacySettings {
    // Default implementation - can be overridden by specific scrapers
    const categorized: UserPrivacySettings = {};

    for (const [settingId, value] of Object.entries(settings.general || settings)) {
      const category = this.inferCategory(settingId);
      
      if (!categorized[category]) {
        categorized[category] = {};
      }
      
      categorized[category][settingId] = value;
    }

    return categorized;
  }

  protected inferCategory(settingId: string): string {
    // Simple categorization based on setting name
    const id = settingId.toLowerCase();
    
    if (id.includes('ad') || id.includes('marketing') || id.includes('personalization')) {
      return 'advertising';
    }
    
    if (id.includes('location') || id.includes('geo')) {
      return 'location';
    }
    
    if (id.includes('activity') || id.includes('history') || id.includes('tracking')) {
      return 'activity';
    }
    
    if (id.includes('data') || id.includes('download') || id.includes('export')) {
      return 'data-management';
    }
    
    return 'general';
  }

  protected formatSettingName(settingId: string): string {
    return settingId
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  protected formatCategoryName(categoryId: string): string {
    return this.formatSettingName(categoryId);
  }

  protected formatOptionLabel(value: string): string {
    return this.formatSettingName(value);
  }

  protected getSettingDescription(settingId: string): string {
    // Platform-specific implementations should override this
    return `Controls ${this.formatSettingName(settingId).toLowerCase()} functionality`;
  }

  protected getCategoryDescription(categoryId: string): string {
    const descriptions: Record<string, string> = {
      advertising: 'Controls how your data is used for advertising and marketing',
      location: 'Manages location tracking and sharing preferences',
      activity: 'Controls activity tracking and history collection',
      'data-management': 'Settings for data export, deletion, and management',
      general: 'General privacy and account settings',
    };
    
    return descriptions[categoryId] || `Privacy settings for ${this.formatCategoryName(categoryId).toLowerCase()}`;
  }

  protected assessRiskLevel(settingId: string, value: any): 'low' | 'medium' | 'high' {
    const id = settingId.toLowerCase();
    
    // High risk settings
    if (id.includes('location') || id.includes('tracking') || id.includes('personalization')) {
      return typeof value === 'boolean' && value ? 'high' : 'medium';
    }
    
    // Medium risk settings
    if (id.includes('ad') || id.includes('activity') || id.includes('history')) {
      return typeof value === 'boolean' && value ? 'medium' : 'low';
    }
    
    return 'low';
  }

  protected getSettingImpact(settingId: string): string {
    const id = settingId.toLowerCase();
    
    if (id.includes('location')) {
      return 'Affects location-based services and recommendations';
    }
    
    if (id.includes('ad')) {
      return 'Changes how relevant ads are shown to you';
    }
    
    if (id.includes('activity') || id.includes('history')) {
      return 'Affects service personalization and recommendations';
    }
    
    return `Controls ${this.formatSettingName(settingId).toLowerCase()} behavior`;
  }

  protected getSettingRecommendation(settingId: string, value: any): string | undefined {
    const riskLevel = this.assessRiskLevel(settingId, value);
    
    if (riskLevel === 'high' && value === true) {
      return 'Consider disabling for better privacy';
    }
    
    if (riskLevel === 'medium' && value === true) {
      return 'Review this setting based on your privacy preferences';
    }
    
    return undefined;
  }

  protected inferSettingType(value: any): 'toggle' | 'radio' | 'select' | 'text' {
    if (typeof value === 'boolean') {
      return 'toggle';
    }
    
    if (typeof value === 'string') {
      // Simple heuristic
      if (['on', 'off', 'enabled', 'disabled', 'true', 'false'].includes(value.toLowerCase())) {
        return 'toggle';
      }
      return 'select';
    }
    
    return 'text';
  }

  protected calculateConfidenceScore(settings: UserPrivacySettings): number {
    const totalExpected = this.countExpectedElements();
    const totalFound = this.countExtractedElements(settings);
    
    if (totalExpected === 0) return 1;
    
    const completionScore = totalFound / totalExpected;
    
    // Penalize if completion is too low
    if (completionScore < 0.5) return completionScore * 0.5;
    
    return Math.min(completionScore, 1);
  }

  protected countExpectedElements(): number {
    return Object.keys(this.scrapingConfig.selectors).length;
  }

  protected countExtractedElements(settings: UserPrivacySettings): number {
    let count = 0;
    for (const categorySettings of Object.values(settings)) {
      count += Object.keys(categorySettings).length;
    }
    return count;
  }

  protected supportsFirecrawl(): boolean {
    // Override in specific scrapers if Firecrawl is supported
    return false;
  }

  protected abstract getPermissionPatterns(): string[];
}