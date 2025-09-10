/**
 * Signup Success Page - Server component wrapper
 * Handles email verification prompt with resend capabilities
 * Following TASK-003 authentication UX specifications
 */

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { GuestOnly } from 'src/components/auth/protected-route';
import SignupSuccessForm from './SignupSuccessForm';

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

function LoadingFallback() {
  return (
    <div
      className="min-h-screen bg-[#101518] flex flex-col items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="text-center space-y-4">
        <Loader2
          className="w-8 h-8 text-[#34D3A6] animate-spin motion-reduce:animate-none mx-auto"
          aria-hidden="true"
          focusable="false"
        />
        <p className="text-gray-400">Loading verification page...</p>
      </div>
    </div>
  );
}

export default function SignupSuccessPage() {
  return (
    <GuestOnly>
      <Suspense fallback={<LoadingFallback />}>
        <SignupSuccessForm />
      </Suspense>
    </GuestOnly>
  );
}