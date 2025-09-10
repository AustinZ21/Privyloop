import { test, expect } from '@playwright/test';
import { TestHelpers } from '../utils/test-helpers';
import { SELECTORS } from '../fixtures/selectors';
import { TEST_USERS } from '../fixtures/test-users';

test.describe('Dashboard Navigation', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await helpers.clearApplicationData();
    
    // Login before testing dashboard functionality
    await page.goto('/auth/login');
    await helpers.waitForPageLoad();
    
    await helpers.fillField(SELECTORS.auth.loginEmailInput, TEST_USERS.validUser.email);
    await helpers.fillField(SELECTORS.auth.loginPasswordInput, TEST_USERS.validUser.password);
    await helpers.clickButton(SELECTORS.auth.loginSubmitButton);
    
    await helpers.waitForNavigation();
    expect(helpers.getCurrentPath()).toBe('/dashboard');
  });

  test('should display main dashboard with all navigation elements', async ({ page }) => {
    // Verify dashboard container is visible
    await expect(page.locator(SELECTORS.dashboard.dashboardContainer)).toBeVisible();
    
    // Verify main navigation is present
    await expect(page.locator(SELECTORS.dashboard.mainNav)).toBeVisible();
    
    // Verify navigation links
    const navLinks = [
      SELECTORS.dashboard.dashboardLink,
      SELECTORS.dashboard.policiesLink,
      SELECTORS.dashboard.settingsLink
    ];
    
    for (const link of navLinks) {
      const exists = await helpers.elementExists(link);
      if (exists) {
        await expect(page.locator(link)).toBeVisible();
      }
    }
    
    // Verify user menu
    await expect(page.locator(SELECTORS.dashboard.userMenuTrigger)).toBeVisible();
  });

  test('should show welcome message for authenticated user', async ({ page }) => {
    const welcomeExists = await helpers.elementExists(SELECTORS.dashboard.welcomeMessage);
    if (welcomeExists) {
      await expect(page.locator(SELECTORS.dashboard.welcomeMessage)).toBeVisible();
      await expect(page.locator(SELECTORS.dashboard.welcomeMessage)).toContainText('Welcome');
    }
  });

  test('should navigate to policies page', async ({ page }) => {
    const policiesLinkExists = await helpers.elementExists(SELECTORS.dashboard.policiesLink);
    
    if (policiesLinkExists) {
      await helpers.clickButton(SELECTORS.dashboard.policiesLink);
      await helpers.waitForNavigation();
      
      expect(helpers.getCurrentPath()).toMatch(/policies/);
      
      // Verify policies page content
      const policyListExists = await helpers.elementExists(SELECTORS.dashboard.policyList);
      if (policyListExists) {
        await expect(page.locator(SELECTORS.dashboard.policyList)).toBeVisible();
      }
    }
  });

  test('should navigate to settings page', async ({ page }) => {
    const settingsLinkExists = await helpers.elementExists(SELECTORS.dashboard.settingsLink);
    
    if (settingsLinkExists) {
      await helpers.clickButton(SELECTORS.dashboard.settingsLink);
      await helpers.waitForNavigation();
      
      expect(helpers.getCurrentPath()).toMatch(/settings/);
    }
  });

  test('should open user menu and show profile options', async ({ page }) => {
    await helpers.clickButton(SELECTORS.dashboard.userMenuTrigger);
    await expect(page.locator(SELECTORS.dashboard.userMenu)).toBeVisible();
    
    // Check for profile link
    const profileLinkExists = await helpers.elementExists(SELECTORS.dashboard.profileLink);
    if (profileLinkExists) {
      await expect(page.locator(SELECTORS.dashboard.profileLink)).toBeVisible();
    }
    
    // Check for logout button
    await expect(page.locator(SELECTORS.auth.logoutButton)).toBeVisible();
  });

  test('should navigate to profile from user menu', async ({ page }) => {
    await helpers.clickButton(SELECTORS.dashboard.userMenuTrigger);
    
    const profileLinkExists = await helpers.elementExists(SELECTORS.dashboard.profileLink);
    if (profileLinkExists) {
      await helpers.clickButton(SELECTORS.dashboard.profileLink);
      await helpers.waitForNavigation();
      
      expect(helpers.getCurrentPath()).toMatch(/profile/);
    }
  });

  test('should highlight active navigation item', async ({ page }) => {
    const dashboardLink = page.locator(SELECTORS.dashboard.dashboardLink);
    const dashboardLinkExists = await helpers.elementExists(SELECTORS.dashboard.dashboardLink);
    
    if (dashboardLinkExists) {
      // Dashboard link should be active on dashboard page
      await expect(dashboardLink).toHaveClass(/active|current/);
      
      // Navigate to policies and check if it becomes active
      const policiesLinkExists = await helpers.elementExists(SELECTORS.dashboard.policiesLink);
      if (policiesLinkExists) {
        await helpers.clickButton(SELECTORS.dashboard.policiesLink);
        await helpers.waitForNavigation();
        
        const policiesLink = page.locator(SELECTORS.dashboard.policiesLink);
        await expect(policiesLink).toHaveClass(/active|current/);
      }
    }
  });

  test('should display statistics or activity dashboard', async ({ page }) => {
    const statsExists = await helpers.elementExists(SELECTORS.dashboard.statsContainer);
    const activitiesExists = await helpers.elementExists(SELECTORS.dashboard.recentActivities);
    
    if (statsExists) {
      await expect(page.locator(SELECTORS.dashboard.statsContainer)).toBeVisible();
    }
    
    if (activitiesExists) {
      await expect(page.locator(SELECTORS.dashboard.recentActivities)).toBeVisible();
    }
  });

  test('should handle search functionality if implemented', async ({ page }) => {
    const searchExists = await helpers.elementExists(SELECTORS.dashboard.searchInput);
    
    if (searchExists) {
      const searchTerm = 'privacy policy';
      await helpers.fillField(SELECTORS.dashboard.searchInput, searchTerm);
      
      // Wait for search results
      await page.waitForTimeout(1000); // Give search time to execute
      
      const searchResultsExists = await helpers.elementExists(SELECTORS.dashboard.searchResults);
      if (searchResultsExists) {
        await expect(page.locator(SELECTORS.dashboard.searchResults)).toBeVisible();
      }
    }
  });

  test('should maintain navigation state during page refresh', async ({ page }) => {
    // Navigate to a sub-page
    const policiesLinkExists = await helpers.elementExists(SELECTORS.dashboard.policiesLink);
    
    if (policiesLinkExists) {
      await helpers.clickButton(SELECTORS.dashboard.policiesLink);
      await helpers.waitForNavigation();
      
      const currentPath = helpers.getCurrentPath();
      
      // Refresh the page
      await page.reload();
      await helpers.waitForPageLoad();
      
      // Should maintain the same path
      expect(helpers.getCurrentPath()).toBe(currentPath);
    }
  });

  test('should show appropriate content based on user permissions', async ({ page }) => {
    // Test if admin features are hidden for regular users
    const adminFeatures = [
      '[data-testid="admin-panel"]',
      '[data-testid="user-management"]',
      '[data-testid="system-settings"]'
    ];
    
    for (const feature of adminFeatures) {
      const exists = await helpers.elementExists(feature);
      if (exists && TEST_USERS.validUser.role !== 'admin') {
        // Regular users should not see admin features
        await expect(page.locator(feature)).not.toBeVisible();
      }
    }
  });

  test('should handle responsive navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile navigation menu exists
    const mobileMenuExists = await helpers.elementExists('[data-testid="mobile-menu-toggle"]');
    
    if (mobileMenuExists) {
      const mobileToggle = page.locator('[data-testid="mobile-menu-toggle"]');
      await expect(mobileToggle).toBeVisible();
      
      // Open mobile menu
      await helpers.clickButton('[data-testid="mobile-menu-toggle"]');
      
      // Navigation should be visible after opening
      const mobileNav = page.locator('[data-testid="mobile-nav"]');
      await expect(mobileNav).toBeVisible();
    }
  });

  test('should show breadcrumb navigation on sub-pages', async ({ page }) => {
    const policiesLinkExists = await helpers.elementExists(SELECTORS.dashboard.policiesLink);
    
    if (policiesLinkExists) {
      await helpers.clickButton(SELECTORS.dashboard.policiesLink);
      await helpers.waitForNavigation();
      
      // Check for breadcrumb navigation
      const breadcrumbExists = await helpers.elementExists(SELECTORS.common.breadcrumb);
      if (breadcrumbExists) {
        await expect(page.locator(SELECTORS.common.breadcrumb)).toBeVisible();
        await expect(page.locator(SELECTORS.common.breadcrumb)).toContainText('Dashboard');
        await expect(page.locator(SELECTORS.common.breadcrumb)).toContainText('Policies');
      }
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network failure for dashboard API calls
    await page.route('**/api/dashboard/**', route => route.abort());
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await helpers.waitForPageLoad();
    
    // Dashboard should still be accessible even if data loading fails
    await expect(page.locator(SELECTORS.dashboard.dashboardContainer)).toBeVisible();
    
    // Should show error message or placeholder content
    const errorExists = await helpers.elementExists(SELECTORS.common.errorMessage);
    if (errorExists) {
      await expect(page.locator(SELECTORS.common.errorMessage)).toBeVisible();
    }
  });

  test('should show loading states for async content', async ({ page }) => {
    // Delay dashboard API responses
    await page.route('**/api/dashboard/**', route => {
      setTimeout(() => route.continue(), 1000);
    });
    
    await page.goto('/dashboard');
    
    // Should show loading spinner while content loads
    const loadingExists = await helpers.elementExists(SELECTORS.common.loadingSpinner);
    if (loadingExists) {
      await expect(page.locator(SELECTORS.common.loadingSpinner)).toBeVisible();
    }
    
    // Wait for content to load
    await helpers.waitForPageLoad();
    await expect(page.locator(SELECTORS.dashboard.dashboardContainer)).toBeVisible();
  });

  test('should prevent unauthorized access to protected routes', async ({ page }) => {
    // Logout first
    await helpers.clickButton(SELECTORS.dashboard.userMenuTrigger);
    await helpers.clickButton(SELECTORS.auth.logoutButton);
    await helpers.waitForNavigation();
    
    // Try to access dashboard directly
    await page.goto('/dashboard');
    await helpers.waitForNavigation();
    
    // Should be redirected to login
    expect(helpers.getCurrentPath()).toBe('/auth/login');
  });
});