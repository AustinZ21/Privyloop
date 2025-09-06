/**
 * PrivyLoop Extension Service Worker
 * Handles background tasks, API communication, and permission management
 * Manifest V3 Service Worker
 */

// Configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.privyloop.com' 
  : 'http://localhost:3000';

const STORAGE_KEYS = {
  USER_ID: 'userId',
  AUTH_TOKEN: 'authToken',
  PLATFORM_CONFIGS: 'platformConfigs',
  SCAN_QUEUE: 'scanQueue',
  LAST_SYNC: 'lastSync',
};

// Extension lifecycle
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('PrivyLoop extension installed:', details.reason);
  
  if (details.reason === 'install') {
    await initializeExtension();
  } else if (details.reason === 'update') {
    await handleUpdate(details.previousVersion);
  }
});

chrome.runtime.onStartup.addListener(async () => {
  console.log('PrivyLoop extension started');
  await syncPlatformConfigs();
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep message channel open for async response
});

// Content script communication
chrome.runtime.onConnect.addListener((port) => {
  console.log('Content script connected:', port.name);
  
  port.onMessage.addListener(async (message) => {
    await handleContentScriptMessage(message, port);
  });
});

// Tab management
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await checkForPrivacyPage(tabId, tab.url);
  }
});

/**
 * Initialize extension on first install
 */
async function initializeExtension() {
  try {
    // Set default storage values
    await chrome.storage.local.set({
      [STORAGE_KEYS.SCAN_QUEUE]: [],
      [STORAGE_KEYS.PLATFORM_CONFIGS]: {},
      [STORAGE_KEYS.LAST_SYNC]: null,
    });

    // Sync platform configurations
    await syncPlatformConfigs();

    console.log('Extension initialized successfully');
  } catch (error) {
    console.error('Error initializing extension:', error);
  }
}

/**
 * Handle extension updates
 */
async function handleUpdate(previousVersion) {
  console.log(`Extension updated from ${previousVersion} to ${chrome.runtime.getManifest().version}`);
  
  // Perform migration if needed
  // await migrateData(previousVersion);
  
  // Re-sync platform configs
  await syncPlatformConfigs();
}

/**
 * Sync platform configurations from server
 */
async function syncPlatformConfigs() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scraping/platforms`, {
      headers: await getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch platform configs: ${response.statusText}`);
    }

    const platforms = await response.json();
    const configsById = {};

    for (const platform of platforms) {
      configsById[platform.id] = {
        id: platform.id,
        name: platform.name,
        slug: platform.slug,
        scrapingConfig: platform.scrapingConfig,
        permissions: platform.manifestPermissions,
        version: platform.configVersion,
      };
    }

    await chrome.storage.local.set({
      [STORAGE_KEYS.PLATFORM_CONFIGS]: configsById,
      [STORAGE_KEYS.LAST_SYNC]: Date.now(),
    });

    console.log(`Synced ${platforms.length} platform configurations`);
  } catch (error) {
    console.error('Error syncing platform configs:', error);
  }
}

/**
 * Handle messages from popup, options, or content scripts
 */
async function handleMessage(message, sender, sendResponse) {
  try {
    const { type, payload } = message;

    switch (type) {
      case 'GET_PLATFORM_CONFIGS':
        const configs = await getPlatformConfigs();
        sendResponse({ success: true, data: configs });
        break;

      case 'REQUEST_PERMISSIONS':
        const granted = await requestPlatformPermissions(payload.platformId);
        sendResponse({ success: granted });
        break;

      case 'START_SCAN':
        const scanResult = await startPrivacyScan(payload.platformId, payload.userId);
        sendResponse({ success: true, data: scanResult });
        break;

      case 'GET_SCAN_STATUS':
        const status = await getScanStatus(payload.scanId);
        sendResponse({ success: true, data: status });
        break;

      case 'SYNC_CONFIGS':
        await syncPlatformConfigs();
        sendResponse({ success: true });
        break;

      default:
        sendResponse({ success: false, error: `Unknown message type: ${type}` });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle messages from content scripts
 */
async function handleContentScriptMessage(message, port) {
  try {
    const { type, payload } = message;

    switch (type) {
      case 'SCAN_RESULT':
        await processScanResult(payload);
        port.postMessage({ type: 'SCAN_RESULT_ACK', success: true });
        break;

      case 'SCAN_ERROR':
        await handleScanError(payload);
        port.postMessage({ type: 'SCAN_ERROR_ACK', success: true });
        break;

      case 'REQUEST_CONFIG':
        const config = await getPlatformConfigForUrl(payload.url);
        port.postMessage({ type: 'CONFIG_RESPONSE', config });
        break;

      default:
        console.warn('Unknown content script message:', type);
    }
  } catch (error) {
    console.error('Error handling content script message:', error);
    port.postMessage({ type: 'ERROR', error: error.message });
  }
}

/**
 * Check if current page is a privacy settings page
 */
async function checkForPrivacyPage(tabId, url) {
  try {
    const config = await getPlatformConfigForUrl(url);
    
    if (config) {
      // Show page action badge
      await chrome.action.setBadgeText({ tabId, text: 'SCAN' });
      await chrome.action.setBadgeBackgroundColor({ tabId, color: '#4CAF50' });
      
      // Inject content script if needed
      await ensureContentScriptInjected(tabId, config);
    } else {
      // Clear badge
      await chrome.action.setBadgeText({ tabId, text: '' });
    }
  } catch (error) {
    console.error('Error checking privacy page:', error);
  }
}

/**
 * Get platform configurations from storage
 */
async function getPlatformConfigs() {
  const result = await chrome.storage.local.get([STORAGE_KEYS.PLATFORM_CONFIGS]);
  return result[STORAGE_KEYS.PLATFORM_CONFIGS] || {};
}

/**
 * Get platform configuration for a specific URL
 */
async function getPlatformConfigForUrl(url) {
  const configs = await getPlatformConfigs();
  
  for (const config of Object.values(configs)) {
    if (config.permissions.some(pattern => matchesPattern(url, pattern))) {
      return config;
    }
  }
  
  return null;
}

/**
 * Request permissions for a platform
 */
async function requestPlatformPermissions(platformId) {
  try {
    const configs = await getPlatformConfigs();
    const config = configs[platformId];
    
    if (!config) {
      throw new Error(`Platform configuration not found: ${platformId}`);
    }

    const granted = await chrome.permissions.request({
      origins: config.permissions,
    });

    if (granted) {
      console.log(`Permissions granted for ${config.name}`);
    }

    return granted;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}

/**
 * Start privacy scan for a platform
 */
async function startPrivacyScan(platformId, userId) {
  try {
    const scanId = generateScanId();
    
    // Add to scan queue
    const queue = await getScanQueue();
    queue.push({
      scanId,
      platformId,
      userId,
      status: 'pending',
      startTime: Date.now(),
    });
    
    await chrome.storage.local.set({ [STORAGE_KEYS.SCAN_QUEUE]: queue });

    // Find active tab with platform URL
    const config = await getPlatformConfigForUrl(platformId);
    if (!config) {
      throw new Error(`Platform configuration not found: ${platformId}`);
    }

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];

    if (activeTab && matchesPlatformUrl(activeTab.url, config)) {
      // Send scan request to content script
      await chrome.tabs.sendMessage(activeTab.id, {
        type: 'START_SCAN',
        scanId,
        config,
        userId,
      });
    } else {
      throw new Error('No active tab found for platform');
    }

    return { scanId, status: 'started' };
  } catch (error) {
    console.error('Error starting privacy scan:', error);
    throw error;
  }
}

/**
 * Process scan result from content script
 */
async function processScanResult(result) {
  try {
    // Send to API
    const response = await fetch(`${API_BASE_URL}/api/scraping/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...await getAuthHeaders(),
      },
      body: JSON.stringify(result),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const apiResult = await response.json();
    console.log('Scan result processed successfully:', apiResult);

    // Update scan queue
    await updateScanStatus(result.scanId, 'completed');
  } catch (error) {
    console.error('Error processing scan result:', error);
    await updateScanStatus(result.scanId, 'failed', error.message);
  }
}

/**
 * Handle scan errors
 */
async function handleScanError(errorData) {
  console.error('Scan error received:', errorData);
  await updateScanStatus(errorData.scanId, 'failed', errorData.error);
}

/**
 * Get authentication headers
 */
async function getAuthHeaders() {
  const result = await chrome.storage.local.get([STORAGE_KEYS.AUTH_TOKEN]);
  const token = result[STORAGE_KEYS.AUTH_TOKEN];
  
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Utility functions
 */
function generateScanId() {
  return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function matchesPattern(url, pattern) {
  // Convert URL pattern to RegExp
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '\\?');
  
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(url);
}

function matchesPlatformUrl(url, config) {
  return config.permissions.some(pattern => matchesPattern(url, pattern));
}

async function getScanQueue() {
  const result = await chrome.storage.local.get([STORAGE_KEYS.SCAN_QUEUE]);
  return result[STORAGE_KEYS.SCAN_QUEUE] || [];
}

async function updateScanStatus(scanId, status, error = null) {
  const queue = await getScanQueue();
  const scanIndex = queue.findIndex(scan => scan.scanId === scanId);
  
  if (scanIndex !== -1) {
    queue[scanIndex].status = status;
    queue[scanIndex].endTime = Date.now();
    if (error) {
      queue[scanIndex].error = error;
    }
    
    await chrome.storage.local.set({ [STORAGE_KEYS.SCAN_QUEUE]: queue });
  }
}

async function getScanStatus(scanId) {
  const queue = await getScanQueue();
  return queue.find(scan => scan.scanId === scanId) || null;
}

async function ensureContentScriptInjected(tabId, config) {
  try {
    // Check if content script is already injected
    await chrome.tabs.sendMessage(tabId, { type: 'PING' });
  } catch (error) {
    // Content script not injected, inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/privacy-scanner.js'],
      });
    } catch (injectionError) {
      console.error('Failed to inject content script:', injectionError);
    }
  }
}