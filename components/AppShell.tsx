"use client";
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideHeaderOn = ['/signin', '/signup'];
  const hide = hideHeaderOn.includes(pathname);
  return (
    <>
      {!hide && (
        <Suspense fallback={null}>
          <Header />
        </Suspense>
      )}
      {children}
    </>
  );
}
