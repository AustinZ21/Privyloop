import { PrivacyDashboard } from 'src/components/privacy-dashboard';

// Local preview route for screenshots and UI review while auth is in flux.
export const dynamic = 'force-dynamic';

export default function DashboardPreviewPage() {
  return <PrivacyDashboard />;
}
