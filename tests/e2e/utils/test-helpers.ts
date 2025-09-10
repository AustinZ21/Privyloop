import { Page, expect } from '@playwright/test';

/**
 * Common test utilities for E2E tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Generate a unique test email
   */
  static generateTestEmail(): string {
    const timestamp = Date.now();
    return `test-${timestamp}@privyloop-test.com`;
  }

  /**
   * Generate a secure test password
   */
  static generateTestPassword(): string {
    return `TestPass123!${Date.now()}`;
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /**
   * Fill form field with proper validation
   */
  async fillField(selector: string, value: string): Promise<void> {
    const field = this.page.locator(selector);
    await field.waitFor({ state: 'visible' });
    await field.clear();
    await field.fill(value);
    await expect(field).toHaveValue(value);
  }

  /**
   * Click button and wait for action completion
   */
  async clickButton(selector: string): Promise<void> {
    const button = this.page.locator(selector);
    await button.waitFor({ state: 'visible' });
    await expect(button).toBeEnabled();
    await button.click();
  }

  /**
   * Wait for toast notification
   */
  async waitForToast(message?: string): Promise<void> {
    const toast = this.page.locator('[data-testid="toast"], .toast, [role="alert"]');
    await toast.waitFor({ state: 'visible' });
    
    if (message) {
      await expect(toast).toContainText(message);
    }
  }

  /**
   * Check for error messages
   */
  async expectError(message?: string): Promise<void> {
    const errorElement = this.page.locator('[data-testid="error"], .error, [role="alert"][aria-live="assertive"]');
    await errorElement.waitFor({ state: 'visible' });
    
    if (message) {
      await expect(errorElement).toContainText(message);
    }
  }

  /**
   * Navigate and wait for authentication state
   */
  async navigateAndWaitForAuth(path: string, expectAuthenticated: boolean): Promise<void> {
    await this.page.goto(path);
    await this.waitForPageLoad();

    if (expectAuthenticated) {
      // Should not be redirected to login
      expect(this.page.url()).not.toContain('/auth/login');
    } else {
      // Should be redirected to login for protected routes
      if (path !== '/auth/login' && path !== '/auth/register' && path !== '/') {
        expect(this.page.url()).toContain('/auth/login');
      }
    }
  }

  /**
   * Clear all application data
   */
  async clearApplicationData(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      // Clear cookies
      document.cookie.split(";").forEach((c) => {
        const eqPos = c.indexOf("=");
        const name = eqPos > -1 ? c.substr(0, eqPos) : c;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
    });
  }

  /**
   * Take screenshot for debugging
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ 
      path: `tests/e2e/screenshots/${name}-${Date.now()}.png`,
      fullPage: true 
    });
  }

  /**
   * Check if element exists without throwing
   */
  async elementExists(selector: string): Promise<boolean> {
    try {
      await this.page.locator(selector).waitFor({ state: 'attached', timeout: 1000 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current URL path
   */
  getCurrentPath(): string {
    return new URL(this.page.url()).pathname;
  }

  /**
   * Wait for navigation to complete
   */
  async waitForNavigation(): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState('networkidle'),
      this.page.waitForLoadState('domcontentloaded')
    ]);
  }
}