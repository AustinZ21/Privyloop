/**
 * Email Verification Modal - Handles unverified login attempts
 * Smooth transition with resend and email change capabilities
 */

"use client";

import React, { useState, useEffect } from 'react';
import { Mail, Clock, RefreshCw, Edit3, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
import { resendVerificationEmail, validateEmail } from 'src/lib/auth-client';

interface EmailVerificationState {
  mode: 'verify' | 'change-email';
  email: string;
  newEmail: string;
  isSubmitting: boolean;
  lastSentAt: Date | null;
  cooldownSeconds: number;
  success: boolean;
  error: string | null;
}

export function EmailVerificationModal() {
  const { state, close, back } = useDialogManager();
  const [verificationState, setVerificationState] = useState<EmailVerificationState>({
    mode: 'verify',
    email: state.data?.email || '',
    newEmail: '',
    isSubmitting: false,
    lastSentAt: null,
    cooldownSeconds: 0,
    success: false,
    error: null,
  });

  const isOpen = state.type === 'email-verification' && state.isOpen;

  // Update email when dialog data changes
  useEffect(() => {
    if (state.data?.email && state.data.email !== verificationState.email) {
      setVerificationState(prev => ({
        ...prev,
        email: state.data?.email || '',
        mode: 'verify',
        newEmail: '',
        error: null,
        success: false,
      }));
    }
  }, [state.data?.email]);

  // Cooldown timer
  useEffect(() => {
    if (verificationState.cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setVerificationState(prev => ({
          ...prev,
          cooldownSeconds: prev.cooldownSeconds - 1,
        }));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [verificationState.cooldownSeconds]);

  const handleResendVerification = async () => {
    const targetEmail = verificationState.mode === 'change-email' 
      ? verificationState.newEmail 
      : verificationState.email;

    if (!targetEmail || verificationState.isSubmitting) return;

    setVerificationState(prev => ({ ...prev, isSubmitting: true, error: null }));

    try {
      const success = await resendVerificationEmail(targetEmail, {
        onSuccess: () => {
          setVerificationState(prev => ({
            ...prev,
            success: true,
            lastSentAt: new Date(),
            cooldownSeconds: 60, // 1 minute cooldown
            email: targetEmail, // Update the main email if changed
            mode: 'verify', // Reset to verify mode
            newEmail: '', // Clear new email
          }));
        },
        onError: (error) => {
          setVerificationState(prev => ({ ...prev, error }));
        },
      });
    } catch (error) {
      setVerificationState(prev => ({
        ...prev,
        error: 'Failed to send verification email. Please try again.',
      }));
    } finally {
      setVerificationState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleChangeEmailMode = () => {
    setVerificationState(prev => ({
      ...prev,
      mode: 'change-email',
      newEmail: prev.email, // Pre-fill with current email
      error: null,
      success: false,
    }));
  };

  const handleCancelChangeEmail = () => {
    setVerificationState(prev => ({
      ...prev,
      mode: 'verify',
      newEmail: '',
      error: null,
    }));
  };

  const canResend = verificationState.cooldownSeconds === 0 && !verificationState.isSubmitting;

  const formatCooldown = (seconds: number): string => {
    return `${seconds}s`;
  };

  const isNewEmailValid = validateEmail(verificationState.newEmail) && 
    verificationState.newEmail !== verificationState.email;

  return (
    <Dialog open={isOpen} onOpenChange={() => close()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-[#34D3A6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-[#34D3A6]" />
          </div>
          <DialogTitle className="text-xl font-semibold">
            {verificationState.mode === 'verify' ? 'Check your email' : 'Change email address'}
          </DialogTitle>
          <DialogDescription>
            {verificationState.mode === 'verify'
              ? `We've sent a verification link to ${verificationState.email}. Please confirm your email to log in.`
              : 'Enter your new email address to receive a verification link.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Success State */}
          {verificationState.success && (
            <div className="flex items-center gap-3 p-4 bg-[#34D3A6]/10 border border-[#34D3A6]/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-[#34D3A6] flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">Verification email sent!</p>
                <p className="text-sm text-gray-400">Check your inbox and click the verification link.</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {verificationState.error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-400">{verificationState.error}</p>
            </div>
          )}

          {/* Change Email Form */}
          {verificationState.mode === 'change-email' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-email">New email address</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="your@newemail.com"
                  value={verificationState.newEmail}
                  onChange={(e) => setVerificationState(prev => ({ 
                    ...prev, 
                    newEmail: e.target.value,
                    error: null,
                  }))}
                  className="bg-[#141A1E] border-[#233037] text-white placeholder:text-gray-400 focus:border-[#34D3A6]/50"
                  autoComplete="email"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleCancelChangeEmail}
                  variant="outline"
                  className="flex-1 bg-[#141A1E] border-[#233037] text-white hover:bg-[#1A2126]"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResendVerification}
                  disabled={!isNewEmailValid || verificationState.isSubmitting}
                  className="flex-1 bg-[#34D3A6] hover:bg-[#34D3A6]/90 text-black"
                >
                  {verificationState.isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    'Send verification'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Verify Mode Actions */}
          {verificationState.mode === 'verify' && (
            <div className="space-y-3">
              {/* Resend Button */}
              <Button
                onClick={handleResendVerification}
                disabled={!canResend}
                className={cn(
                  "w-full",
                  canResend 
                    ? "bg-[#34D3A6] hover:bg-[#34D3A6]/90 text-black" 
                    : "bg-gray-600 text-gray-400 cursor-not-allowed"
                )}
              >
                {verificationState.isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending verification...
                  </>
                ) : verificationState.cooldownSeconds > 0 ? (
                  <>
                    <Clock className="w-4 h-4 mr-2" />
                    Resend in {formatCooldown(verificationState.cooldownSeconds)}
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend verification email
                  </>
                )}
              </Button>

              {/* Didn't receive it? text + Change Email button */}
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-2">Didn't receive it?</p>
                <Button
                  onClick={handleChangeEmailMode}
                  variant="outline"
                  size="sm"
                  className="bg-[#141A1E] border-[#233037] text-[#34D3A6] hover:bg-[#1A2126] hover:text-[#34D3A6]/80"
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Change email
                </Button>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="text-center pt-4 border-t border-[#233037]">
            <p className="text-xs text-gray-500">
              Having trouble? Check your spam folder or contact support.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}