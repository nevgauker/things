"use client";
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { categories } from '@/lib/api/types';
import LocationPickerMap from '@/components/LocationPickerMap';
import { api } from '@/lib/api/client';
import { symbolForCurrency } from '@/lib/money';

function symbolToCode(sym?: string): string | undefined {
  const map: Record<string, string> = { '$': 'USD', '€': 'EUR', '£': 'GBP', 'A$': 'AUD', 'C$': 'CAD', '¥': 'JPY', '₹': 'INR' };
  if (!sym) return undefined;
  return map[sym] || undefined;
}

type Thing = {
  id: string;
  name?: string;
  imageUrl?: string;
  images?: string[];
  type?: string;
  category?: string;
  price?: number;
  currencyCode?: string;
  city?: string;
  country?: string;
  status?: string;
  start?: string;
  end?: string;
  latitude?: number;
  longitude?: number;
};

export default function ThingEditForm({ thing }: { thing: Thing }) {
  const router = useRouter();
  const [name, setName] = useState(thing.name || '');
  const [type, setType] = useState(thing.type || 'thing');
  const [category, setCategory] = useState(thing.category || '');
  const [price, setPrice] = useState(thing.price != null ? String(thing.price) : '');
  const [currencyCode, setCurrencyCode] = useState<string>((thing as any).currencyCode || symbolToCode((thing as any).currencySymbol) || 'USD');
  const [latitude, setLatitude] = useState(thing.latitude != null ? String(thing.latitude) : '');
  const [longitude, setLongitude] = useState(thing.longitude != null ? String(thing.longitude) : '');
  const [country, setCountry] = useState(thing.country || '');
  const [city, setCity] = useState(thing.city || '');
  const [start, setStart] = useState(thing.start || '');
  const [end, setEnd] = useState(thing.end || '');
  const initialImages = useMemo<string[]>(() => (thing as any).images || (thing.imageUrl ? [thing.imageUrl] : []), [thing]);
  const [existingImages, setExistingImages] = useState<string[]>(initialImages);
  const [uploads, setUploads] = useState<File[]>([]);
  const [uploadPreviews, setUploadPreviews] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImages[0] || null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  useEffect(()=>{
    try {
      const urls = uploads.map(f=>URL.createObjectURL(f));
      setUploadPreviews(urls);
      return () => { urls.forEach(u=>{ try { URL.revokeObjectURL(u);} catch{} }); };
    } catch {}
  }, [uploads]);

  const showPrice = type !== 'store';
  const showRange = type === 'store';
  const showEvent = type === 'event';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      const form = new FormData();
      form.set('name', name);
      form.set('type', type);
      if (category) form.set('category', category);
      if (latitude) form.set('latitude', latitude);
      if (longitude) form.set('longitude', longitude);
      if (country) form.set('country', country);
      if (city) form.set('city', city);
      if (showEvent) {
        if (start) form.set('start', start);
        if (end) form.set('end', end);
      } else if (showPrice) {
        if (price) form.set('price', price);
        if (currencyCode) form.set('currencyCode', currencyCode);
      }
      if (uploads.length > 0) {
        form.set('thingImage', uploads[0]);
        for (let i=1;i<Math.min(uploads.length, 5);i++) form.set(`thingImage${i+1}`, uploads[i]);
      } else {
        // No new uploads; persist existing order
        form.set('imagesJson', JSON.stringify(existingImages));
      }

      await api.patch(`/api/things/${thing.id}`, form);
      router.push(`/things/${thing.id}`);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update thing');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-4">
      {/* Preview */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <div className="relative h-40 w-full bg-gray-100">
          <Image
            src={previewUrl || '/placeholder.png'}
            alt={name || 'Thing image'}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            unoptimized
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input className="w-full rounded border px-3 py-2" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Title" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Type</label>
          <div className="flex items-center gap-2">
            <Image src={`/thingsType/${type || 'thing'}.png`} alt="Type icon" width={20} height={20} />
            <select className="w-full rounded border px-3 py-2" value={type} onChange={(e)=>setType(e.target.value)}>
              <option value="thing">Thing</option>
              <option value="store">Store</option>
              <option value="event">Event</option>
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Category</label>
          <div className="mb-2 grid grid-cols-6 gap-2 sm:grid-cols-8">
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => setCategory(c.name)}
                className={`flex items-center justify-center rounded border p-2 hover:border-primary ${category === c.name ? 'border-primary ring-1 ring-primary' : 'border-gray-200'}`}
                aria-label={c.displayName}
                title={c.displayName}
              >
                <Image src={`/categories/${c.name}.png`} alt={c.displayName} width={24} height={24} />
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {category ? (
              <Image src={`/categories/${category}.png`} alt="Category icon" width={20} height={20} />
            ) : (
              <Image src={'/categories/other.png'} alt="No category" width={20} height={20} className="opacity-60" />
            )}
            <select className="w-full rounded border px-3 py-2" value={category} onChange={(e)=>setCategory(e.target.value)}>
              <option value="">Select a category</option>
              {categories.map((c)=> (
                <option key={c.id} value={c.name}>{c.displayName}</option>
              ))}
            </select>
          </div>
        </div>
        {showPrice && (
          <>
            <div>
              <label className="mb-1 block text-sm font-medium">Price</label>
              <input type="number" inputMode="decimal" step="any" className="w-full rounded border px-3 py-2" value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="e.g. 25" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <select className="w-full rounded border px-3 py-2" value={currencyCode} onChange={(e)=>setCurrencyCode(e.target.value)}>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AUD">AUD (A$)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </>
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
          <input className="w-full rounded border px-3 py-2" value={latitude} onChange={(e)=>setLatitude(e.target.value)} placeholder="e.g. 37.7749" inputMode="decimal" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Longitude</label>
          <input className="w-full rounded border px-3 py-2" value={longitude} onChange={(e)=>setLongitude(e.target.value)} placeholder="e.g. -122.4194" inputMode="decimal" />
        </div>
        <div className="sm:col-span-2">
          <LocationPickerMap
            lat={latitude ? Number(latitude) : null}
            lng={longitude ? Number(longitude) : null}
            className="h-56 sm:h-64"
            onChange={(la, lo) => { setLatitude(String(la)); setLongitude(String(lo)); }}
            onAddress={(ci, co) => { if (ci) setCity(ci); if (co) setCountry(co); }}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Country</label>
          <input className="w-full rounded border px-3 py-2" value={country} onChange={(e)=>setCountry(e.target.value)} placeholder="Country" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">City</label>
          <input className="w-full rounded border px-3 py-2" value={city} onChange={(e)=>setCity(e.target.value)} placeholder="City" />
        </div>
        {/* Gallery management */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-semibold">Images</label>
          {existingImages.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {existingImages.map((url, i) => (
                <div key={`${url}-${i}`} className="relative h-16 w-16 overflow-hidden rounded border">
                  <Image src={url} alt="" width={64} height={64} className="h-16 w-16 object-cover" />
                  <div className="absolute inset-0 flex items-start justify-between p-0.5">
                    <button
                      type="button"
                      className={`rounded bg-white/80 p-0.5 text-xs ${i===0?'ring-1 ring-primary':''}`}
                      title="Set as cover"
                      onClick={()=>{
                        if (i===0) return; const next = existingImages.slice(); const [m]=next.splice(i,1); next.unshift(m); setExistingImages(next); setPreviewUrl(next[0]||null);
                      }}
                    >★</button>
                    <button
                      type="button"
                      className="rounded bg-white/80 p-0.5 text-xs"
                      title="Remove"
                      onClick={()=> setExistingImages((arr)=> arr.filter((_,idx)=> idx!==i))}
                    >×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded border bg-white px-3 py-2 text-sm text-gray-700 shadow-sm hover:bg-gray-50">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M20.4 14.5L16 10 4 22"/></svg>
            <span>Add images</span>
            <input multiple type="file" accept="image/*" className="hidden" onChange={(e)=> setUploads(Array.from(e.target.files || [])) } />
          </label>
          {uploads.length>0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {uploadPreviews.map((u, i)=> (
                <div key={i} className="relative h-16 w-16 overflow-hidden rounded border">
                  <Image src={u} alt="" width={64} height={64} className="h-16 w-16 object-cover" />
                  <button
                    type="button"
                    aria-label="Remove upload"
                    className="absolute right-0 top-0 m-0.5 rounded bg-white/80 p-0.5 text-gray-700 hover:bg-white"
                    onClick={()=> setUploads((arr)=> arr.filter((_, idx)=> idx !== i))}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button disabled={loading} className="btn-primary w-full sm:w-auto" type="submit">{loading ? 'Saving…' : 'Save changes'}</button>
        <button type="button" className="btn-secondary w-full sm:w-auto" onClick={()=>router.push(`/things/${thing.id}`)}>Cancel</button>
      </div>
    </form>
  );
}
