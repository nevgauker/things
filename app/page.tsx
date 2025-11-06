import { Suspense } from 'react';
import HomePageClient from '@/components/HomePageClient';

export default function HomePage() {
  return (
    <div>
      <Suspense fallback={null}>
        <HomePageClient />
      </Suspense>
    </div>
  );
}
