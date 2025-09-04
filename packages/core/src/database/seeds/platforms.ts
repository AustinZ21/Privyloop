/**
 * Platform seeds for development and testing
 * Sample platform configurations for major privacy platforms
 */

import type { NewPlatform } from '../schema/platforms';

export const platformSeeds: NewPlatform[] = [
  {
    name: 'Google',
    slug: 'google',
    domain: 'google.com',
    description: 'Google Account privacy settings including Ads, Activity Controls, and Location History.',
    logoUrl: 'https://www.google.com/favicon.ico',
    websiteUrl: 'https://myaccount.google.com',
    privacyPageUrls: {
      main: 'https://myaccount.google.com/privacy',
      ads: 'https://adssettings.google.com/',
      data: 'https://myaccount.google.com/data-and-privacy',
      activity: 'https://myaccount.google.com/activitycontrols',
    },
    scrapingConfig: {
      selectors: {
        'web-app-activity': {
          selector: '[data-aid="TLA_WAA_CTA"]',
          type: 'toggle',
          expectedValues: ['On', 'Off'],
        },
        'location-history': {
          selector: '[data-aid="TLA_LH_CTA"]',
          type: 'toggle',
          expectedValues: ['On', 'Off'],
        },
        'youtube-history': {
          selector: '[data-aid="TLA_YT_CTA"]',
          type: 'toggle',
          expectedValues: ['On', 'Off'],
        },
        'ads-personalization': {
          selector: '[data-action-id="ads-personalization"]',
          type: 'toggle',
          expectedValues: ['On', 'Off'],
        },
      },
      waitForSelectors: ['[data-aid="TLA_WAA_CTA"]'],
      rateLimit: {
        requestsPerMinute: 10,
        cooldownMinutes: 5,
      },
    },
    manifestPermissions: [
      'https://*.google.com/*',
      'https://*.googleusercontent.com/*',
      'https://myaccount.google.com/*',
      'https://adssettings.google.com/*',
    ],
    isActive: true,
    isSupported: true,
    requiresAuth: true,
    configVersion: '1.0.0',
  },
  
  {
    name: 'Facebook',
    slug: 'facebook',
    domain: 'facebook.com',
    description: 'Facebook privacy settings including ad preferences, data sharing, and privacy controls.',
    logoUrl: 'https://www.facebook.com/favicon.ico',
    websiteUrl: 'https://www.facebook.com/settings/privacy',
    privacyPageUrls: {
      main: 'https://www.facebook.com/settings/privacy',
      ads: 'https://www.facebook.com/adpreferences',
      data: 'https://www.facebook.com/settings/your_facebook_information',
    },
    scrapingConfig: {
      selectors: {
        'future-posts-audience': {
          selector: '[data-testid="audience_selector_dropdown"]',
          type: 'select',
          expectedValues: ['Public', 'Friends', 'Friends except...', 'Specific friends', 'Only me'],
        },
        'profile-lookup': {
          selector: '[data-testid="profile_lookup_setting"]',
          type: 'toggle',
          expectedValues: ['Everyone', 'Friends of friends', 'Friends'],
        },
        'friend-requests': {
          selector: '[data-testid="friend_request_setting"]',
          type: 'select',
          expectedValues: ['Everyone', 'Friends of friends'],
        },
      },
      waitForSelectors: ['[data-testid="audience_selector_dropdown"]'],
      rateLimit: {
        requestsPerMinute: 8,
        cooldownMinutes: 10,
      },
    },
    manifestPermissions: [
      'https://*.facebook.com/*',
      'https://*.fb.com/*',
    ],
    isActive: true,
    isSupported: true,
    requiresAuth: true,
    configVersion: '1.0.0',
  },
  
  {
    name: 'LinkedIn',
    slug: 'linkedin',
    domain: 'linkedin.com',
    description: 'LinkedIn privacy settings for professional networking and data sharing controls.',
    logoUrl: 'https://www.linkedin.com/favicon.ico',
    websiteUrl: 'https://www.linkedin.com/settings/privacy',
    privacyPageUrls: {
      main: 'https://www.linkedin.com/settings/privacy',
      ads: 'https://www.linkedin.com/settings/enhanced-advertising',
      data: 'https://www.linkedin.com/settings/data-export',
    },
    scrapingConfig: {
      selectors: {
        'profile-visibility': {
          selector: '[data-test-id="profile-visibility-setting"]',
          type: 'toggle',
          expectedValues: ['On', 'Off'],
        },
        'activity-broadcasts': {
          selector: '[data-test-id="activity-broadcasts"]',
          type: 'toggle',
          expectedValues: ['On', 'Off'],
        },
        'enhanced-advertising': {
          selector: '[data-test-id="enhanced-advertising"]',
          type: 'toggle',
          expectedValues: ['On', 'Off'],
        },
      },
      waitForSelectors: ['[data-test-id="profile-visibility-setting"]'],
      rateLimit: {
        requestsPerMinute: 12,
        cooldownMinutes: 3,
      },
    },
    manifestPermissions: [
      'https://*.linkedin.com/*',
    ],
    isActive: true,
    isSupported: true,
    requiresAuth: true,
    configVersion: '1.0.0',
  },
  
  {
    name: 'OpenAI',
    slug: 'openai',
    domain: 'openai.com',
    description: 'OpenAI privacy settings for ChatGPT and API usage data controls.',
    logoUrl: 'https://openai.com/favicon.ico',
    websiteUrl: 'https://platform.openai.com/settings/data-controls',
    privacyPageUrls: {
      main: 'https://platform.openai.com/settings/data-controls',
      data: 'https://platform.openai.com/settings/data-export',
    },
    scrapingConfig: {
      selectors: {
        'chat-history': {
          selector: '[data-testid="chat-history-toggle"]',
          type: 'toggle',
          expectedValues: ['Enabled', 'Disabled'],
        },
        'model-training': {
          selector: '[data-testid="model-training-toggle"]',
          type: 'toggle',
          expectedValues: ['Enabled', 'Disabled'],
        },
      },
      waitForSelectors: ['[data-testid="chat-history-toggle"]'],
      rateLimit: {
        requestsPerMinute: 15,
        cooldownMinutes: 2,
      },
    },
    manifestPermissions: [
      'https://*.openai.com/*',
      'https://platform.openai.com/*',
    ],
    isActive: true,
    isSupported: true,
    requiresAuth: true,
    configVersion: '1.0.0',
  },
  
  {
    name: 'Anthropic',
    slug: 'anthropic',
    domain: 'anthropic.com',
    description: 'Anthropic Claude privacy settings and data usage controls.',
    logoUrl: 'https://anthropic.com/favicon.ico',
    websiteUrl: 'https://console.anthropic.com/settings/privacy',
    privacyPageUrls: {
      main: 'https://console.anthropic.com/settings/privacy',
      data: 'https://console.anthropic.com/settings/data',
    },
    scrapingConfig: {
      selectors: {
        'conversation-history': {
          selector: '[data-testid="conversation-history"]',
          type: 'toggle',
          expectedValues: ['On', 'Off'],
        },
        'model-improvement': {
          selector: '[data-testid="model-improvement"]',
          type: 'toggle',
          expectedValues: ['On', 'Off'],
        },
      },
      waitForSelectors: ['[data-testid="conversation-history"]'],
      rateLimit: {
        requestsPerMinute: 15,
        cooldownMinutes: 2,
      },
    },
    manifestPermissions: [
      'https://*.anthropic.com/*',
      'https://console.anthropic.com/*',
    ],
    isActive: true,
    isSupported: true,
    requiresAuth: true,
    configVersion: '1.0.0',
  },
];