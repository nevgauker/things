"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
import MapView from '@/components/MapView';
import HomeListSheet from '@/components/HomeListSheet';
import ThingCard from '@/components/ThingCard';
import { useFetchThingsByBounds } from '@/lib/api/endpoints';
import type { Bounds } from '@/lib/api/types';
import { loadGoogleMaps } from '@/lib/maps/google';

export default function HomePageClient() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [bounds, setBounds] = useState<Bounds | null>(null);
  const [mapHeight, setMapHeight] = useState<number | null>(null);
  const [searchTargetBounds, setSearchTargetBounds] = useState<Bounds | null>(null);
  const [searchTargetCenter, setSearchTargetCenter] = useState<{ lat: number; lng: number } | null>(null);
  const geocodeTimerRef = useRef<any>(null);

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

  // Fetch strictly by current viewport (and optional categories). The `search` text is used only for geocoding/recentering.
  const { data, isLoading } = useFetchThingsByBounds({
    category: selectedCategories.length ? selectedCategories.join(',') : undefined,
    bounds,
  });

  const items = data?.things ?? [];
  const isFetchingThings = useIsFetching({ queryKey: ['things'] }) > 0;

  // Geocode the search text like Google and steer the map.
  useEffect(() => {
    // Clear previous target when query is empty
    if (!search || search.trim().length < 2) {
      setSearchTargetBounds(null);
      setSearchTargetCenter(null);
      return;
    }
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        await loadGoogleMaps();
        if (!(window as any).google?.maps?.Geocoder) return;
        const geocoder = new (window as any).google.maps.Geocoder();
        geocoder.geocode({ address: search }, (results: any[], status: string) => {
          if (status !== 'OK' || !results || !results.length) return;
          const best = results[0];
          const geom = best.geometry;
          if (geom?.viewport) {
            // Fit to viewport if available
            const ne = geom.viewport.getNorthEast();
            const sw = geom.viewport.getSouthWest();
            setSearchTargetBounds({
              northeast: { lat: ne.lat(), lng: ne.lng() },
              southwest: { lat: sw.lat(), lng: sw.lng() },
            });
            setSearchTargetCenter(null);
          } else if (geom?.location) {
            setSearchTargetCenter({ lat: geom.location.lat(), lng: geom.location.lng() });
            setSearchTargetBounds(null);
          }
        });
      } catch {
        // ignore failures (e.g., missing API key); map remains as-is
      }
    }, 400);
    return () => { if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current); };
  }, [search]);

  return (
    <Suspense>
      <div className="relative w-full" style={{ height: mapHeight ? `${mapHeight}px` : '100vh' }}>
        <MapView
          onBoundsChanged={setBounds}
          items={items as any}
          className="h-full rounded-none border-0"
          showLegend={false}
          externalBounds={searchTargetBounds}
          externalCenter={searchTargetCenter}
        />
        {bounds && isFetchingThings && (
          <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full border bg-white/90 px-3 py-1 text-xs text-gray-700 shadow">
            Updating…
          </div>
        )}
        
        
      </div>
      <HomeListSheet items={items as any} loading={isLoading} />
    </Suspense>

  );
}
