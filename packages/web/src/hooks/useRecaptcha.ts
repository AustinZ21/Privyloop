/**
 * useRecaptcha Hook - React integration for reCAPTCHA v3
 * Provides easy-to-use hook for authentication components
 */

import { useState, useEffect, useCallback } from 'react';
import { executeRecaptcha, isRecaptchaEnabled, loadRecaptcha } from 'src/lib/recaptcha';

interface UseRecaptchaOptions {
  action: 'login' | 'signup' | 'forgotPassword' | 'resetPassword';
  autoLoad?: boolean;
}

interface UseRecaptchaReturn {
  executeRecaptcha: () => Promise<string | null>;
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  reset: () => void;
}

export function useRecaptcha({ action, autoLoad = true }: UseRecaptchaOptions): UseRecaptchaReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enabled = isRecaptchaEnabled();

  // Auto-load reCAPTCHA on component mount
  useEffect(() => {
    if (enabled && autoLoad) {
      setIsLoading(true);
      loadRecaptcha()
        .then(() => {
          setError(null);
        })
        .catch((err) => {
          console.error('Failed to load reCAPTCHA:', err);
          setError('Failed to load security verification');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [enabled, autoLoad]);

  const execute = useCallback(async (): Promise<string | null> => {
    if (!enabled) {
      return null; // reCAPTCHA disabled, skip
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await executeRecaptcha(action);
      
      if (!result?.token) {
        throw new Error('Failed to get reCAPTCHA token');
      }

      return result.token;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'reCAPTCHA verification failed';
      console.error('reCAPTCHA execution error:', err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [action, enabled]);

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    executeRecaptcha: execute,
    isEnabled: enabled,
    isLoading,
    error,
    reset,
  };
}

// Simplified hook for common use cases
export function useAuthRecaptcha(action: 'login' | 'signup') {
  return useRecaptcha({ action });
}

export function usePasswordRecaptcha(action: 'forgotPassword' | 'resetPassword') {
  return useRecaptcha({ action });
}