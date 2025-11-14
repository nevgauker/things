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
  const [placeId, setPlaceId] = useState<string | null>(null);

  useEffect(() => {
    const s = searchParams.get('search') || '';
    setSearch(s);
    setPlaceId(searchParams.get('placeId'));
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

  // Recenter-on-user trigger handling (from Header clear button)
  const handledRecenterRef = useRef<string | null>(null);
  useEffect(() => {
    const flag = searchParams.get('recenter');
    if (flag !== 'user') {
      handledRecenterRef.current = null;
      return;
    }
    if (handledRecenterRef.current === 'user') return;
    handledRecenterRef.current = 'user';
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSearchTargetBounds(null);
          setSearchTargetCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // ignore; leave map as-is
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    }
  }, [searchParams]);

  // Geocode or resolve placeId and steer the map.
  useEffect(() => {
    // Clear previous target when query is empty
    if ((!search || search.trim().length < 2) && !placeId) {
      setSearchTargetBounds(null);
      setSearchTargetCenter(null);
      return;
    }
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        await loadGoogleMaps();
        const g = (window as any).google;
        if (placeId && g?.maps?.places) {
          // Resolve by placeId for precise bounds/center
          const svc = new g.maps.places.PlacesService(document.createElement('div'));
          svc.getDetails({ placeId, fields: ['geometry'] }, (res: any, status: string) => {
            if (status !== 'OK' || !res?.geometry) return;
            const geom = res.geometry;
            if (geom.viewport) {
              const ne = geom.viewport.getNorthEast();
              const sw = geom.viewport.getSouthWest();
              setSearchTargetBounds({
                northeast: { lat: ne.lat(), lng: ne.lng() },
                southwest: { lat: sw.lat(), lng: sw.lng() },
              });
              setSearchTargetCenter(null);
            } else if (geom.location) {
              setSearchTargetCenter({ lat: geom.location.lat(), lng: geom.location.lng() });
              setSearchTargetBounds(null);
            }
          });
          return;
        }
        if (!search || search.trim().length < 2) return;
        if (!g?.maps?.Geocoder) return;
        const geocoder = new g.maps.Geocoder();
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
  }, [search, placeId]);

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
