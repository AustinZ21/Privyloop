import { PrivacyDashboard } from 'src/components/privacy-dashboard';
import { RequireAuth } from 'src/components/auth/protected-route';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <RequireAuth>
      <PrivacyDashboard />
    </RequireAuth>
  );
}