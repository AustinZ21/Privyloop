const qs = (sel) => document.querySelector(sel);

function sendMessage(type, payload = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      resolve(response);
    });
  });
}

async function loadPlatformConfigs() {
  const res = await sendMessage('GET_PLATFORM_CONFIGS');
  const select = qs('#platform');
  const state = qs('#sync-state');
  const lastSyncEl = qs('#last-sync');
  select.innerHTML = '';
  if (res?.success && res.data) {
    const configs = res.data;
    Object.values(configs).forEach((cfg) => {
      const opt = document.createElement('option');
      opt.value = cfg.id;
      opt.textContent = `${cfg.name}`;
      select.appendChild(opt);
    });
    if (state) state.textContent = `Synced ${Object.keys(configs).length}`;
  } else {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No platforms available';
    select.appendChild(opt);
    if (state) state.textContent = 'No platforms';
  }
  // Update last sync text
  try {
    const { lastSync } = await chrome.storage.local.get(['lastSync']);
    if (lastSyncEl) lastSyncEl.textContent = lastSync ? formatRelative(lastSync) : '-';
  } catch (_) {}
}

async function detectPlatformForActiveTab() {
  const res = await sendMessage('GET_CONFIG_FOR_ACTIVE_TAB');
  if (res?.success && res.data) {
    const select = qs('#platform');
    const detected = res.data;
    const opt = Array.from(select.options).find((o) => o.value === detected.id);
    if (opt) select.value = detected.id;
    return detected;
  }
  return null;
}

async function getUserId() {
  const data = await chrome.storage.local.get(['userId']);
  return data['userId'] || '';
}

async function startScan() {
  const detected = await detectPlatformForActiveTab();
  const platformId = detected?.id || qs('#platform').value;
  if (!platformId) return;
  const userId = await getUserId();

  const scanBtn = qs('#scan');
  const status = qs('#status');
  const scanIdEl = qs('#scanId');
  const scanLabel = qs('#scan-label');

  // Request host permissions during the user gesture (required by Chrome)
  try {
    const cfgs = (await sendMessage('GET_PLATFORM_CONFIGS'))?.data || {};
    const cfg = cfgs[platformId];
    if (cfg?.permissions?.length) {
      const origins = cfg.permissions.map((p) => p.replace('*://', 'https://'));
      // Request may be denied by user; handle gracefully
      await chrome.permissions.request({ origins }).catch(() => {});
    }
  } catch (_) {}

  const ok = window.confirm('Authorize PrivyLoop to scan your current platform privacy settings?');
  if (!ok) return;
  scanBtn.disabled = true;
  scanBtn.setAttribute('aria-busy', 'true');
  status.textContent = 'Starting...';
  if (scanLabel) scanLabel.textContent = 'Starting...';

  const res = await sendMessage('OPEN_AND_START_SCAN', { platformId, userId });
  if (!res?.success) {
    status.textContent = res?.error || 'Failed to start scan';
    scanBtn.disabled = false;
    scanBtn.removeAttribute('aria-busy');
    if (scanLabel) scanLabel.textContent = 'Scan Now';
    return;
  }

  const { scanId } = res.data || {};
  scanIdEl.textContent = scanId || '-';
  status.textContent = 'In progress';

  const startedAt = Date.now();
  const poll = async () => {
    if (!scanId) return done('Unknown scan');
    const sres = await sendMessage('GET_SCAN_STATUS', { scanId });
    if (sres?.success && sres.data) {
      const { status: scanStatus } = sres.data;
      status.textContent = scanStatus || 'unknown';
      status.className = 'pill ' + (scanStatus === 'failed' ? 'pill-failed' : scanStatus === 'completed' ? '' : 'pill-running');
      if (scanStatus === 'completed' || scanStatus === 'failed') return done();
    }
    if (Date.now() - startedAt > 30_000) return done('Timeout');
    setTimeout(poll, 1500);
  };

  function done(err) {
    if (err) status.textContent = `Done (${err})`;
    scanBtn.disabled = false;
    scanBtn.removeAttribute('aria-busy');
    if (scanLabel) scanLabel.textContent = 'Scan Now';
  }

  poll();
}

async function syncConfigs() {
  const btn = qs('#sync-now');
  const state = qs('#sync-state');
  btn.disabled = true;
  btn.setAttribute('aria-busy', 'true');
  btn.textContent = 'Syncing...';
  try {
    await sendMessage('SYNC_CONFIGS');
    await loadPlatformConfigs();
    if (state) state.textContent = 'Synced';
    // Clear state hint after a moment to reduce clutter
    setTimeout(() => { if (state && state.textContent.startsWith('Synced')) state.textContent = ''; }, 1500);
  } catch (e) {
    if (state) state.textContent = 'Sync failed';
  } finally {
    btn.removeAttribute('aria-busy');
    btn.textContent = 'update now';
    btn.disabled = false;
  }
}

async function loadSettings() {
  const { enableNotifications = false, scanFrequency = 'manual' } = await chrome.storage.local.get([
    'enableNotifications',
    'scanFrequency',
  ]);
  qs('#enable-notifications').checked = !!enableNotifications;
  qs('#scan-frequency').value = scanFrequency;
}

async function saveSettings() {
  const enableNotifications = qs('#enable-notifications').checked;
  const scanFrequency = qs('#scan-frequency').value;
  await chrome.storage.local.set({ enableNotifications, scanFrequency });
}

function initSettingsUI() {
  qs('#toggle-settings').addEventListener('click', () => {
    qs('#settings').classList.toggle('hidden');
  });
  qs('#enable-notifications').addEventListener('change', saveSettings);
  qs('#scan-frequency').addEventListener('change', saveSettings);
}

async function init() {
  qs('#scan').addEventListener('click', startScan);
  const syncNow = qs('#sync-now');
  if (syncNow) syncNow.addEventListener('click', syncConfigs);
  qs('#open-dashboard').addEventListener('click', async () => {
    const url = 'http://localhost:3030/dashboard';
    await chrome.tabs.create({ url });
  });
  initSettingsUI();
  await Promise.all([loadPlatformConfigs(), loadSettings()]);
  const detected = await detectPlatformForActiveTab();
  const det = qs('#detected');
  if (det) det.textContent = detected ? `Detected: ${detected.name}` : '';

  // Auto-sync quietly if stale (> 12h)
  try {
    const { lastSync } = await chrome.storage.local.get(['lastSync']);
    const twelveHours = 12 * 60 * 60 * 1000;
    if (!lastSync || (Date.now() - lastSync) > twelveHours) {
      await syncConfigs();
    }
  } catch (_) {}
}

function formatRelative(ts) {
  try {
    const t = typeof ts === 'number' ? ts : new Date(ts).getTime();
    const diff = Math.max(0, Date.now() - t);
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'just now';
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr${hr === 1 ? '' : 's'} ago`;
    const d = Math.floor(hr / 24);
    return `${d} day${d === 1 ? '' : 's'} ago`;
  } catch { return '-'; }
}

document.addEventListener('DOMContentLoaded', init);

