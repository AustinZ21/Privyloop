/**
 * AuthModals - Central authentication modal coordinator
 * Combines all authentication modals for global access
 */

"use client";

import React from 'react';
import { LoginModal } from './login-modal';
import { SignupModal } from './signup-modal';
import { EmailVerificationModal } from './email-verification-modal';

export function AuthModals() {
  return (
    <>
      <LoginModal />
      <SignupModal />
      <EmailVerificationModal />
    </>
  );
}