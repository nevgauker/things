"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { Bounds, Thing } from "@/lib/api/types";
import { symbolForCurrency } from "@/lib/money";
import { categories } from "@/lib/api/types";
import { loadGoogleMaps } from "@/lib/maps/google";

declare global {
  var google: any;
}

// Map style (gray, minimal POI icons)
const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.arterial", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadada" }] },
  { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "transit.line", elementType: "geometry", stylers: [{ color: "#e5e5e5" }] },
  { featureType: "transit.station", elementType: "geometry", stylers: [{ color: "#eeeeee" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9c9c9" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
];

export default function MapView({
  className = "",
  onBoundsChanged,
  items,
  fitToItems = true,
  showUserLocation = true,
  showLocateButton = true,
  showLegend = true,
}: {
  className?: string;
  onBoundsChanged?: (b: Bounds) => void;
  items?: Thing[];
  fitToItems?: boolean;
  showUserLocation?: boolean;
  showLocateButton?: boolean;
  showLegend?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const hasCenteredOnUserRef = useRef(false);
  const pendingCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const infoWindowRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const [legendOpen, setLegendOpen] = useState(true);
  const [ariaMessage, setAriaMessage] = useState<string>("");

  // Close legend on mobile
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      setLegendOpen(false);
    }
  }, []);

  // Category marker icon
  function markerIconForCategory(category?: string) {
    const c = String(category || "other").toLowerCase();
    const known = new Set(categories.map((k) => k.name));
    const file = known.has(c) ? c : "other";
    const url = `/categories/${file}.png`;
    return {
      url,
      scaledSize: new window.google.maps.Size(28, 28),
      anchor: new window.google.maps.Point(14, 14),
    } as any;
  }

  // Initialize map
  useEffect(() => {
    let listener: any;
    let debounceTimer: any;
    let initialEmitTimer: any;

    // Request geolocation as early as possible, and remember it for initial map center
    if (showUserLocation && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          pendingCenterRef.current = p;
          if (mapRef.current && window.google?.maps) {
            mapRef.current.setCenter(p);
            mapRef.current.setZoom(14);
            hasCenteredOnUserRef.current = true;
            if (userMarkerRef.current) {
              userMarkerRef.current.setPosition(p);
              userMarkerRef.current.setMap(mapRef.current);
            } else {
              userMarkerRef.current = new window.google.maps.Marker({
                map: mapRef.current,
                position: p,
                title: "You are here",
                icon: {
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#1a73e8",
                  fillOpacity: 1,
                  strokeColor: "#ffffff",
                  strokeWeight: 2,
                },
              });
            }
          }
          // If we were waiting to emit bounds, center+zoom will trigger an idle soon
          if (initialEmitTimer) {
            clearTimeout(initialEmitTimer);
            initialEmitTimer = undefined as unknown as any;
          }
        },
        () => { },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    }

    loadGoogleMaps()
      .then(() => {
        if (!ref.current) return;
        const center = pendingCenterRef.current || { lat: 37.7749, lng: -122.4194 }; // Default SF
        mapRef.current = new window.google.maps.Map(ref.current, {
          center,
          zoom: 12,
          disableDefaultUI: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          styles: mapStyles as any,
        });

        const emitBounds = () => {
          if (!onBoundsChanged) return;
          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            const bounds = mapRef.current?.getBounds?.();
            if (!bounds) return;
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            onBoundsChanged({
              northeast: { lat: ne.lat(), lng: ne.lng() },
              southwest: { lat: sw.lat(), lng: sw.lng() },
            });
          }, 150);
        };

        // Attach recurring bounds listener, but delay the very first emit
        listener = window.google.maps.event.addListener(mapRef.current, "idle", emitBounds);
        // Fallback: if geolocation is unavailable/denied, emit once after short delay
        initialEmitTimer = setTimeout(() => {
          emitBounds();
        }, 1200);

        // If we already have a pending center from early geolocation, ensure marker is shown
        if (showUserLocation && pendingCenterRef.current && window.google?.maps) {
          const p = pendingCenterRef.current;
          mapRef.current?.setCenter(p);
          mapRef.current?.setZoom(14);
          hasCenteredOnUserRef.current = true;
          userMarkerRef.current = new window.google.maps.Marker({
            map: mapRef.current,
            position: p,
            title: "You are here",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#1a73e8",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
        }
      })
      .catch(() => { });

    return () => {
      if (listener && window.google?.maps?.event?.removeListener) {
        window.google.maps.event.removeListener(listener);
      }
      if (debounceTimer) clearTimeout(debounceTimer);
      if (initialEmitTimer) clearTimeout(initialEmitTimer);
      userMarkerRef.current?.setMap(null);
    };
  }, [onBoundsChanged, showUserLocation]);

  // Update markers when items change
  useEffect(() => {
    if (!items || !mapRef.current || !window.google?.maps) return;

    // Clear old markers
    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [];
    clustererRef.current?.clearMarkers?.();
    clustererRef.current = null;

    const bounds = new window.google.maps.LatLngBounds();
    let added = 0;
    const newMarkers: any[] = [];

    for (const t of items) {
      let lat: number | undefined;
      let lng: number | undefined;
      const pos = (t as any).position?.coordinates;
      if (Array.isArray(pos) && pos.length >= 2) {
        lng = Number(pos[0]);
        lat = Number(pos[1]);
      } else if ((t as any).latitude != null && (t as any).longitude != null) {
        lat = Number((t as any).latitude);
        lng = Number((t as any).longitude);
      }
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        const marker = new window.google.maps.Marker({
          position: { lat, lng },
          title: t.name || undefined,
          icon: markerIconForCategory((t as any).category),
        });

        const id = (t as any).id || (t as any)._id;
        const name = t.name || "Thing";
        const cat = (t as any).category || "";
        const price = (t as any).price;
        const currency =
          symbolForCurrency((t as any).currencyCode) ||
          (t as any).currencySymbol ||
          "";
        const image = (t as any).imageUrl || "";
        const snippetParts = [
          cat ? `<div class="text-xs text-gray-600">${cat}</div>` : "",
          price != null && currency
            ? `<div class="text-sm font-medium">${currency}${price}</div>`
            : "",
        ].filter(Boolean);
        const detailsUrl = id ? `/things/${id}` : undefined;
        const imgHtml = `<img src="${image || "/placeholder.png"}" alt="" style="width:56px;height:56px;object-fit:cover;border-radius:6px;margin-right:8px;float:left;" />`;
        const catIcon = cat
          ? `<img src="/categories/${cat}.png" alt="" style="width:16px;height:16px;margin-right:6px;" />`
          : "";
        const contentHtml = `
          <div style="min-width:220px;max-width:280px;overflow:hidden;">
            <div style="display:flex;align-items:flex-start;">
              ${imgHtml}
              <div style="overflow:hidden;">
                <div style="font-weight:600;margin-bottom:4px;display:flex;align-items:center;">${catIcon}<span>${name}</span></div>
                ${snippetParts.join("")}
              </div>
            </div>
            ${detailsUrl
            ? `<div style="margin-top:8px"><a href="${detailsUrl}" style="background:#2563eb;color:#fff;border-radius:6px;padding:6px 10px;text-decoration:none;display:inline-block">View details</a></div>`
            : ""
          }
          </div>`;
        marker.addListener("click", () => {
          if (!infoWindowRef.current) {
            infoWindowRef.current = new window.google.maps.InfoWindow();
          }
          infoWindowRef.current.setContent(contentHtml);
          infoWindowRef.current.open({ map: mapRef.current, anchor: marker });
        });

        newMarkers.push(marker);
        bounds.extend(marker.getPosition());
        added++;
      }
    }

    if (newMarkers.length) {
      // ✅ Safe dynamic import (runtime-only)
      (async () => {
        try {
          const mod = await import("@googlemaps/markerclusterer");
          const MarkerClusterer = mod.MarkerClusterer || (mod as any).default;
          clustererRef.current = new MarkerClusterer({
            map: mapRef.current,
            markers: newMarkers,
          });
        } catch {
          for (const m of newMarkers) {
            m.setMap(mapRef.current);
            markersRef.current.push(m);
          }
        }
      })();
    }

    if (fitToItems && added > 0 && !hasCenteredOnUserRef.current) {
      mapRef.current.fitBounds(bounds, 40);
    }
  }, [items, fitToItems]);

  // Locate user again
  const recenterOnUser = () => {
    if (!mapRef.current || !showUserLocation || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        mapRef.current.setCenter(p);
        mapRef.current.setZoom(14);
        hasCenteredOnUserRef.current = true;
        if (userMarkerRef.current) {
          userMarkerRef.current.setPosition(p);
          userMarkerRef.current.setMap(mapRef.current);
        } else {
          userMarkerRef.current = new window.google.maps.Marker({
            map: mapRef.current,
            position: p,
            title: "You are here",
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#1a73e8",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
        }
      },
      () => { },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  };

  return (
    <div className={`relative w-full overflow-hidden ${className}`}>
      <div ref={ref} className="absolute inset-0" />
      {showLegend && (
        <div className="absolute left-3 top-3 z-10">
          {!legendOpen ? (
            <button
              type="button"
              onClick={() => setLegendOpen(true)}
              className="rounded-lg border bg-white/90 px-3 py-1 text-xs shadow hover:bg-white"
              aria-label="Open legend"
            >
              Show legend
            </button>
          ) : (
            <div className="max-h-56 overflow-auto rounded-lg border bg-white/90 p-2 shadow">
              <div className="mb-1 flex items-center justify-between gap-4">
                <div className="text-xs font-semibold text-gray-600">Categories</div>
                <button
                  type="button"
                  onClick={() => setLegendOpen(false)}
                  className="rounded px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                  aria-label="Hide legend"
                >
                  Hide
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-700">
                {categories.map((c) => (
                  <div key={c.id} className="flex items-center gap-2">
                    <Image
                      src={`/categories/${c.name}.png`}
                      alt={c.displayName}
                      width={16}
                      height={16}
                    />
                    <span>{c.displayName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {showLocateButton && (
        <div className="absolute bottom-3 right-3 z-10 flex flex-col items-center">
          <button
            type="button"
            aria-label="My location"
            className="rounded-full border bg-white/95 p-1.5 text-gray-700 shadow hover:bg-gray-100"
            onClick={() => { recenterOnUser(); setAriaMessage('Centered on your location'); setTimeout(()=>setAriaMessage(''), 1500); }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M12 2v3"></path>
              <path d="M12 19v3"></path>
              <path d="M22 12h-3"></path>
              <path d="M5 12H2"></path>
            </svg>
          </button>
          <div className="h-2" />
          <div className="flex flex-col items-center overflow-hidden rounded-md border bg-white/95 shadow">
            <button
              type="button"
              aria-label="Zoom in"
              className="px-2 py-1.5 text-gray-700 hover:bg-gray-100"
              onClick={() => {
                if (!mapRef.current) return;
                const z = mapRef.current.getZoom?.() ?? 12;
                mapRef.current.setZoom(Math.min(21, z + 1));
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              className="border-t border-gray-200 px-2 py-1.5 text-gray-700 hover:bg-gray-100"
              onClick={() => {
                if (!mapRef.current) return;
                const z = mapRef.current.getZoom?.() ?? 12;
                mapRef.current.setZoom(Math.max(0, z - 1));
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            </button>
          </div>
        </div>
      )}
      <div aria-live="polite" className="sr-only">{ariaMessage}</div>
    </div>
  );
}
