/**
 * reCAPTCHA Badge - Privacy transparency indicator
 * Shows users when reCAPTCHA protection is active
 */

"use client";

import React from 'react';
import { Shield } from 'lucide-react';
import { cn } from 'src/lib/utils';
import { isRecaptchaEnabled } from 'src/lib/recaptcha';

interface RecaptchaBadgeProps {
  className?: string;
  variant?: 'default' | 'minimal';
}

export function RecaptchaBadge({ className, variant = 'default' }: RecaptchaBadgeProps) {
  const isEnabled = isRecaptchaEnabled();

  if (!isEnabled) {
    return null;
  }

  if (variant === 'minimal') {
    return (
      <div className={cn(
        "flex items-center gap-1 text-xs text-gray-500",
        className
      )}>
        <Shield className="w-3 h-3" />
        <span>Protected by reCAPTCHA</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center gap-2 p-2 bg-[#141A1E] border border-[#233037] rounded-lg",
      className
    )}>
      <div className="w-6 h-6 bg-[#34D3A6]/10 rounded-full flex items-center justify-center">
        <Shield className="w-3 h-3 text-[#34D3A6]" />
      </div>
      <div className="text-center">
        <p className="text-xs font-medium text-white">Protected by reCAPTCHA</p>
        <p className="text-xs text-gray-400">
          Google{' '}
          <a 
            href="https://policies.google.com/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#34D3A6] hover:text-[#34D3A6]/80 hover:underline"
          >
            Privacy Policy
          </a>
          {' '}and{' '}
          <a 
            href="https://policies.google.com/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#34D3A6] hover:text-[#34D3A6]/80 hover:underline"
          >
            Terms
          </a>
          {' '}apply
        </p>
      </div>
    </div>
  );
}