"use client";
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
import MapView from '@/components/MapView';
import HomeListSheet from '@/components/HomeListSheet';
import ThingCard from '@/components/ThingCard';
import { useFetchThingsByBounds } from '@/lib/api/endpoints';
import type { Bounds } from '@/lib/api/types';

export default function HomePageClient() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [mapHeight, setMapHeight] = useState<number | null>(null);

  useEffect(() => {
    const s = searchParams.get('search') || '';
    setSearch(s);
    const catParam = searchParams.get('category') || '';
    const cats = catParam.split(',').map((t)=>t.trim()).filter(Boolean);
    setSelectedCategories(cats);
  }, [searchParams]);

  // Compute available height = full viewport (map shows behind transparent header)
  useEffect(() => {
    function compute() {
      const vh = typeof window !== 'undefined' ? window.innerHeight : 0;
      setMapHeight(vh || null);
    }
    compute();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', compute);
      return () => window.removeEventListener('resize', compute);
    }
  }, []);

  const { data, isLoading } = useFetchThingsByBounds({
    searchText: search || undefined,
    category: selectedCategories.length ? selectedCategories.join(',') : undefined,
    bounds,
  });

  const items = data?.things ?? [];
  const isFetchingThings = useIsFetching({ queryKey: ['things'] }) > 0;

  return (
    <Suspense>
      <div className="relative w-full" style={{ height: mapHeight ? `${mapHeight}px` : '100vh' }}>
        <MapView
          onBoundsChanged={setBounds}
          items={items as any}
          className="h-full rounded-none border-0"
          showLegend={false}
        />
        {bounds && isFetchingThings && (
          <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full border bg-white/90 px-3 py-1 text-xs text-gray-700 shadow">
            Updating…
          </div>
        )}
        
        {!isLoading && !isFetchingThings && items.length === 0 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2 rounded-lg border bg-white/90 px-3 py-1 text-sm text-gray-600 shadow">
            No things found in this area.
          </div>
        )}
      </div>
      <HomeListSheet items={items as any} loading={isLoading} />
    </Suspense>

  );
}
