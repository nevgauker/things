"use client";

import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '@/lib/maps/google';

type LatLng = { lat: number; lng: number };

/**
 * ApproximateMap renders a privacy-preserving map view:
 * - No exact marker is shown
 * - A soft circle indicates the general area
 * - The map is non-interactive by default
 */
export default function ApproximateMap({
  center,
  radiusKm = 2,
  className = '',
  interactive = false,
}: {
  center: LatLng | null;
  radiusKm?: number;
  className?: string;
  interactive?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let circle: any;
    let map: any;
    let cancelled = false;
    (async () => {
      if (!ref.current || !center) return;
      await loadGoogleMaps();
      if (cancelled || !window.google?.maps) return;
      map = new window.google.maps.Map(ref.current, {
        center,
        zoom: 13,
        disableDefaultUI: true,
        clickableIcons: false,
        keyboardShortcuts: interactive,
        draggable: interactive,
        gestureHandling: interactive ? 'greedy' : 'none',
      });
      const meters = Math.max(50, radiusKm * 1000);
      circle = new window.google.maps.Circle({
        map,
        center,
        radius: meters,
        strokeColor: '#1976D2',
        strokeOpacity: 0.5,
        strokeWeight: 1,
        fillColor: '#1976D2',
        fillOpacity: 0.12,
      });
      try {
        const bounds = circle.getBounds?.();
        if (bounds) map.fitBounds(bounds, 32);
      } catch {}
      setMapReady(true);
    })();
    return () => {
      cancelled = true;
      try { circle?.setMap?.(null); } catch {}
      try { map?.setMap?.(null); } catch {}
    };
  }, [center, radiusKm, interactive]);

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div ref={ref} className="absolute inset-0" />
      {/* Soft blur overlay to avoid reading exact tiles visually */}
      <div className="pointer-events-none absolute inset-0 bg-white/0 backdrop-blur-[1px]" aria-hidden="true" />
      {!center && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-600">
          Location hidden by seller
        </div>
      )}
    </div>
  );
}

