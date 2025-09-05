/**
 * Forgot Password Page - Server component wrapper
 * Handles Suspense boundary for client component
 */

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { GuestOnly } from 'src/components/auth/protected-route';
import ForgotPasswordForm from './ForgotPasswordForm';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#101518] flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 text-[#34D3A6] animate-spin mx-auto" />
        <p className="text-gray-400">Loading password reset...</p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <GuestOnly>
      <Suspense fallback={<LoadingFallback />}>
        <ForgotPasswordForm />
      </Suspense>
    </GuestOnly>
  );
}