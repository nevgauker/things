"use client";

import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '@/lib/maps/google';

type Props = {
  lat?: number | null;
  lng?: number | null;
  className?: string;
  onChange?: (lat: number, lng: number) => void;
  onAddress?: (city?: string, country?: string) => void;
};

// Keep the map style consistent with the main map
const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  {
    featureType: 'administrative.land_parcel',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#bdbdbd' }],
  },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];

export default function LocationPickerMap({ lat, lng, className = '', onChange, onAddress }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    let mapClickListener: any;
    let markerDragListener: any;

    loadGoogleMaps()
      .then(() => {
        if (!ref.current) return;
        const hasInitial = typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng);
        const center = hasInitial ? { lat: lat as number, lng: lng as number } : { lat: 37.7749, lng: -122.4194 };
        mapRef.current = new (window as any).google.maps.Map(ref.current, {
          center,
          zoom: hasInitial ? 14 : 12,
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
          styles: mapStyles as any,
        });

        const ensureMarker = (position: { lat: number; lng: number }) => {
          if (!markerRef.current) {
            markerRef.current = new (window as any).google.maps.Marker({
              map: mapRef.current,
              position,
              draggable: true,
            });
            markerDragListener = (window as any).google.maps.event.addListener(markerRef.current, 'dragend', () => {
              const p = markerRef.current.getPosition();
              const newPos = { lat: p.lat(), lng: p.lng() };
              onChange?.(newPos.lat, newPos.lng);
              reverseGeocode(newPos.lat, newPos.lng);
            });
          } else {
            markerRef.current.setPosition(position);
          }
        };

        const reverseGeocode = (plat: number, plng: number) => {
          if (!onAddress) return;
          try {
            const geocoder = new (window as any).google.maps.Geocoder();
            geocoder.geocode({ location: { lat: plat, lng: plng } }, (results: any, status: string) => {
              if (status === 'OK' && results && results.length) {
                const components = results[0].address_components || [];
                const find = (type: string) => components.find((c: any) => c.types.includes(type));
                const locality = find('locality') || find('postal_town') || find('administrative_area_level_2') || find('administrative_area_level_1');
                const countryComp = find('country');
                onAddress(locality?.long_name, countryComp?.long_name);
              }
            });
          } catch {
            // ignore
          }
        };

        if (hasInitial) {
          ensureMarker(center);
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            mapRef.current?.setCenter(p);
            mapRef.current?.setZoom(14);
          });
        }

        mapClickListener = (window as any).google.maps.event.addListener(mapRef.current, 'click', (e: any) => {
          const p = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          ensureMarker(p);
          onChange?.(p.lat, p.lng);
          reverseGeocode(p.lat, p.lng);
        });
      })
      .catch(() => {
        // noop; leave container visible
      });

    return () => {
      const g = (window as any).google?.maps?.event;
      if (g?.removeListener) {
        if (mapClickListener) g.removeListener(mapClickListener);
        if (markerDragListener) g.removeListener(markerDragListener);
      }
    };
  }, [lat, lng, onChange, onAddress]);

  return <div className={`relative h-64 w-full overflow-hidden rounded-lg border ${className}`}><div ref={ref} className="absolute inset-0" /></div>;
}

