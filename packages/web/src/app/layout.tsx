import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthModals } from 'src/components/auth/auth-modals';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PrivyLoop - Privacy Dashboard',
  description: 'Monitor and manage your digital privacy across platforms',
  keywords: ['privacy', 'security', 'data protection', 'platform monitoring'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
        <AuthModals />
      </body>
    </html>
  );
}