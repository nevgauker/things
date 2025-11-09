"use client";
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { createThing } from '@/lib/api/endpoints';
import type { User } from '@/lib/api/types';
import { categories } from '@/lib/api/types';
import { symbolForCurrency } from '@/lib/money';
import { loadGoogleMaps } from '@/lib/maps/google';
import LocationPickerMap from '@/components/LocationPickerMap';
import { useAuth } from '@/lib/auth/provider';
import Image from 'next/image';

type ThingType = 'thing' | 'store' | 'event';

export default function NewThingPage() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<ThingType>('thing');
  const [category, setCategory] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [priceRange, setPriceRange] = useState<string>('');
  const [currencyCode, setCurrencyCode] = useState<string>('USD');
  const [latitude, setLatitude] = useState<string>('');
  const [longitude, setLongitude] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [start, setStart] = useState<string>('');
  const [end, setEnd] = useState<string>('');
  const [thingImages, setThingImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [typeOpen, setTypeOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [typeIndex, setTypeIndex] = useState(0);
  const [categoryIndex, setCategoryIndex] = useState(0);

  useEffect(() => {
    try {
      const u = window.localStorage.getItem('user');
      setUser(u ? (JSON.parse(u) as User) : null);
    } catch {
      setUser(null);
    }
  }, []);

  // Generate and cleanup preview URLs for selected images
  useEffect(() => {
    const urls = thingImages.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => {
      try { urls.forEach((u) => URL.revokeObjectURL(u)); } catch {}
    };
  }, [thingImages]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (!t.closest('[data-dd="type"]')) setTypeOpen(false);
      if (!t.closest('[data-dd="category"]')) setCategoryOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
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
        if (currencyCode) form.set('currencyCode', currencyCode);
      }
      if (thingImages.length > 0) {
        form.set('thingImage', thingImages[0]);
        // Optionally include additional images; backend may ignore until supported
        for (let i = 1; i < Math.min(thingImages.length, 5); i++) {
          form.set(`thingImage${i+1}`, thingImages[i]);
        }
      }

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

      <form onSubmit={onSubmit} className="card space-y-5 p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Name</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41L11 4a2 2 0 0 0-2.83 0L2 10.17a2 2 0 0 0 0 2.83L11.59 22a2 2 0 0 0 2.83 0l5.17-5.17a2 2 0 0 0 0-2.83Z"/><path d="M7 7h.01"/></svg>
              </span>
              <input className="w-full rounded border pl-9 pr-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Title" />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Type</label>
            <div className="relative" data-dd="type">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={typeOpen}
                onClick={()=>{ setTypeOpen((v)=>!v); setTypeIndex(['thing','store','event'].indexOf(type)); }}
                className="relative w-full rounded border pl-9 pr-8 py-2 text-left hover:border-gray-400"
                onKeyDown={(e)=>{
                  const opts: ThingType[] = ['thing','store','event'];
                  if (e.key === 'ArrowDown') { e.preventDefault(); setTypeOpen(true); setTypeIndex((i)=> (i+1) % opts.length); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setTypeOpen(true); setTypeIndex((i)=> (i-1+opts.length)%opts.length); }
                  if (e.key === 'Enter' && typeOpen) { e.preventDefault(); const id = (['thing','store','event'] as ThingType[])[typeIndex]; setType(id); setTypeOpen(false); }
                  if (e.key === 'Escape') { setTypeOpen(false); }
                }}
              >
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                  {type === 'store' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M16 22H8a4 4 0 0 1-4-4V9h20v9a4 4 0 0 1-4 4Z"/></svg>
                  ) : type === 'event' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  )}
                </span>
                <span className="block truncate capitalize">{type}</span>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
              </button>
              {typeOpen && (
                <ul role="listbox" className="absolute z-10 mt-1 w-full overflow-auto rounded border bg-white py-1 text-sm shadow">
                  {([
                    { id: 'thing', label: 'Thing' },
                    { id: 'store', label: 'Store' },
                    { id: 'event', label: 'Event' },
                  ] as {id: ThingType; label: string}[]).map((opt)=> (
                    <li key={opt.id} role="option" aria-selected={type===opt.id}>
                      <button type="button" onClick={()=>{ setType(opt.id); setTypeOpen(false); }} className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 ${(['thing','store','event'] as ThingType[])[typeIndex]===opt.id?'bg-gray-50':''}`}>
                        <span className="text-gray-600">
                          {opt.id === 'store' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1-5h16l1 5"/><path d="M16 22H8a4 4 0 0 1-4-4V9h20v9a4 4 0 0 1-4 4Z"/></svg>
                          ) : opt.id === 'event' ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                          )}
                        </span>
                        <span className="capitalize">{opt.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Category</label>
            <div className="relative" data-dd="category">
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={categoryOpen}
                onClick={()=>{ setCategoryOpen((v)=>!v); const idx = Math.max(0, categories.findIndex(c=>c.name===category)); setCategoryIndex(idx); }}
                className="relative w-full rounded border pl-9 pr-8 py-2 text-left hover:border-gray-400"
                onKeyDown={(e)=>{
                  const len = categories.length;
                  if (e.key === 'ArrowDown') { e.preventDefault(); setCategoryOpen(true); setCategoryIndex((i)=> (i+1)%len); }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setCategoryOpen(true); setCategoryIndex((i)=> (i-1+len)%len); }
                  if (e.key === 'Enter' && categoryOpen) { e.preventDefault(); const c = categories[categoryIndex]; setCategory(c?.name||''); setCategoryOpen(false); }
                  if (e.key === 'Escape') { setCategoryOpen(false); }
                }}
              >
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                  {category ? (
                    <Image src={`/categories/${category}.png`} alt="" width={16} height={16} />
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/></svg>
                  )}
                </span>
                <span className="block truncate">{category ? categories.find(c=>c.name===category)?.displayName : 'Select a category'}</span>
                <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
              </button>
              {categoryOpen && (
                <ul role="listbox" className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded border bg-white py-1 text-sm shadow">
                  <li key="none">
                    <button type="button" onClick={()=>{ setCategory(''); setCategoryOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50">
                      <span className="text-gray-600">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2v20"/><path d="M2 12h20"/></svg>
                      </span>
                      <span>None</span>
                    </button>
                  </li>
                  {categories.map((c, idx)=> (
                    <li key={c.id} role="option" aria-selected={category===c.name}>
                      <button type="button" onClick={()=>{ setCategory(c.name); setCategoryOpen(false); }} className={`flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 ${categoryIndex===idx?'bg-gray-50':''}`}>
                        <Image src={`/categories/${c.name}.png`} alt="" width={16} height={16} />
                        <span>{c.displayName}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {showPrice && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Price</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </span>
                  <input type="number" inputMode="decimal" step="any" className="w-full rounded border pl-9 pr-3 py-2" value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="e.g. 25" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Currency</label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
                  </span>
                  <select className="w-full rounded border pl-9 pr-3 py-2" value={currencyCode} onChange={(e)=>setCurrencyCode(e.target.value)}>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="AUD">AUD (A$)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="INR">INR (₹)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {showRange && (
              <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Price Range</label>
              <p className="-mt-1 mb-1 text-xs text-gray-500">Relative scale for stores (e.g., 1–5). Higher means more expensive.</p>
              <div className="relative">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14h6"/><path d="M14 10h6"/><path d="M4 18h16"/><path d="M4 6h16"/></svg>
                </span>
                <input type="number" inputMode="numeric" step="1" className="w-full rounded border pl-9 pr-3 py-2" value={priceRange} onChange={(e)=>setPriceRange(e.target.value)} placeholder="e.g. 2 (relative scale)" />
              </div>
            </div>
          )}

          {showEvent && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium">Start</label>
                <p className="-mt-1 mb-1 text-xs text-gray-500">Local time; adjust for your timezone if needed.</p>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </span>
                  <input type="datetime-local" className="w-full rounded border pl-9 pr-3 py-2" value={start} onChange={(e)=>setStart(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">End</label>
                <p className="-mt-1 mb-1 text-xs text-gray-500">Optional. Leave empty for open-ended events.</p>
                <div className="relative">
                  <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </span>
                  <input type="datetime-local" className="w-full rounded border pl-9 pr-3 py-2" value={end} onChange={(e)=>setEnd(e.target.value)} />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Latitude</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s8-4.5 8-10a8 8 0 0 0-16 0c0 5.5 8 10 8 10Z"/><circle cx="12" cy="11" r="3"/></svg>
              </span>
              <input className="w-full rounded border pl-9 pr-3 py-2" value={latitude} onChange={(e)=>setLatitude(e.target.value)} placeholder="e.g. 37.7749" inputMode="decimal" enterKeyHint="done" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Longitude</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s8-4.5 8-10a8 8 0 0 0-16 0c0 5.5 8 10 8 10Z"/><circle cx="12" cy="11" r="3"/></svg>
              </span>
              <input className="w-full rounded border pl-9 pr-3 py-2" value={longitude} onChange={(e)=>setLongitude(e.target.value)} placeholder="e.g. -122.4194" inputMode="decimal" enterKeyHint="done" />
            </div>
          </div>
          <div className="sm:col-span-2 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button type="button" className="btn-secondary w-full sm:w-auto" onClick={useCurrentLocation}>Use my current location</button>
            <span className="text-xs text-gray-500">or click on the map below</span>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Country</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 0 20"/></svg>
              </span>
              <input className="w-full rounded border pl-9 pr-3 py-2" value={country} onChange={(e)=>setCountry(e.target.value)} placeholder="Country" autoComplete="country" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">City</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V6a2 2 0 0 1 2-2h4"/><path d="M7 22V4h10a2 2 0 0 1 2 2v16"/><path d="M14 10h2"/><path d="M14 14h2"/><path d="M14 18h2"/></svg>
              </span>
              <input className="w-full rounded border pl-9 pr-3 py-2" value={city} onChange={(e)=>setCity(e.target.value)} placeholder="City" autoComplete="address-level2" />
            </div>
          </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">Image</label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M20.4 14.5L16 10 4 22"/></svg>
                  <span>Upload images</span>
                  <input multiple type="file" accept="image/*" className="hidden" onChange={(e)=> setThingImages(Array.from(e.target.files || [])) } />
                </label>
                {thingImages.length>0 && <span className="truncate text-xs text-gray-600">{thingImages.length} selected</span>}
              </div>
              {previewUrls.length>0 && (
                <div className="flex flex-wrap gap-2">
                  {previewUrls.map((u, i)=> (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded border">
                      <Image src={u} alt="" width={64} height={64} className="h-16 w-16 object-cover" />
                      <button
                        type="button"
                        aria-label="Remove image"
                        className="absolute right-0 top-0 m-0.5 rounded bg-white/80 p-0.5 text-gray-700 hover:bg-white"
                        onClick={() => setThingImages((arr)=> arr.filter((_, idx)=> idx !== i))}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
