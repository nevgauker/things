"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createThing } from '@/lib/api/endpoints';
import type { User } from '@/lib/api/types';
import { categories } from '@/lib/api/types';
import { loadGoogleMaps } from '@/lib/maps/google';
import LocationPickerMap from '@/components/LocationPickerMap';
import { useAuth } from '@/lib/auth/provider';

type ThingType = 'thing' | 'store' | 'event';

export default function NewThingPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<ThingType>('thing');
  const [category, setCategory] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [currencySymbol, setCurrencySymbol] = useState<string>('$');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [thingImage, setThingImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const u = window.localStorage.getItem('user');
      setUser(u ? (JSON.parse(u) as User) : null);
    } catch {
      setUser(null);
    }
  }, []);

  async function useCurrentLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setLatitude(String(lat));
      setLongitude(String(lng));

      try {
        await loadGoogleMaps();
        if ((window as any).google?.maps?.Geocoder) {
          const geocoder = new (window as any).google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results: any, status: string) => {
            if (status === 'OK' && results && results.length) {
              const components = results[0].address_components || [];
              const find = (type: string) => components.find((c: any) => c.types.includes(type));
              const locality = find('locality') || find('postal_town') || find('administrative_area_level_2') || find('administrative_area_level_1');
              const countryComp = find('country');
              if (locality?.long_name) setCity(locality.long_name);
              if (countryComp?.long_name) setCountry(countryComp.long_name);
            }
          });
        }
      } catch {
        // ignore failures; lat/lng already set
      }
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (!authUser) {
      setError('Please sign in to create a thing.');
      return;
    }
    if (!name || !type || !latitude || !longitude) {
      setError('Please fill name, type, latitude and longitude');
      return;
    }
    try {
      setLoading(true);
      const form = new FormData();
      form.set('name', name);
      form.set('type', type);
      if (category) form.set('category', category);
      if (user?.id) form.set('ownerId', user.id);
      if (user?.userAvatar) form.set('ownerImageUrl', user.userAvatar);
      form.set('latitude', latitude);
      form.set('longitude', longitude);
      if (country) form.set('country', country);
      if (city) form.set('city', city);
      if (type === 'event') {
        if (start) form.set('start', start);
        if (end) form.set('end', end);
      } else if (type === 'store') {
        if (priceRange) form.set('priceRange', priceRange);
      } else {
        if (price) form.set('price', price);
        if (currencySymbol) form.set('currencySymbol', currencySymbol);
      }
      if (thingImage) form.set('thingImage', thingImage);

      await createThing(form);
      setSuccess(true);
      window.location.href = '/my';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create thing');
    } finally {
      setLoading(false);
    }
  }

  const showPrice = type !== 'store';
  const showRange = type === 'store';
  const showEvent = type === 'event';

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
      {!authLoading && !authUser && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Please sign in to create a thing.
        </div>
      )}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Add a new Thing</h1>
        <Link className="text-sm text-primary" href="/my">Back to My Things</Link>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Name</label>
            <input className="w-full rounded border px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Title" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <select className="w-full rounded border px-3 py-2" value={type} onChange={(e)=>setType(e.target.value as ThingType)}>
              <option value="thing">Thing</option>
              <option value="store">Store</option>
              <option value="event">Event</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <select className="w-full rounded border px-3 py-2" value={category} onChange={(e)=>setCategory(e.target.value)}>
              <option value="">Select a category</option>
              {categories.map((c)=> (
                <option key={c.id} value={c.name}>{c.displayName}</option>
              ))}
            </select>
          </div>

          {showPrice && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Price</label>
                <input type="number" inputMode="decimal" step="any" className="w-full rounded border px-3 py-2" value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="e.g. 25" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Currency</label>
                <input className="w-full rounded border px-3 py-2" value={currencySymbol} onChange={(e)=>setCurrencySymbol(e.target.value)} placeholder="$" />
              </div>
            </>
          )}

          {showRange && (
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Price Range</label>
              <input type="number" inputMode="numeric" step="1" className="w-full rounded border px-3 py-2" value={priceRange} onChange={(e)=>setPriceRange(e.target.value)} placeholder="e.g. 2 (relative scale)" />
            </div>
          )}

          {showEvent && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Start</label>
                <input type="datetime-local" className="w-full rounded border px-3 py-2" value={start} onChange={(e)=>setStart(e.target.value)} />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">End</label>
                <input type="datetime-local" className="w-full rounded border px-3 py-2" value={end} onChange={(e)=>setEnd(e.target.value)} />
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Latitude</label>
            <input className="w-full rounded border px-3 py-2" value={latitude} onChange={(e)=>setLatitude(e.target.value)} placeholder="e.g. 37.7749" inputMode="decimal" enterKeyHint="done" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Longitude</label>
            <input className="w-full rounded border px-3 py-2" value={longitude} onChange={(e)=>setLongitude(e.target.value)} placeholder="e.g. -122.4194" inputMode="decimal" enterKeyHint="done" />
          </div>
          <div className="sm:col-span-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={useCurrentLocation}>Use my current location</button>
            <span className="text-xs text-gray-500">or click on the map below</span>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Country</label>
            <input className="w-full rounded border px-3 py-2" value={country} onChange={(e)=>setCountry(e.target.value)} placeholder="Country" autoComplete="country" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">City</label>
            <input className="w-full rounded border px-3 py-2" value={city} onChange={(e)=>setCity(e.target.value)} placeholder="City" autoComplete="address-level2" />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Image</label>
            <input type="file" accept="image/*" onChange={(e)=>setThingImage(e.target.files?.[0] || null)} />
          </div>
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}
        {success && <div className="text-sm text-green-700">Thing created.</div>}

        <div className="pt-2">
          <LocationPickerMap
            lat={latitude ? Number(latitude) : null}
            lng={longitude ? Number(longitude) : null}
            className="h-56 sm:h-64 md:h-72"
            onChange={(la, lo) => { setLatitude(String(la)); setLongitude(String(lo)); }}
            onAddress={(ci, co) => { if (ci) setCity(ci); if (co) setCountry(co); }}
          />
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <button disabled={loading || !authUser} className="btn-primary w-full sm:w-auto" type="submit">{loading ? 'Creating…' : 'Create Thing'}</button>
          <Link href="/my" className="btn-secondary w-full sm:w-auto text-center">Cancel</Link>
        </div>
      </form>
    </div>
  );
}

