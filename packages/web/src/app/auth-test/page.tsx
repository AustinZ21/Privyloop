/**
 * Authentication Test Page
 * Comprehensive testing interface for auth system validation
 */

import { AuthTestValidator } from 'src/components/auth/auth-test-validator';

export default function AuthTestPage() {
  return (
    <div className="min-h-screen bg-[#101518] py-8">
      <AuthTestValidator />
    </div>
  );
}