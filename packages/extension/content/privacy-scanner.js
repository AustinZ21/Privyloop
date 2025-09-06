/**
 * PrivyLoop Privacy Scanner Content Script
 * Extracts privacy settings from platform pages using template-based system
 * Runs on supported privacy settings pages
 */

// Content script state
let scanningActive = false;
let currentConfig = null;
let backgroundPort = null;

// Platform-specific scrapers
const platformScrapers = {
  google: new GoogleContentScraper(),
  facebook: new FacebookContentScraper(),
  linkedin: new LinkedInContentScraper(),
};

// Initialize content script
(function initialize() {
  console.log('PrivyLoop privacy scanner content script loaded');
  
  // Connect to background script
  backgroundPort = chrome.runtime.connect({ name: 'privacy-scanner' });
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Request platform configuration
  requestPlatformConfig();
  
  // Set up page monitoring
  observePageChanges();
})();

/**
 * Handle messages from background script
 */
function handleMessage(message, sender, sendResponse) {
  const { type, ...payload } = message;
  
  switch (type) {
    case 'START_SCAN':
      handleScanRequest(payload);
      sendResponse({ received: true });
      break;
      
    case 'PING':
      sendResponse({ pong: true });
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
  
  return true;
}

/**
 * Request platform configuration from background script
 */
function requestPlatformConfig() {
  backgroundPort.postMessage({
    type: 'REQUEST_CONFIG',
    payload: { url: window.location.href }
  });
}

/**
 * Handle scan request from background script
 */
async function handleScanRequest({ scanId, config, userId }) {
  if (scanningActive) {
    console.log('Scan already in progress, ignoring request');
    return;
  }
  
  scanningActive = true;
  currentConfig = config;
  
  try {
    console.log(`Starting privacy scan for ${config.name}...`);
    
    const result = await performPrivacyScan(scanId, config, userId);
    
    // Send result to background script
    backgroundPort.postMessage({
      type: 'SCAN_RESULT',
      payload: result
    });
    
    console.log('Privacy scan completed successfully');
  } catch (error) {
    console.error('Privacy scan failed:', error);
    
    // Send error to background script
    backgroundPort.postMessage({
      type: 'SCAN_ERROR',
      payload: {
        scanId,
        error: error.message,
        stack: error.stack,
        url: window.location.href
      }
    });
  } finally {
    scanningActive = false;
  }
}

/**
 * Perform the actual privacy scan
 */
async function performPrivacyScan(scanId, config, userId) {
  const startTime = Date.now();
  
  // Get platform-specific scraper
  const scraper = platformScrapers[config.slug];
  if (!scraper) {
    throw new Error(`No scraper available for platform: ${config.slug}`);
  }
  
  // Wait for page to be ready
  await waitForPageReady();
  
  // Extract privacy settings
  const extractedSettings = await scraper.extractSettings(config.scrapingConfig);
  
  // Validate extracted settings
  const isValid = scraper.validateSettings(extractedSettings, config.scrapingConfig);
  if (!isValid) {
    console.warn('Extracted settings failed validation');
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  return {
    scanId,
    userId,
    platformId: config.id,
    method: 'extension',
    extractedSettings,
    metadata: {
      url: window.location.href,
      userAgent: navigator.userAgent,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      duration,
      elementsFound: countExtractedElements(extractedSettings),
      elementsExpected: Object.keys(config.scrapingConfig.selectors).length,
      confidenceScore: calculateConfidenceScore(extractedSettings, config.scrapingConfig)
    }
  };
}

/**
 * Base scraper class with common functionality
 */
class BasePlatformScraper {
  
  async extractSettings(scrapingConfig) {
    const settings = {};
    const { selectors } = scrapingConfig;
    
    for (const [settingKey, selectorConfig] of Object.entries(selectors)) {
      try {
        const value = await this.extractSetting(settingKey, selectorConfig);
        if (value !== null) {
          const category = this.categorizeSettingKey(settingKey);
          if (!settings[category]) {
            settings[category] = {};
          }
          settings[category][settingKey] = value;
        }
      } catch (error) {
        console.warn(`Failed to extract setting ${settingKey}:`, error);
      }
    }
    
    return settings;
  }
  
  async extractSetting(settingKey, selectorConfig) {
    const { selector, type, expectedValues } = selectorConfig;
    
    // Wait for element with timeout
    const element = await this.waitForElement(selector, 5000);
    if (!element) {
      console.warn(`Element not found for ${settingKey}: ${selector}`);
      return null;
    }
    
    switch (type) {
      case 'toggle':
        return this.extractToggleValue(element);
      case 'radio':
        return this.extractRadioValue(element, expectedValues);
      case 'select':
        return this.extractSelectValue(element, expectedValues);
      case 'text':
        return this.extractTextValue(element);
      default:
        console.warn(`Unknown setting type: ${type}`);
        return null;
    }
  }
  
  async waitForElement(selector, timeout = 5000) {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }
      
      const observer = new MutationObserver((mutations, obs) => {
        const element = document.querySelector(selector);
        if (element) {
          obs.disconnect();
          resolve(element);
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
      
      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }
  
  extractToggleValue(element) {
    if (element.hasAttribute('aria-checked')) {
      return element.getAttribute('aria-checked') === 'true';
    }
    
    if (element.type === 'checkbox') {
      return element.checked;
    }
    
    // Platform-specific toggle detection
    return this.detectToggleState(element);
  }
  
  extractRadioValue(element, expectedValues) {
    if (element.type === 'radio' && element.checked) {
      return element.value;
    }
    
    // Find checked radio in group
    const name = element.name || element.getAttribute('data-name');
    if (name) {
      const checked = document.querySelector(`input[name="${name}"]:checked`);
      return checked ? checked.value : null;
    }
    
    return null;
  }
  
  extractSelectValue(element, expectedValues) {
    if (element.tagName === 'SELECT') {
      return element.value;
    }
    
    // Custom select elements
    const selectedText = element.textContent?.trim() || 
                        element.getAttribute('data-value') ||
                        element.getAttribute('aria-label');
    
    if (expectedValues && selectedText) {
      return expectedValues.find(val => 
        selectedText.toLowerCase().includes(val.toLowerCase())
      ) || selectedText;
    }
    
    return selectedText;
  }
  
  extractTextValue(element) {
    return element.value || element.textContent?.trim() || element.getAttribute('data-value');
  }
  
  categorizeSettingKey(settingKey) {
    const key = settingKey.toLowerCase();
    
    if (key.includes('ad') || key.includes('marketing')) return 'advertising';
    if (key.includes('location') || key.includes('geo')) return 'location';
    if (key.includes('activity') || key.includes('history')) return 'activity';
    if (key.includes('data') || key.includes('privacy')) return 'data-privacy';
    
    return 'general';
  }
  
  validateSettings(settings, scrapingConfig) {
    let validCount = 0;
    let totalCount = 0;
    
    for (const category of Object.values(settings)) {
      for (const [settingKey, value] of Object.entries(category)) {
        totalCount++;
        const selectorConfig = scrapingConfig.selectors[settingKey];
        
        if (selectorConfig && this.validateSettingValue(value, selectorConfig)) {
          validCount++;
        }
      }
    }
    
    return totalCount > 0 ? (validCount / totalCount) >= 0.7 : false;
  }
  
  validateSettingValue(value, selectorConfig) {
    const { type, expectedValues } = selectorConfig;
    
    switch (type) {
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
  
  detectToggleState(element) {
    // Override in platform-specific scrapers
    return false;
  }
}

/**
 * Google-specific scraper
 */
class GoogleContentScraper extends BasePlatformScraper {
  
  detectToggleState(element) {
    // Google uses specific classes and attributes for toggles
    if (element.getAttribute('aria-checked')) {
      return element.getAttribute('aria-checked') === 'true';
    }
    
    // Check for Google-specific toggle indicators
    const toggleButton = element.querySelector('[role="switch"]') || element;
    if (toggleButton.hasAttribute('aria-pressed')) {
      return toggleButton.getAttribute('aria-pressed') === 'true';
    }
    
    // Visual indicators
    if (element.classList.contains('VfPpkd-ksKsZd-mWPk3d-OWXEXe-AHe6Kc-XpnDCe') || 
        element.querySelector('.VfPpkd-ksKsZd-mWPk3d-OWXEXe-AHe6Kc-XpnDCe')) {
      return true;
    }
    
    return false;
  }
  
  categorizeSettingKey(settingKey) {
    const key = settingKey.toLowerCase();
    
    if (key.includes('web-activity') || key.includes('youtube')) return 'activity-controls';
    if (key.includes('location')) return 'location';
    if (key.includes('ad')) return 'advertising';
    
    return super.categorizeSettingKey(settingKey);
  }
}

/**
 * Facebook-specific scraper
 */
class FacebookContentScraper extends BasePlatformScraper {
  
  detectToggleState(element) {
    if (element.getAttribute('aria-checked')) {
      return element.getAttribute('aria-checked') === 'true';
    }
    
    // Facebook toggle classes
    if (element.classList.contains('_5dsk')) return true;
    if (element.classList.contains('_5dsm')) return false;
    
    const input = element.querySelector('input[type="checkbox"]');
    if (input) return input.checked;
    
    return false;
  }
  
  categorizeSettingKey(settingKey) {
    const key = settingKey.toLowerCase();
    
    if (key.includes('future-posts') || key.includes('timeline')) return 'privacy';
    if (key.includes('friend')) return 'privacy';
    if (key.includes('ad')) return 'advertising';
    if (key.includes('apps')) return 'apps-websites';
    
    return super.categorizeSettingKey(settingKey);
  }
}

/**
 * LinkedIn-specific scraper
 */
class LinkedInContentScraper extends BasePlatformScraper {
  
  detectToggleState(element) {
    if (element.type === 'checkbox') {
      return element.checked;
    }
    
    if (element.getAttribute('aria-checked')) {
      return element.getAttribute('aria-checked') === 'true';
    }
    
    const checkbox = element.querySelector('input[type="checkbox"]');
    if (checkbox) return checkbox.checked;
    
    return false;
  }
  
  categorizeSettingKey(settingKey) {
    const key = settingKey.toLowerCase();
    
    if (key.includes('public-profile') || key.includes('profile')) return 'profile-privacy';
    if (key.includes('activity') || key.includes('broadcast')) return 'activity';
    if (key.includes('ad') || key.includes('interest')) return 'advertising';
    if (key.includes('data') || key.includes('research')) return 'data-privacy';
    
    return super.categorizeSettingKey(settingKey);
  }
}

/**
 * Wait for page to be ready for scanning
 */
async function waitForPageReady(timeout = 10000) {
  return new Promise((resolve) => {
    if (document.readyState === 'complete') {
      setTimeout(resolve, 1000); // Wait a bit more for dynamic content
      return;
    }
    
    const checkReady = () => {
      if (document.readyState === 'complete') {
        setTimeout(resolve, 1000);
      }
    };
    
    document.addEventListener('readystatechange', checkReady);
    
    setTimeout(() => {
      document.removeEventListener('readystatechange', checkReady);
      resolve();
    }, timeout);
  });
}

/**
 * Observe page changes for dynamic content
 */
function observePageChanges() {
  const observer = new MutationObserver((mutations) => {
    // Check if privacy settings content has changed
    const hasRelevantChanges = mutations.some(mutation => {
      return mutation.addedNodes.length > 0 || 
             mutation.removedNodes.length > 0 ||
             (mutation.type === 'attributes' && 
              ['aria-checked', 'checked', 'selected'].includes(mutation.attributeName));
    });
    
    if (hasRelevantChanges && currentConfig && !scanningActive) {
      console.log('Page content changed, settings may have updated');
      // Could trigger automatic re-scan here if needed
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-checked', 'checked', 'selected', 'aria-pressed']
  });
}

/**
 * Utility functions
 */
function countExtractedElements(settings) {
  let count = 0;
  for (const category of Object.values(settings)) {
    count += Object.keys(category).length;
  }
  return count;
}

function calculateConfidenceScore(settings, scrapingConfig) {
  const expectedCount = Object.keys(scrapingConfig.selectors).length;
  const extractedCount = countExtractedElements(settings);
  
  if (expectedCount === 0) return 1;
  
  const completionRatio = extractedCount / expectedCount;
  
  // Penalize low completion rates
  if (completionRatio < 0.5) return completionRatio * 0.5;
  
  return Math.min(completionRatio, 1);
}

// Export for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    GoogleContentScraper,
    FacebookContentScraper,
    LinkedInContentScraper,
    BasePlatformScraper
  };
}