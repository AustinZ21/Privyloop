/**
 * Signup Success Form - Email verification prompt with resend capabilities
 * Following TASK-003 authentication UX specifications
 * Shows email address, resend button, and change email functionality
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, RefreshCw, Edit3, CheckCircle, ArrowLeft, Loader2, AlertCircle, Clock } from 'lucide-react';
import { cn } from 'src/lib/utils';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { resendVerificationEmail, validateEmail } from 'src/lib/auth-client';

interface SignupSuccessState {
  mode: 'verify' | 'change-email';
  email: string;
  newEmail: string;
  isSubmitting: boolean;
  lastSentAt: Date | null;
  cooldownSeconds: number;
  success: boolean;
  error: string | null;
}

export default function SignupSuccessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams.get('email') || '';
  
  const [state, setState] = useState<SignupSuccessState>({
    mode: 'verify',
    email: emailFromUrl,
    newEmail: '',
    isSubmitting: false,
    lastSentAt: null,
    cooldownSeconds: 0,
    success: false,
    error: null,
  });

  // Auto-focus email field when in change-email mode
  const emailInputRef = React.useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (state.mode === 'change-email' && emailInputRef.current) {
      setTimeout(() => emailInputRef.current?.focus(), 100);
    }
  }, [state.mode]);

  // Cooldown timer for resend button
  useEffect(() => {
    if (state.cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setState(prev => ({ ...prev, cooldownSeconds: prev.cooldownSeconds - 1 }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state.cooldownSeconds]);

  // Automatically send verification email on mount if email is provided
  useEffect(() => {
    if (state.email && !state.lastSentAt) {
      handleResendVerification();
    }
  }, []); // Only run on mount since we check state inside

  // Store timeout refs for cleanup
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
    };
  }, []);

  const handleResendVerification = useCallback(async () => {
    if (state.isSubmitting || state.cooldownSeconds > 0) return;

    setState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      await resendVerificationEmail(state.email);
      
      setState(prev => ({
        ...prev,
        lastSentAt: new Date(),
        cooldownSeconds: 60, // 1-minute cooldown
        success: true,
        error: null,
      }));
      
      // Clear success message after 3 seconds
      const timeoutId = setTimeout(() => {
        setState(prev => ({ ...prev, success: false }));
      }, 3000);
      timeoutRefs.current.push(timeoutId);
      
    } catch (error: any) {
      console.error('Resend verification error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to resend verification email. Please try again.',
      }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [state.email]);

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(state.newEmail)) {
      setState(prev => ({ ...prev, error: 'Please enter a valid email address.' }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      isSubmitting: true, 
      error: null 
    }));

    try {
      // Update email and trigger verification
      await resendVerificationEmail(state.newEmail);
      
      setState(prev => ({
        ...prev,
        email: state.newEmail,
        newEmail: '',
        mode: 'verify',
        lastSentAt: new Date(),
        cooldownSeconds: 60,
        success: true,
        error: null,
      }));

      // Update URL to reflect new email
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set('email', state.newEmail);
      window.history.replaceState({}, '', newUrl.toString());
      
      // Clear success message after 3 seconds
      const timeoutId = setTimeout(() => {
        setState(prev => ({ ...prev, success: false }));
      }, 3000);
      timeoutRefs.current.push(timeoutId);
      
    } catch (error: any) {
      console.error('Change email error:', error);
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to update email. Please try again.',
      }));
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  if (!state.email) {
    return (
      <div className="min-h-screen bg-[#101518] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto" />
            <h1 className="text-2xl font-bold text-white">No Email Provided</h1>
            <p className="text-gray-400">
              We need an email address to send you verification instructions.
            </p>
          </div>
          
          <Link href="/" className="inline-block">
            <Button variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (state.mode === 'change-email') {
    return (
      <div className="min-h-screen bg-[#101518] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <Edit3 className="w-12 h-12 text-[#34D3A6] mx-auto" />
            <h1 className="text-2xl font-bold text-white">Change Email Address</h1>
            <p className="text-gray-400">
              Enter your new email address to receive verification instructions.
            </p>
          </div>

          {/* Change Email Form */}
          <form onSubmit={handleChangeEmail} className="space-y-4">
            {/* Current Email */}
            <div className="space-y-2">
              <Label className="text-sm text-gray-300">Current Email</Label>
              <div className="p-3 bg-[#1A2126] border border-[#233037] rounded-lg text-gray-400">
                {state.email}
              </div>
            </div>

            {/* New Email Input */}
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={emailInputRef}
                  id="new-email"
                  type="email"
                  placeholder="your@newemail.com"
                  value={state.newEmail}
                  onChange={(e) => setState(prev => ({ ...prev, newEmail: e.target.value }))}
                  className={cn(
                    "pl-10 bg-[#141A1E] border-[#233037] text-white placeholder:text-gray-400",
                    "focus:border-[#34D3A6]/50 focus:ring-2 focus:ring-[#34D3A6]/20"
                  )}
                  autoComplete="email"
                  disabled={state.isSubmitting}
                  required
                />
              </div>
            </div>

            {/* Error Message */}
            {state.error && (
              <div className="flex items-center gap-2 p-3 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
                <AlertCircle className="w-4 h-4" />
                {state.error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full bg-[#34D3A6] hover:bg-[#34D3A6]/90 text-black font-medium"
                disabled={state.isSubmitting || !state.newEmail.trim()}
              >
                {state.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating Email...
                  </>
                ) : (
                  'Update Email & Send Verification'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setState(prev => ({ ...prev, mode: 'verify', error: null }))}
                disabled={state.isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Main verification mode
  return (
    <div className="min-h-screen bg-[#101518] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <CheckCircle className="w-12 h-12 text-[#34D3A6] mx-auto" />
          <h1 className="text-2xl font-bold text-white">Account Created Successfully!</h1>
          <p className="text-gray-400">
            We've sent a verification email to verify your account.
          </p>
        </div>

        {/* Email Display */}
        <div className="space-y-2">
          <Label className="text-sm text-gray-300">Verification sent to:</Label>
          <div className="flex items-center gap-2 p-3 bg-[#1A2126] border border-[#233037] rounded-lg">
            <Mail className="w-4 h-4 text-[#34D3A6]" />
            <span className="text-white font-medium">{state.email}</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-3 p-4 bg-[#1A2126]/50 border border-[#233037] rounded-lg">
          <h3 className="text-sm font-medium text-white">Next Steps:</h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-[#34D3A6] font-bold">1.</span>
              Check your email inbox for our verification message
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#34D3A6] font-bold">2.</span>
              Click the "Verify Email" button in the email
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#34D3A6] font-bold">3.</span>
              You'll be redirected to your PrivyLoop dashboard
            </li>
          </ul>
          <p className="text-xs text-gray-500 pt-2">
            Can't find the email? Check your spam/junk folder.
          </p>
        </div>

        {/* Success Message */}
        {state.success && (
          <div className="flex items-center gap-2 p-3 text-sm bg-[#34D3A6]/10 border border-[#34D3A6]/20 rounded-lg text-[#34D3A6]">
            <CheckCircle className="w-4 h-4" />
            Verification email sent successfully!
          </div>
        )}

        {/* Error Message */}
        {state.error && (
          <div className="flex items-center gap-2 p-3 text-sm bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
            <AlertCircle className="w-4 h-4" />
            {state.error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Resend Button */}
          <Button
            onClick={handleResendVerification}
            className="w-full bg-[#34D3A6] hover:bg-[#34D3A6]/90 text-black font-medium"
            disabled={state.isSubmitting || state.cooldownSeconds > 0}
          >
            {state.isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : state.cooldownSeconds > 0 ? (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Resend in {state.cooldownSeconds}s
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </Button>

          {/* Change Email Button */}
          <Button
            variant="outline"
            className="w-full border-[#233037] text-gray-300 hover:text-white hover:bg-[#1A2126]"
            onClick={() => setState(prev => ({ ...prev, mode: 'change-email', error: null }))}
            disabled={state.isSubmitting}
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Wrong email address? Change it
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-[#34D3A6] hover:underline inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}