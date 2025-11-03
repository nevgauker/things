"use client";
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import MapView from '@/components/MapView';
import CategoryChips from '@/components/CategoryChips';
import ThingCard from '@/components/ThingCard';
import { useFetchThingsByBounds } from '@/lib/api/endpoints';
import type { Bounds } from '@/lib/api/types';

export default function HomePageClient() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bounds, setBounds] = useState<Bounds | null>(null);

  useEffect(() => {
    const s = searchParams.get('search') || '';
    setSearch(s);
  }, [searchParams]);

  const { data, isLoading } = useFetchThingsByBounds({
    searchText: search || undefined,
    category: selectedCategories.length ? selectedCategories.join(',') : undefined,
    bounds,
  });

  const items = data?.things ?? [];

  return (
    <Suspense>
      <main className="mx-auto max-w-6xl px-4 md:px-6">
        <section className="py-3">
          <CategoryChips value={selectedCategories} onChange={setSelectedCategories} />
        </section>

        <section className="py-2">
          <MapView
            onBoundsChanged={setBounds}
            items={items as any}
            className="h-[70vh] sm:h-[75vh] md:h-[78vh]"
          />
          {!isLoading && items.length === 0 && (
            <div className="mt-2 text-sm text-gray-500">No things found in this area.</div>
          )}
        </section>
      </main>

    </Suspense>

  );
}

