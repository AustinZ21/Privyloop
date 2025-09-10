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
  select.innerHTML = '';
  if (res?.success && res.data) {
    const configs = res.data;
    Object.values(configs).forEach((cfg) => {
      const opt = document.createElement('option');
      opt.value = cfg.id;
      opt.textContent = `${cfg.name}`;
      select.appendChild(opt);
    });
  } else {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No platforms available';
    select.appendChild(opt);
  }
}

async function detectPlatformForActiveTab() {
  const res = await sendMessage('GET_CONFIG_FOR_ACTIVE_TAB');
  if (res?.success && res.data) {
    const select = qs('#platform');
    const detected = res.data;
    const opt = Array.from(select.options).find(o => o.value === detected.id);
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
  // Try to auto-detect based on active tab; fallback to selected
  const detected = await detectPlatformForActiveTab();
  const platformId = detected?.id || qs('#platform').value;
  if (!platformId) return;
  const userId = await getUserId();

  const scanBtn = qs('#scan');
  const status = qs('#status');
  const scanIdEl = qs('#scanId');

  // Simple consent prompt (can be replaced with a nicer modal)
  const ok = window.confirm('Authorize PrivyLoop to scan your current platform privacy settings?');
  if (!ok) return;
  scanBtn.disabled = true;
  status.textContent = 'Starting...';

  const res = await sendMessage('OPEN_AND_START_SCAN', { platformId, userId });
  if (!res?.success) {
    status.textContent = res?.error || 'Failed to start scan';
    scanBtn.disabled = false;
    return;
  }

  const { scanId } = res.data || {};
  scanIdEl.textContent = scanId || '—';
  status.textContent = 'In progress';

  // Poll status up to 30s
  const startedAt = Date.now();
  const poll = async () => {
    if (!scanId) return done('Unknown scan');
    const sres = await sendMessage('GET_SCAN_STATUS', { scanId });
    if (sres?.success && sres.data) {
      const { status: scanStatus } = sres.data;
      status.textContent = scanStatus || 'unknown';
      if (scanStatus === 'completed' || scanStatus === 'failed') return done();
    }
    if (Date.now() - startedAt > 30_000) return done('Timeout');
    setTimeout(poll, 1500);
  };

  function done(err) {
    if (err) status.textContent = `Done (${err})`;
    scanBtn.disabled = false;
  }

  poll();
}

async function syncConfigs() {
  const btn = qs('#sync');
  btn.disabled = true;
  await sendMessage('SYNC_CONFIGS');
  await loadPlatformConfigs();
  btn.disabled = false;
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
  qs('#sync').addEventListener('click', syncConfigs);
  qs('#open-dashboard').addEventListener('click', async () => {
    const url = 'http://localhost:3030/dashboard';
    await chrome.tabs.create({ url });
  });
  initSettingsUI();
  await Promise.all([loadPlatformConfigs(), loadSettings()]);
  // Auto-detect platform on load to preselect
  await detectPlatformForActiveTab();
}

document.addEventListener('DOMContentLoaded', init);


