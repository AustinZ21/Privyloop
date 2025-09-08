/**
 * Centralized selectors for E2E tests
 * This helps maintain consistency and makes updates easier
 */

export const SELECTORS = {
  // Authentication selectors
  auth: {
    // Login page
    loginForm: '[data-testid="login-form"]',
    loginEmailInput: '[data-testid="login-email"]',
    loginPasswordInput: '[data-testid="login-password"]',
    loginSubmitButton: '[data-testid="login-submit"]',
    loginErrorMessage: '[data-testid="login-error"]',
    
    // Register page
    registerForm: '[data-testid="register-form"]',
    registerEmailInput: '[data-testid="register-email"]',
    registerPasswordInput: '[data-testid="register-password"]',
    registerFirstNameInput: '[data-testid="register-first-name"]',
    registerLastNameInput: '[data-testid="register-last-name"]',
    registerSubmitButton: '[data-testid="register-submit"]',
    registerErrorMessage: '[data-testid="register-error"]',
    
    // Email verification
    verificationMessage: '[data-testid="verification-message"]',
    verificationResendButton: '[data-testid="resend-verification"]',
    
    // Social auth
    googleAuthButton: '[data-testid="google-auth"]',
    githubAuthButton: '[data-testid="github-auth"]',
    microsoftAuthButton: '[data-testid="microsoft-auth"]',
    
    // Navigation
    loginLink: '[data-testid="login-link"]',
    registerLink: '[data-testid="register-link"]',
    logoutButton: '[data-testid="logout-button"]'
  },

  // Dashboard selectors
  dashboard: {
    // Main navigation
    mainNav: '[data-testid="main-nav"]',
    dashboardLink: '[data-testid="nav-dashboard"]',
    policiesLink: '[data-testid="nav-policies"]',
    settingsLink: '[data-testid="nav-settings"]',
    
    // Dashboard content
    dashboardContainer: '[data-testid="dashboard-container"]',
    welcomeMessage: '[data-testid="welcome-message"]',
    statsContainer: '[data-testid="stats-container"]',
    recentActivities: '[data-testid="recent-activities"]',
    
    // User menu
    userMenu: '[data-testid="user-menu"]',
    userMenuTrigger: '[data-testid="user-menu-trigger"]',
    profileLink: '[data-testid="profile-link"]',
    
    // Policy tracking
    policyList: '[data-testid="policy-list"]',
    policyCard: '[data-testid="policy-card"]',
    addPolicyButton: '[data-testid="add-policy-button"]',
    
    // Search
    searchInput: '[data-testid="search-input"]',
    searchResults: '[data-testid="search-results"]'
  },

  // Browser extension selectors
  extension: {
    // Extension popup
    extensionPopup: '[data-testid="extension-popup"]',
    scanButton: '[data-testid="scan-button"]',
    scanResults: '[data-testid="scan-results"]',
    
    // Privacy scanner results
    privacyScore: '[data-testid="privacy-score"]',
    threatLevel: '[data-testid="threat-level"]',
    recommendationsContainer: '[data-testid="recommendations"]',
    
    // Settings in extension
    extensionSettings: '[data-testid="extension-settings"]',
    enableNotifications: '[data-testid="enable-notifications"]',
    scanFrequency: '[data-testid="scan-frequency"]',
    
    // Dashboard link from extension
    openDashboardButton: '[data-testid="open-dashboard"]'
  },

  // Common UI components
  common: {
    // Loading states
    loadingSpinner: '[data-testid="loading-spinner"]',
    loadingOverlay: '[data-testid="loading-overlay"]',
    
    // Toast notifications
    toast: '[data-testid="toast"]',
    toastMessage: '[data-testid="toast-message"]',
    toastCloseButton: '[data-testid="toast-close"]',
    
    // Modals/dialogs
    modal: '[data-testid="modal"]',
    modalOverlay: '[data-testid="modal-overlay"]',
    modalCloseButton: '[data-testid="modal-close"]',
    modalConfirmButton: '[data-testid="modal-confirm"]',
    modalCancelButton: '[data-testid="modal-cancel"]',
    
    // Form elements
    submitButton: '[data-testid="submit-button"]',
    cancelButton: '[data-testid="cancel-button"]',
    errorMessage: '[data-testid="error-message"]',
    successMessage: '[data-testid="success-message"]',
    
    // Navigation
    breadcrumb: '[data-testid="breadcrumb"]',
    backButton: '[data-testid="back-button"]',
    
    // Tables
    table: '[data-testid="table"]',
    tableHeader: '[data-testid="table-header"]',
    tableRow: '[data-testid="table-row"]',
    tableCell: '[data-testid="table-cell"]'
  }
} as const;

// Helper function to get selector by path
export function getSelector(path: string): string {
  const keys = path.split('.');
  let current: any = SELECTORS;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      throw new Error(`Selector not found: ${path}`);
    }
  }
  
  if (typeof current !== 'string') {
    throw new Error(`Selector path "${path}" does not resolve to a string`);
  }
  
  return current;
}