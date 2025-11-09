"use client";
import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { useAuth } from '@/lib/auth/provider';

function haversineKm(a: {lat:number; lng:number}, b: {lat:number; lng:number}) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const la1 = a.lat * Math.PI / 180;
  const la2 = b.lat * Math.PI / 180;
  const sinDLat = Math.sin(dLat/2);
  const sinDLng = Math.sin(dLng/2);
  const h = sinDLat*sinDLat + Math.cos(la1)*Math.cos(la2)*sinDLng*sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1-h));
  return R * c;
}

export default function DistanceIndicator({ ownerId, lat, lng }: { ownerId?: string | null; lat?: number; lng?: number }) {
  const { user } = useAuth();
  const [pos, setPos] = useState<{lat:number; lng:number} | null>(null);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setDenied(true); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setDenied(true),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );
  }, []);

  if (user?.id && ownerId && user.id === ownerId) return null;
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const distanceKm = useMemo(() => {
    if (!pos) return null;
    return haversineKm(pos, { lat, lng });
  }, [pos, lat, lng]);

  let label = denied ? 'Enable location to see distance' : 'Locating…';
  let icon: ReactElement | null = null;
  if (distanceKm != null) {
    const km = distanceKm;
    if (km < 1) label = `${Math.round(km * 1000)} m away`;
    else if (km < 10) label = `${km.toFixed(1)} km away`;
    else label = `${Math.round(km)} km away`;
    if (km <= 1.2) {
      icon = (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600"><path d="M13.5 5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0"/><path d="M4 21l5-5 3 3 5-5 3 3"/><path d="M7 14l3-3 2 2 3-3"/></svg>
      );
    } else if (km <= 6) {
      icon = (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-600"><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/><path d="M5.5 17.5H8l2.5-4H14l3.5 6"/><path d="M6 12h5l1 2"/></svg>
      );
    } else {
      icon = (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700"><path d="M3 13l2-5h14l2 5"/><path d="M5 16h14"/><circle cx="7.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>
      );
    }
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border bg-white/90 px-3 py-1 text-xs text-gray-700 shadow">
      {icon}
      <span>{label}</span>
    </div>
  );
}
