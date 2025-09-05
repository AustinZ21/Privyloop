/**
 * Forgot Password Form - Client component 
 * Military-grade security with rate limiting and validation
 */

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from 'src/lib/utils';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { validateEmail } from 'src/lib/auth-client';
import { usePasswordRecaptcha } from 'src/hooks/useRecaptcha';

interface ForgotPasswordForm {
  email: string;
}

interface ForgotPasswordError {
  field?: keyof ForgotPasswordForm;
  message: string;
}

export default function ForgotPasswordForm() {
  const router = useRouter();
  const recaptcha = usePasswordRecaptcha('forgotPassword');
  const [form, setForm] = useState<ForgotPasswordForm>({ email: '' });
  const [errors, setErrors] = useState<ForgotPasswordError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Auto-focus email field
  const emailInputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    emailInputRef.current?.focus();
  }, []);

  // Cooldown timer
  React.useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const validateForm = (): boolean => {
    const newErrors: ForgotPasswordError[] = [];

    if (!form.email.trim()) {
      newErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!validateEmail(form.email)) {
      newErrors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting || cooldownSeconds > 0) return;

    setIsSubmitting(true);
    setErrors([]);

    try {
      // Execute reCAPTCHA if enabled
      let recaptchaToken: string | null = null;
      if (recaptcha.isEnabled) {
        recaptchaToken = await recaptcha.executeRecaptcha();
        if (!recaptchaToken) {
          setErrors([{ message: 'Security verification failed. Please try again.' }]);
          return;
        }
      }

      // Send password reset request via API
      const response = await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email.trim(),
          ...(recaptchaToken && { recaptchaToken }),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send password reset email');
      }

      setSuccess(true);
      setLastSentAt(new Date());
      setCooldownSeconds(60); // 1 minute cooldown
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      // Parse Better Auth error responses
      if (error.status === 404) {
        // For security, don't reveal if email exists or not
        setSuccess(true);
        setLastSentAt(new Date());
        setCooldownSeconds(60);
      } else if (error.status === 429) {
        setErrors([{ 
          message: 'Too many reset attempts. Please wait before trying again.' 
        }]);
      } else {
        setErrors([{ 
          message: 'Failed to send password reset email. Please try again.' 
        }]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: keyof ForgotPasswordForm): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const getGeneralError = (): string | undefined => {
    return errors.find(error => !error.field)?.message;
  };

  const formatCooldown = (seconds: number): string => {
    return `${seconds}s`;
  };

  const canResend = cooldownSeconds === 0 && !isSubmitting;

  if (success) {
    return (
      <div className="min-h-screen bg-[#101518] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center text-[#34D3A6] hover:text-[#34D3A6]/80 mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to PrivyLoop
            </Link>
            <div className="w-16 h-16 bg-[#34D3A6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#34D3A6]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
            <p className="text-gray-400">
              We've sent a password reset link to <span className="font-medium text-white">{form.email}</span>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-[#141A1E] border border-[#233037] rounded-lg p-6 space-y-4">
            <h3 className="font-medium text-white">What to do next:</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#34D3A6] rounded-full flex-shrink-0"></span>
                Check your email inbox for the reset link
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#34D3A6] rounded-full flex-shrink-0"></span>
                Click the secure reset link in the email
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#34D3A6] rounded-full flex-shrink-0"></span>
                Create your new password
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[#34D3A6] rounded-full flex-shrink-0"></span>
                Sign in with your new password
              </li>
            </ul>
          </div>

          {/* Resend Button */}
          <div className="space-y-4">
            <Button
              onClick={() => {
                setSuccess(false);
                handleSubmit(new Event('submit') as any);
              }}
              disabled={!canResend}
              variant="outline"
              className={cn(
                "w-full bg-[#141A1E] border-[#233037] text-white hover:bg-[#1A2126]",
                canResend 
                  ? "hover:border-[#34D3A6]/50" 
                  : "opacity-50 cursor-not-allowed"
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : cooldownSeconds > 0 ? (
                `Resend available in ${formatCooldown(cooldownSeconds)}`
              ) : (
                'Resend reset email'
              )}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-3">
                Didn't receive the email? Check your spam folder.
              </p>
              <Link 
                href="/contact" 
                className="text-sm text-[#34D3A6] hover:text-[#34D3A6]/80 hover:underline"
              >
                Still need help? Contact support
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101518] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-[#34D3A6] hover:text-[#34D3A6]/80 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to PrivyLoop
          </Link>
          <div className="w-16 h-16 bg-[#34D3A6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-[#34D3A6]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Reset your password</h1>
          <p className="text-gray-400">
            Enter your email and we'll send you a secure reset link
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {getGeneralError() && (
            <div className="flex items-center gap-2 p-3 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              <AlertCircle className="w-4 h-4" />
              {getGeneralError()}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={emailInputRef}
                id="reset-email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                className={cn(
                  "pl-10 bg-[#141A1E] border-[#233037] text-white placeholder:text-gray-400",
                  "focus:border-[#34D3A6]/50 focus:ring-2 focus:ring-[#34D3A6]/20",
                  getFieldError('email') && "border-red-500/50"
                )}
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>
            {getFieldError('email') && (
              <p className="text-sm text-red-400">{getFieldError('email')}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit"
            className={cn(
              "w-full bg-[#34D3A6] hover:bg-[#34D3A6]/90 text-black font-medium",
              "transition-all duration-200",
              isSubmitting && "opacity-50"
            )}
            disabled={isSubmitting || cooldownSeconds > 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending reset link...
              </>
            ) : cooldownSeconds > 0 ? (
              `Try again in ${formatCooldown(cooldownSeconds)}`
            ) : (
              'Send reset link'
            )}
          </Button>

          {/* Security Notice */}
          <div className="bg-[#141A1E] border border-[#233037] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#34D3A6]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-[#34D3A6]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Secure reset process</p>
                <p className="text-xs text-gray-400">
                  Reset links expire in 1 hour for your security
                </p>
              </div>
            </div>
          </div>

          {/* Back to Login */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-400">
              Remember your password?{' '}
              <Link 
                href="/login"
                className="text-[#34D3A6] hover:text-[#34D3A6]/80 hover:underline font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}