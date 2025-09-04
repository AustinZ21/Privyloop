/**
 * Privacy template seeds for development and testing
 * Sample privacy templates demonstrating template-based optimization
 */

import type { NewPrivacyTemplate, PrivacySettingsStructure } from '../schema/privacy-templates';

// Google privacy template example
const googlePrivacyStructure: PrivacySettingsStructure = {
  categories: {
    'activity-controls': {
      name: 'Activity Controls',
      description: 'Control what activity is saved to your Google Account',
      settings: {
        'web-app-activity': {
          name: 'Web & App Activity',
          description: 'Saves your activity on Google sites and apps to give you faster searches, better recommendations, and more personalized experiences in Maps, Search, and other Google services.',
          type: 'toggle',
          defaultValue: true,
          riskLevel: 'medium',
          impact: 'Enables personalized ads and recommendations',
          recommendation: 'Consider disabling if you prefer more privacy',
        },
        'location-history': {
          name: 'Location History',
          description: 'Saves where you go with your devices to give you personalized maps, recommendations based on places you have visited, and more.',
          type: 'toggle',
          defaultValue: false,
          riskLevel: 'high',
          impact: 'Tracks your physical location continuously',
          recommendation: 'Keep disabled unless you need location-based services',
        },
        'youtube-history': {
          name: 'YouTube History',
          description: 'Your YouTube watch and search history to give you better recommendations and more personalized experiences.',
          type: 'toggle',
          defaultValue: true,
          riskLevel: 'low',
          impact: 'Improves YouTube recommendations',
          recommendation: 'Safe to keep enabled for better experience',
        },
      },
    },
    'ads-personalization': {
      name: 'Ads Personalization',
      description: 'Control how Google personalizes ads for you',
      settings: {
        'ads-personalization': {
          name: 'Ads Personalization',
          description: 'Google uses your data to make ads more useful to you.',
          type: 'toggle',
          defaultValue: true,
          riskLevel: 'medium',
          impact: 'Uses your data for targeted advertising',
          recommendation: 'Disable to see less relevant but more private ads',
        },
        'also-use-non-google': {
          name: 'Also use your activity & information from Google services to personalize ads on websites and apps that partner with Google to show ads',
          description: 'When this setting is on, Google may use your information to personalize ads on partner websites and apps.',
          type: 'toggle',
          defaultValue: true,
          riskLevel: 'high',
          impact: 'Shares your data with third-party advertisers',
          recommendation: 'Recommended to disable for better privacy',
        },
      },
    },
  },
  metadata: {
    totalSettings: 4,
    lastScrapedAt: new Date().toISOString(),
    platformVersion: 'v2024-09-04',
  },
};

// Facebook privacy template example
const facebookPrivacyStructure: PrivacySettingsStructure = {
  categories: {
    'privacy-settings': {
      name: 'Privacy Settings',
      description: 'Control who can see your content and contact you',
      settings: {
        'future-posts': {
          name: 'Who can see your future posts?',
          description: 'This setting applies to posts you share in the future. It does not change the audience for posts you have shared before.',
          type: 'select',
          defaultValue: 'Friends',
          options: [
            { label: 'Public', value: 'public' },
            { label: 'Friends', value: 'friends' },
            { label: 'Friends except...', value: 'friends_except' },
            { label: 'Specific friends', value: 'specific_friends' },
            { label: 'Only me', value: 'only_me' },
          ],
          riskLevel: 'medium',
          impact: 'Controls default visibility of your posts',
          recommendation: 'Set to "Friends" or more restrictive for privacy',
        },
        'profile-lookup': {
          name: 'Who can look you up using the email address you provided?',
          description: 'This setting controls who can find your profile when they search using your email address.',
          type: 'select',
          defaultValue: 'everyone',
          options: [
            { label: 'Everyone', value: 'everyone' },
            { label: 'Friends of friends', value: 'friends_of_friends' },
            { label: 'Friends', value: 'friends' },
          ],
          riskLevel: 'high',
          impact: 'Affects who can discover your profile',
          recommendation: 'Set to "Friends" to limit profile discovery',
        },
      },
    },
    'ad-preferences': {
      name: 'Ad Preferences',
      description: 'Control what ads you see and what information is used',
      settings: {
        'ads-based-on-data': {
          name: 'Ads based on data from partners',
          description: 'Facebook receives information from partners about your activity off Facebook.',
          type: 'toggle',
          defaultValue: true,
          riskLevel: 'high',
          impact: 'Uses third-party data for ad targeting',
          recommendation: 'Disable to prevent partner data usage',
        },
        'ads-based-on-activity': {
          name: 'Ads based on your activity on Facebook Company Products',
          description: 'We use information about your activity to show you ads.',
          type: 'toggle',
          defaultValue: true,
          riskLevel: 'medium',
          impact: 'Uses your Facebook activity for ads',
          recommendation: 'Keep enabled unless you prefer generic ads',
        },
      },
    },
  },
  metadata: {
    totalSettings: 4,
    lastScrapedAt: new Date().toISOString(),
    platformVersion: 'v2024-09-04',
  },
};

export const privacyTemplateSeeds = (platformIds: { google: string; facebook: string }): NewPrivacyTemplate[] => [
  {
    platformId: platformIds.google,
    version: 'v2024-09-04',
    templateHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
    name: 'Google Privacy Settings Template',
    description: 'Comprehensive Google Account privacy settings including Activity Controls and Ads Personalization',
    settingsStructure: googlePrivacyStructure,
    aiAnalysis: {
      overallRiskScore: 65,
      keyRecommendations: [
        'Disable Location History for better privacy',
        'Turn off "Also use your activity" for ads to limit third-party sharing',
        'Review and customize your Activity Controls regularly',
      ],
      categoryScores: {
        'activity-controls': 60,
        'ads-personalization': 70,
      },
      riskFactors: [
        'Location tracking enabled by default',
        'Data sharing with advertising partners',
        'Cross-service activity tracking',
      ],
      privacyImpact: 'medium',
      generatedAt: new Date().toISOString(),
      modelUsed: 'gemini-2.5-pro',
    },
    usageCount: 0,
    activeUserCount: 0,
    isActive: true,
    createdBy: 'system',
  },
  
  {
    platformId: platformIds.facebook,
    version: 'v2024-09-04',
    templateHash: 'f1e2d3c4b5a6z7y8x9w0v1u2t3s4r5q6p7o8n9m0l1k2j3i4h5g6f7e8d9c0b1a2',
    name: 'Facebook Privacy Settings Template',
    description: 'Facebook privacy settings covering post visibility, profile discovery, and ad preferences',
    settingsStructure: facebookPrivacyStructure,
    aiAnalysis: {
      overallRiskScore: 75,
      keyRecommendations: [
        'Limit profile lookup to friends only',
        'Disable ads based on partner data',
        'Review and tighten post audience settings',
        'Regularly audit who can contact you',
      ],
      categoryScores: {
        'privacy-settings': 70,
        'ad-preferences': 80,
      },
      riskFactors: [
        'Profile discoverable by email address',
        'Third-party partner data usage for ads',
        'Default public visibility settings',
      ],
      privacyImpact: 'high',
      generatedAt: new Date().toISOString(),
      modelUsed: 'gemini-2.5-pro',
    },
    usageCount: 0,
    activeUserCount: 0,
    isActive: true,
    createdBy: 'system',
  },
];