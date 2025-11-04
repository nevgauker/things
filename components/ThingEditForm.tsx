"use client";
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { categories } from '@/lib/api/types';
import LocationPickerMap from '@/components/LocationPickerMap';
import { api } from '@/lib/api/client';

type Thing = {
  id: string;
  name?: string;
  imageUrl?: string;
  type?: string;
  category?: string;
  price?: number;
  currencySymbol?: string;
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
  const [currencySymbol, setCurrencySymbol] = useState(thing.currencySymbol || '$');
  const [latitude, setLatitude] = useState(thing.latitude != null ? String(thing.latitude) : '');
  const [longitude, setLongitude] = useState(thing.longitude != null ? String(thing.longitude) : '');
  const [country, setCountry] = useState(thing.country || '');
  const [city, setCity] = useState(thing.city || '');
  const [start, setStart] = useState(thing.start || '');
  const [end, setEnd] = useState(thing.end || '');
  const [thingImage, setThingImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(thing.imageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        if (currencySymbol) form.set('currencySymbol', currencySymbol);
      }
      if (thingImage) form.set('thingImage', thingImage);

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
              <input className="w-full rounded border px-3 py-2" value={currencySymbol} onChange={(e)=>setCurrencySymbol(e.target.value)} placeholder="$" />
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
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e)=>{
              const f = e.target.files?.[0] || null;
              setThingImage(f);
              if (f) {
                const url = URL.createObjectURL(f);
                setPreviewUrl(url);
              } else {
                setPreviewUrl(thing.imageUrl || null);
              }
            }}
          />
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
