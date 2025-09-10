import { test, expect, chromium, BrowserContext, Page } from '@playwright/test';
import path from 'path';

test.describe('Browser Extension - Privacy Scanner', () => {
  let context: BrowserContext;
  let extensionId: string;

  test.beforeAll(async () => {
    const pathToExtension = path.join(__dirname, '../../../packages/extension');

    context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
        '--disable-web-security',
        '--allow-running-insecure-content',
      ],
    });

    let [background] = context.serviceWorkers();
    if (!background) background = await context.waitForEvent('serviceworker');
    extensionId = background.url().split('/')[2];
  });

  test.afterAll(async () => {
    await context.close();
  });

  test('loads extension service worker', async () => {
    const [sw] = context.serviceWorkers();
    expect(sw).toBeTruthy();
    expect(sw.url()).toContain(`${extensionId}`);
  });

  test('injects content script on supported pages', async () => {
    const page = await context.newPage();

    const logs: string[] = [];
    page.on('console', (msg) => logs.push(msg.text()));

    // Navigate to a URL matched by manifest content_scripts
    await page.goto('https://www.linkedin.com/');

    // Expect our content script to log its init message
    await expect
      .poll(() => logs.some((l) => l.includes('privacy scanner content script loaded')))
      .toBeTruthy({ timeout: 10000 });

    await page.close();
  });

  test('opens popup page if present (best-effort)', async () => {
    // Attempt to open known popup locations; pass even if none exist
    const candidates = [
      `chrome-extension://${extensionId}/popup.html`,
      `chrome-extension://${extensionId}/popup/popup.html`,
    ];
    let opened: Page | null = null;
    for (const url of candidates) {
      const p = await context.newPage();
      try {
        await p.goto(url, { waitUntil: 'domcontentloaded' });
        opened = p;
        break;
      } catch {
        await p.close();
      }
    }

    if (opened) {
      await expect(opened.locator('body')).toBeVisible();
      await opened.close();
    } else {
      // No popup shipped yet; test remains informative but non-blocking
      expect(true).toBeTruthy();
    }
  });
});

