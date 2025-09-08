/**
 * Login Modal - Military-grade authentication interface
 * Implements PrivyLoop design system with Better Auth integration
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Mail, Lock, Github, Chrome, Building, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from 'src/lib/utils';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from 'src/components/ui/dialog';
import { useDialogManager } from 'src/lib/dialog-manager';
import { 
  signIn, 
  useAuthState, 
  validateEmail,
  getAuthRedirectUrl,
  setAuthRedirectUrl,
  clearAuthRedirectUrl
} from 'src/lib/auth-client';
import { useAuthRecaptcha } from 'src/hooks/useRecaptcha';
import { RecaptchaBadge } from './recaptcha-badge';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginError {
  field?: keyof LoginForm;
  message: string;
}

export function LoginModal() {
  const router = useRouter();
  const { state, close, switch: switchDialog } = useDialogManager();
  const { isAuthenticated, isLoading } = useAuthState();
  const recaptcha = useAuthRecaptcha('login');
  
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const isOpen = state.type === 'login' && state.isOpen;

  // Auto-focus email field when modal opens
  const emailInputRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Auto-redirect when authenticated (email/password & social)
  useEffect(() => {
    if (isAuthenticated && isOpen) {
      const redirectUrl = getAuthRedirectUrl();
      const target = redirectUrl && redirectUrl !== '/' ? redirectUrl : '/dashboard';
      const doRedirect = () => {
        close();
        clearAuthRedirectUrl(); // Clear stored redirect URL
        try {
          if (window.top === window) {
            window.location.assign(target);
          } else {
            router.push(target);
          }
        } catch {
          router.push(target);
        }
      };
      const id = setTimeout(doRedirect, 300);
      return () => clearTimeout(id);
    }
  }, [isAuthenticated, isOpen, close, router]);

  const validateForm = (): boolean => {
    const newErrors: LoginError[] = [];

    if (!form.email.trim()) {
      newErrors.push({ field: 'email', message: 'Email is required' });
    } else if (!validateEmail(form.email)) {
      newErrors.push({ field: 'email', message: 'Please enter a valid email address' });
    }

    if (!form.password.trim()) {
      newErrors.push({ field: 'password', message: 'Password is required' });
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) return;

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

      const result = await signIn.email({
        email: form.email.trim(),
        password: form.password,
        // Include reCAPTCHA token if available
        ...(recaptchaToken && { recaptchaToken }),
      });

      if (result.data?.user) {
        // Check if email is verified
        if (!result.data.user.emailVerified) {
          close();
          switchDialog('email-verification', {
            data: { email: form.email.trim() }
          });
          return;
        }

        setSuccess(true);
        // Auto-redirect handled by useEffect
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Parse Better Auth error responses
      if (error.status === 400 || error.message?.includes('credentials')) {
        setErrors([{ message: "We don't recognize that email or password. Please try again." }]);
      } else if (error.message?.includes('verified')) {
        close();
        switchDialog('email-verification', {
          data: { email: form.email.trim() }
        });
        return;
      } else {
        setErrors([{ message: 'Login failed. Please try again.' }]);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'github' | 'microsoft') => {
    try {
      setIsSubmitting(true);
      
      // Store current page for redirect
      if (!getAuthRedirectUrl()) {
        setAuthRedirectUrl(window.location.pathname);
      }

      // Better Auth social login
      await signIn.social({ provider });
    } catch (error) {
      console.error(`${provider} login error:`, error);
      setErrors([{ message: 'Social login failed. Please try again.' }]);
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    close();
    router.push('/forgot-password');
  };

  const handleSwitchToSignup = () => {
    switchDialog('signup');
  };

  const getFieldError = (field: keyof LoginForm): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const getGeneralError = (): string | undefined => {
    return errors.find(error => !error.field)?.message;
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={() => close()}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-[#34D3A6] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Welcome back!</h2>
            <p className="text-gray-400">Redirecting to your dashboard...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">Welcome back</DialogTitle>
          <DialogDescription>
            Sign in to your PrivyLoop account
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* General Error */}
          {getGeneralError() && (
            <div className="flex items-center gap-2 p-3 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
              <AlertCircle className="w-4 h-4" />
              {getGeneralError()}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="login-email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={emailInputRef}
                id="login-email"
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

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                className={cn(
                  "pl-10 pr-10 bg-[#141A1E] border-[#233037] text-white placeholder:text-gray-400",
                  "focus:border-[#34D3A6]/50 focus:ring-2 focus:ring-[#34D3A6]/20",
                  getFieldError('password') && "border-red-500/50"
                )}
                autoComplete="current-password"
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
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-sm text-[#34D3A6] hover:text-[#34D3A6]/80 hover:underline"
              disabled={isSubmitting}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit"
            className={cn(
              "w-full bg-[#34D3A6] hover:bg-[#34D3A6]/90 text-black font-medium",
              "transition-all duration-200",
              isSubmitting && "opacity-50"
            )}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#233037]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#101518] px-2 text-gray-400">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-2">
            {/* Google */}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-[#141A1E] border-[#233037] text-white hover:bg-[#1A2126] hover:border-[#34D3A6]/30"
              onClick={() => handleSocialLogin('google')}
              disabled={isSubmitting}
            >
              <Chrome className="w-4 h-4 mr-2" />
              Continue with Google
            </Button>

            {/* Microsoft */}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-[#141A1E] border-[#233037] text-white hover:bg-[#1A2126] hover:border-[#34D3A6]/30"
              onClick={() => handleSocialLogin('microsoft')}
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
              </svg>
              Continue with Microsoft
            </Button>

            {/* GitHub */}
            <Button
              type="button"
              variant="outline"
              className="w-full bg-[#141A1E] border-[#233037] text-white hover:bg-[#1A2126] hover:border-[#34D3A6]/30"
              onClick={() => handleSocialLogin('github')}
              disabled={isSubmitting}
            >
              <Github className="w-4 h-4 mr-2" />
              Continue with GitHub
            </Button>
          </div>

          {/* Sign Up Link */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-400">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={handleSwitchToSignup}
                className="text-[#34D3A6] hover:text-[#34D3A6]/80 hover:underline font-medium"
                disabled={isSubmitting}
              >
                Sign up
              </button>
            </p>
          </div>

          {/* reCAPTCHA Badge */}
          <RecaptchaBadge variant="minimal" className="justify-center pt-2" />
        </form>
      </DialogContent>
    </Dialog>
  );
}
