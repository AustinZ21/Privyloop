/**
 * reCAPTCHA v3 Integration - Enterprise bot protection
 * Military-grade security with feature flag controls
 */

// Try core module first, fallback to local implementation
let getFeatureFlags: () => any;
try {
  ({ getFeatureFlags } = require('@privyloop/core/features'));
} catch {
  ({ getFeatureFlags } = require('./feature-flags'));
}

declare global {
  interface Window {
    grecaptcha: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
      render: (element: string | HTMLElement, options: any) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

interface RecaptchaConfig {
  siteKey: string;
  enabled: boolean;
  threshold: number; // Minimum score threshold (0.0 - 1.0)
  actions: {
    login: string;
    signup: string;
    forgotPassword: string;
    resetPassword: string;
  };
}

interface RecaptchaResponse {
  token: string;
  action: string;
  score?: number;
}

class RecaptchaService {
  private static instance: RecaptchaService;
  private config: RecaptchaConfig;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  private constructor() {
    this.config = this.getConfig();
  }

  public static getInstance(): RecaptchaService {
    if (!RecaptchaService.instance) {
      RecaptchaService.instance = new RecaptchaService();
    }
    return RecaptchaService.instance;
  }

  private getConfig(): RecaptchaConfig {
    const featureFlags = getFeatureFlags();
    
    return {
      siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '',
      enabled: featureFlags.recaptcha?.enabled || false,
      threshold: featureFlags.recaptcha?.threshold || 0.5,
      actions: {
        login: 'login',
        signup: 'signup',
        forgotPassword: 'forgot_password',
        resetPassword: 'reset_password',
      },
    };
  }

  /**
   * Load reCAPTCHA v3 script
   */
  public async loadRecaptcha(): Promise<void> {
    if (!this.config.enabled || !this.config.siteKey) {
      console.warn('reCAPTCHA is disabled or site key is missing');
      return Promise.resolve();
    }

    if (this.isLoaded) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise((resolve, reject) => {
      try {
        // Check if reCAPTCHA is already loaded
        if (window.grecaptcha) {
          this.isLoaded = true;
          resolve();
          return;
        }

        // Create script element
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${this.config.siteKey}`;
        script.async = true;
        script.defer = true;

        script.onload = () => {
          // Wait for grecaptcha to be ready
          window.grecaptcha.ready(() => {
            this.isLoaded = true;
            resolve();
          });
        };

        script.onerror = () => {
          console.error('Failed to load reCAPTCHA script');
          reject(new Error('Failed to load reCAPTCHA'));
        };

        // Add script to document
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading reCAPTCHA:', error);
        reject(error);
      }
    });

    return this.loadPromise;
  }

  /**
   * Execute reCAPTCHA v3 for a specific action
   */
  public async executeRecaptcha(action: keyof RecaptchaConfig['actions']): Promise<RecaptchaResponse | null> {
    if (!this.config.enabled || !this.config.siteKey) {
      console.log('reCAPTCHA is disabled, skipping verification');
      return null;
    }

    try {
      // Ensure reCAPTCHA is loaded
      await this.loadRecaptcha();

      if (!window.grecaptcha || !this.isLoaded) {
        console.warn('reCAPTCHA not loaded, skipping verification');
        return null;
      }

      const actionName = this.config.actions[action];
      
      return new Promise((resolve, reject) => {
        window.grecaptcha.ready(async () => {
          try {
            const token = await window.grecaptcha.execute(this.config.siteKey, {
              action: actionName,
            });

            resolve({
              token,
              action: actionName,
            });
          } catch (error) {
            console.error(`reCAPTCHA execution failed for action ${actionName}:`, error);
            reject(error);
          }
        });
      });
    } catch (error) {
      console.error('reCAPTCHA execution error:', error);
      return null;
    }
  }

  /**
   * Verify reCAPTCHA token on the server side
   */
  public async verifyToken(token: string, action: string, expectedAction?: string): Promise<boolean> {
    if (!this.config.enabled) {
      return true; // Skip verification if disabled
    }

    try {
      const response = await fetch('/api/auth/verify-recaptcha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          action,
          expectedAction,
        }),
      });

      if (!response.ok) {
        console.error('reCAPTCHA verification failed:', response.statusText);
        return false;
      }

      const result = await response.json();
      
      // Check if score meets threshold
      if (result.score !== undefined && result.score < this.config.threshold) {
        console.warn(`reCAPTCHA score ${result.score} below threshold ${this.config.threshold}`);
        return false;
      }

      return result.success === true;
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return false;
    }
  }

  /**
   * Check if reCAPTCHA is enabled and properly configured
   */
  public isEnabled(): boolean {
    return this.config.enabled && !!this.config.siteKey;
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): Readonly<RecaptchaConfig> {
    return { ...this.config };
  }

  /**
   * Update configuration (useful for testing or dynamic updates)
   */
  public updateConfig(updates: Partial<RecaptchaConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Export singleton instance
export const recaptchaService = RecaptchaService.getInstance();

// Convenience functions
export const loadRecaptcha = () => recaptchaService.loadRecaptcha();
export const executeRecaptcha = (action: keyof RecaptchaConfig['actions']) => recaptchaService.executeRecaptcha(action);
export const verifyRecaptcha = (token: string, action: string, expectedAction?: string) => 
  recaptchaService.verifyToken(token, action, expectedAction);
export const isRecaptchaEnabled = () => recaptchaService.isEnabled();