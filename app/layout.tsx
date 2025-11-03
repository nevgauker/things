import type { Metadata } from 'next';
import './globals.css';
import { ReactQueryClientProvider } from '@/lib/query/provider';
import { AuthProvider } from '@/lib/auth/provider';
import AppShell from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Things (Web)',
  description: 'Find the things you need around you',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryClientProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  );
}

