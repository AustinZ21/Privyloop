/**
 * Reset Password Form - Client component with search params handling
 * Military-grade security with password strength validation
 */

"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Eye, EyeOff, ArrowLeft, Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { cn } from 'src/lib/utils';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { resetPassword, validateEmail, getPasswordStrength } from 'src/lib/auth-client';
import type { PasswordStrength } from 'src/lib/auth-client';
import { usePasswordRecaptcha } from 'src/hooks/useRecaptcha';

interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordError {
  field?: keyof ResetPasswordForm;
  message: string;
}

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recaptcha = usePasswordRecaptcha('resetPassword');
  
  const [form, setForm] = useState<ResetPasswordForm>({
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<ResetPasswordError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    score: 0,
    feedback: [],
    isValid: false,
    requirements: {
      length: false,
      uppercase: false,
      lowercase: false,
      number: false,
      special: false,
    },
  });
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Get token from URL parameters
  const token = searchParams.get('token');

  // Auto-focus password field
  const passwordInputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      return;
    }
    
    // TODO: Implement token validation API call
    setTokenValid(true);
  }, [token]);

  // Password strength validation
  useEffect(() => {
    if (form.password) {
      const strength = getPasswordStrength(form.password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength({ 
        score: 0, 
        feedback: [], 
        isValid: false,
        requirements: {
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
        }
      });
    }
  }, [form.password]);

  // Auto-redirect after successful reset
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, router]);

  const validateForm = (): boolean => {
    const newErrors: ResetPasswordError[] = [];

    if (!form.password.trim()) {
      newErrors.push({ field: 'password', message: 'Password is required' });
    } else if (!passwordStrength.isValid) {
      newErrors.push({ field: 'password', message: 'Password does not meet strength requirements' });
    }

    if (!form.confirmPassword.trim()) {
      newErrors.push({ field: 'confirmPassword', message: 'Please confirm your password' });
    } else if (form.password !== form.confirmPassword) {
      newErrors.push({ field: 'confirmPassword', message: 'Passwords do not match' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting || !token) return;

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

      const result = await resetPassword({
        token,
        newPassword: form.password,
        ...(recaptchaToken && { recaptchaToken }),
      });

      if (result) {
        setSuccess(true);
      }
    } catch (error: any) {
      console.error('Password reset error:', error);
      
      if (error.status === 400 || error.message?.includes('token')) {
        setErrors([{ message: 'Invalid or expired reset token. Please request a new password reset.' }]);
      } else if (error.status === 429) {
        setErrors([{ message: 'Too many reset attempts. Please try again later.' }]);
      } else {
        setErrors([{ message: 'Failed to reset password. Please try again.' }]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFieldError = (field: keyof ResetPasswordForm): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const getGeneralError = (): string | undefined => {
    return errors.find(error => !error.field)?.message;
  };

  // Invalid token state
  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-[#101518] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center text-[#34D3A6] hover:text-[#34D3A6]/80 mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to PrivyLoop
            </Link>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Invalid Reset Link</h1>
            <p className="text-gray-400 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Link 
              href="/forgot-password"
              className="inline-flex items-center justify-center px-4 py-2 bg-[#34D3A6] hover:bg-[#34D3A6]/90 text-black font-medium rounded-lg transition-colors"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#101518] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#34D3A6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#34D3A6]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Password Reset Successful</h1>
            <p className="text-gray-400 mb-6">
              Your password has been reset successfully. Redirecting to login...
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting in 3 seconds...
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
            <Lock className="w-8 h-8 text-[#34D3A6]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Create New Password</h1>
          <p className="text-gray-400">
            Enter your new password below
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

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="reset-password">New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={passwordInputRef}
                id="reset-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                className={cn(
                  "pl-10 pr-10 bg-[#141A1E] border-[#233037] text-white placeholder:text-gray-400",
                  "focus:border-[#34D3A6]/50 focus:ring-2 focus:ring-[#34D3A6]/20",
                  getFieldError('password') && "border-red-500/50"
                )}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {getFieldError('password') && (
              <p className="text-sm text-red-400">{getFieldError('password')}</p>
            )}

            {/* Password Strength Indicator */}
            {form.password && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "w-4 h-1 rounded-full",
                          i < passwordStrength.score
                            ? passwordStrength.score <= 1
                              ? "bg-red-500"
                              : passwordStrength.score <= 2
                              ? "bg-yellow-500"
                              : "bg-[#34D3A6]"
                            : "bg-gray-600"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">
                    {passwordStrength.score <= 1 ? "Weak" : 
                     passwordStrength.score <= 2 ? "Fair" : 
                     passwordStrength.score <= 3 ? "Good" : "Strong"}
                  </span>
                </div>
                {passwordStrength.feedback.length > 0 && (
                  <ul className="text-xs text-gray-400 space-y-1">
                    {passwordStrength.feedback.map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="reset-confirm-password">Confirm New Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="reset-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={form.confirmPassword}
                onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className={cn(
                  "pl-10 pr-10 bg-[#141A1E] border-[#233037] text-white placeholder:text-gray-400",
                  "focus:border-[#34D3A6]/50 focus:ring-2 focus:ring-[#34D3A6]/20",
                  getFieldError('confirmPassword') && "border-red-500/50"
                )}
                autoComplete="new-password"
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                disabled={isSubmitting}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {getFieldError('confirmPassword') && (
              <p className="text-sm text-red-400">{getFieldError('confirmPassword')}</p>
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
            disabled={isSubmitting || !passwordStrength.isValid}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetting Password...
              </>
            ) : (
              'Reset Password'
            )}
          </Button>

          {/* Security Notice */}
          <div className="bg-[#141A1E] border border-[#233037] rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-[#34D3A6]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-[#34D3A6]" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">Secure Password Reset</p>
                <p className="text-xs text-gray-400">
                  Your new password will be encrypted and securely stored
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}