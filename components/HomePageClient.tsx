"use client";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useIsFetching } from '@tanstack/react-query';
import MapView from '@/components/MapView';
import HomeListSheet from '@/components/HomeListSheet';
import { useFetchThingsByBounds } from '@/lib/api/endpoints';
import type { Bounds, FetchThingsResponse } from '@/lib/api/types';
import { loadGoogleMaps } from '@/lib/maps/google';
import { track } from '@/lib/analytics';

type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'distance';

type FilterState = {
  type: string;
  status: string;
  priceMin: string;
  priceMax: string;
  eventStart: string;
  eventEnd: string;
  distanceKm: string;
  hasLocation: boolean;
};

export default function HomePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [activeBounds, setActiveBounds] = useState<Bounds | null>(null);
  const [mapBounds, setMapBounds] = useState<Bounds | null>(null);
  const [mapHeight, setMapHeight] = useState<number | null>(null);
  const [searchTargetBounds, setSearchTargetBounds] = useState<Bounds | null>(null);
  const [searchTargetCenter, setSearchTargetCenter] = useState<{ lat: number; lng: number } | null>(null);
  const geocodeTimerRef = useRef<any>(null);
  const geocodeRequestIdRef = useRef(0);
  const [placeId, setPlaceId] = useState<string | null>(null);
  const [showSearchArea, setShowSearchArea] = useState(false);
  const [selectedThingId, setSelectedThingId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const s = searchParams.get('search') || '';
    setSearch(s);
    setPlaceId(searchParams.get('placeId'));
    const catParam = searchParams.get('category') || '';
    const cats = catParam.split(',').map((t)=>t.trim()).filter(Boolean);
    setSelectedCategories(cats);
  }, [searchParams]);

  useEffect(() => {
    try {
      const seen = window.localStorage.getItem('home_onboarding_seen');
      if (!seen) setShowOnboarding(true);
      const saved = window.localStorage.getItem('home_last_bounds');
      if (saved) {
        const parsed = JSON.parse(saved) as Bounds;
        if (parsed?.northeast && parsed?.southwest) {
          setActiveBounds(parsed);
          setSearchTargetBounds(parsed);
          setShowSearchArea(false);
        }
      }
    } catch {}
  }, []);

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

  const type = (searchParams.get('type') || 'all').toLowerCase();
  const status = (searchParams.get('status') || 'all').toLowerCase();
  const priceMin = searchParams.get('priceMin') || '';
  const priceMax = searchParams.get('priceMax') || '';
  const eventStart = searchParams.get('eventStart') || '';
  const eventEnd = searchParams.get('eventEnd') || '';
  const distanceKm = searchParams.get('distanceKm') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const sort: SortKey = ['newest','priceAsc','priceDesc','distance'].includes(sortParam) ? (sortParam as SortKey) : 'newest';

  // Fetch strictly by active bounds (and optional categories). The `search` text is used only for geocoding/recentering.
  const { data, isLoading, error } = useFetchThingsByBounds({
    category: selectedCategories.length ? selectedCategories.join(',') : undefined,
    bounds: activeBounds,
    type: type && type !== 'all' ? type : undefined,
    status: status && status !== 'all' ? status : undefined,
    priceMin: priceMin || undefined,
    priceMax: priceMax || undefined,
    eventStart: eventStart || undefined,
    eventEnd: eventEnd || undefined,
  }) as { data?: FetchThingsResponse; isLoading: boolean; error: unknown };

  const items = data?.things ?? [];
  const isFetchingThings = useIsFetching({ queryKey: ['things'] }) > 0;
  const hasError = !!error;

  // Track user location for distance filters/sort
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { /* ignore */ },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLng / 2);
    const q = s1 * s1 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * s2 * s2;
    return 2 * R * Math.asin(Math.sqrt(q));
  }

  const filteredItems = useMemo(() => {
    let list = [...items];
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    const dist = distanceKm ? Number(distanceKm) : null;
    const start = eventStart ? new Date(eventStart) : null;
    const end = eventEnd ? new Date(eventEnd) : null;
    list = list.filter((t: any) => {
      if (type !== 'all' && t.type !== type) return false;
      if (status !== 'all' && t.status !== status) return false;
      if (min != null || max != null) {
        const priceVal = t.type === 'store' ? Number(t.priceRange) : Number(t.price);
        if (Number.isFinite(priceVal)) {
          if (min != null && priceVal < min) return false;
          if (max != null && priceVal > max) return false;
        }
      }
      if ((start || end) && t.type === 'event') {
        const s = t.start ? new Date(t.start) : null;
        const e = t.end ? new Date(t.end) : null;
        if (start && s && s < start) return false;
        if (end && e && e > end) return false;
      }
      if (dist != null && userLocation) {
        const pos = (t as any).position?.coordinates;
        let lat: number | null = null;
        let lng: number | null = null;
        if (Array.isArray(pos) && pos.length >= 2) { lng = Number(pos[0]); lat = Number(pos[1]); }
        if ((t as any).latitude != null && (t as any).longitude != null) {
          lat = Number((t as any).latitude);
          lng = Number((t as any).longitude);
        }
        if (lat != null && lng != null) {
          const d = haversineKm(userLocation, { lat, lng });
          if (d > dist) return false;
        }
      }
      return true;
    });
    if (sort === 'priceAsc') list.sort((a: any, b: any) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === 'priceDesc') list.sort((a: any, b: any) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    if (sort === 'distance' && userLocation) {
      list.sort((a: any, b: any) => {
        const getD = (t: any) => {
          const pos = t.position?.coordinates;
          let lat: number | null = null;
          let lng: number | null = null;
          if (Array.isArray(pos) && pos.length >= 2) { lng = Number(pos[0]); lat = Number(pos[1]); }
          if (t.latitude != null && t.longitude != null) { lat = Number(t.latitude); lng = Number(t.longitude); }
          if (lat == null || lng == null) return Infinity;
          return haversineKm(userLocation, { lat, lng });
        };
        return getD(a) - getD(b);
      });
    }
    return list;
  }, [items, type, status, priceMin, priceMax, eventStart, eventEnd, distanceKm, sort, userLocation]);

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
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          // ignore; leave map as-is
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    }
  }, [searchParams]);

  function boundsClose(a: Bounds | null, b: Bounds | null) {
    if (!a || !b) return false;
    const eps = 0.0008;
    return (
      Math.abs(a.northeast.lat - b.northeast.lat) < eps &&
      Math.abs(a.northeast.lng - b.northeast.lng) < eps &&
      Math.abs(a.southwest.lat - b.southwest.lat) < eps &&
      Math.abs(a.southwest.lng - b.southwest.lng) < eps
    );
  }

  function applySearchArea() {
    if (!mapBounds) return;
    setActiveBounds(mapBounds);
    setShowSearchArea(false);
    try {
      window.localStorage.setItem('home_last_bounds', JSON.stringify(mapBounds));
    } catch {}
    track('discovery_search_area', { bounds: mapBounds });
  }

  // Geocode or resolve placeId and steer the map.
  useEffect(() => {
    // Clear previous target when query is empty
    if ((!search || search.trim().length < 2) && !placeId) {
      setSearchTargetBounds(null);
      setSearchTargetCenter(null);
      return;
    }
    if (geocodeTimerRef.current) clearTimeout(geocodeTimerRef.current);
    const reqId = ++geocodeRequestIdRef.current;
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        await loadGoogleMaps();
        if (reqId !== geocodeRequestIdRef.current) return;
        const g = (window as any).google;
        if (placeId && g?.maps?.places) {
          // Resolve by placeId for precise bounds/center
          const svc = new g.maps.places.PlacesService(document.createElement('div'));
          svc.getDetails({ placeId, fields: ['geometry'] }, (res: any, status: string) => {
            if (reqId !== geocodeRequestIdRef.current) return;
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
          if (reqId !== geocodeRequestIdRef.current) return;
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

  const filters: FilterState = {
    type,
    status,
    priceMin,
    priceMax,
    eventStart,
    eventEnd,
    distanceKm,
    hasLocation: !!userLocation,
  };

  const handleBoundsChanged = useCallback((b: Bounds) => {
    setMapBounds(b);
    if (!activeBounds) {
      setActiveBounds(b);
      setShowSearchArea(false);
      try { window.localStorage.setItem('home_last_bounds', JSON.stringify(b)); } catch {}
      return;
    }
    if (!boundsClose(b, activeBounds)) setShowSearchArea(true);
  }, [activeBounds]);

  return (
    <Suspense>
      <div className="relative w-full" style={{ height: mapHeight ? `${mapHeight}px` : '100vh' }}>
        <MapView
          onBoundsChanged={handleBoundsChanged}
          items={filteredItems as any}
          className="h-full rounded-none border-0"
          showLegend={false}
          externalBounds={searchTargetBounds}
          externalCenter={searchTargetCenter}
          selectedId={selectedThingId}
          onMarkerSelect={(id) => setSelectedThingId(id)}
        />
        {activeBounds && isFetchingThings && (
          <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 rounded-full border bg-white/90 px-3 py-1 text-xs text-gray-700 shadow">
            Updatingâ€¦
          </div>
        )}
        {hasError && (
          <div className="absolute left-1/2 top-28 z-20 -translate-x-1/2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 shadow">
            Failed to load results. Try again.
          </div>
        )}
        {showSearchArea && (
          <div className="absolute right-3 top-24 z-20">
            <button
              type="button"
              className="rounded-full border bg-white px-4 py-2 text-sm font-medium shadow hover:bg-gray-50"
              onClick={applySearchArea}
            >
              Search this area
            </button>
          </div>
        )}
        {showOnboarding && (
          <div className="absolute left-1/2 top-24 z-20 w-[90vw] max-w-md -translate-x-1/2 rounded-2xl border bg-white/95 p-4 shadow-lg">
            <div className="text-sm font-semibold text-gray-800">Welcome to Things</div>
            <div className="mt-2 text-xs text-gray-600">
              Move the map to explore, then tap “Search this area”. Use filters to narrow results.
            </div>
            <div className="mt-3 flex justify-end">
              <button
                className="btn-primary"
                onClick={() => {
                  setShowOnboarding(false);
                  try { window.localStorage.setItem('home_onboarding_seen', '1'); } catch {}
                }}
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
        <HomeListSheet
          items={filteredItems as any}
          loading={isLoading}
          selectedId={selectedThingId}
          onHoverItem={(id) => setSelectedThingId(id)}
          sortKey={sort}
          onSortChange={(next) => {
            const sp = new URLSearchParams((searchParams && searchParams.toString()) || '');
            sp.set('sort', next);
            router.push((`${pathname}?${sp.toString()}`) as any);
            track('discovery_sort_change', { sort: next });
          }}
          filters={filters}
          onApplyFilters={(next) => {
            const sp = new URLSearchParams((searchParams && searchParams.toString()) || '');
            if (next.type && next.type !== 'all') sp.set('type', next.type); else sp.delete('type');
            if (next.status && next.status !== 'all') sp.set('status', next.status); else sp.delete('status');
            if (next.priceMin) sp.set('priceMin', next.priceMin); else sp.delete('priceMin');
            if (next.priceMax) sp.set('priceMax', next.priceMax); else sp.delete('priceMax');
            if (next.eventStart) sp.set('eventStart', next.eventStart); else sp.delete('eventStart');
            if (next.eventEnd) sp.set('eventEnd', next.eventEnd); else sp.delete('eventEnd');
            if (next.distanceKm) sp.set('distanceKm', next.distanceKm); else sp.delete('distanceKm');
            router.push((`${pathname}?${sp.toString()}`) as any);
            track('discovery_filters_apply', { filters: next });
          }}
        />
    </Suspense>

  );
}
