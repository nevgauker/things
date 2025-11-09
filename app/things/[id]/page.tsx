import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { symbolForCurrency } from '@/lib/money';
import MapView from '@/components/MapView';
import ThingOwnerSection from '@/components/ThingOwnerSection';
import ThingActions from '@/components/ThingActions';

type Thing = {
  id: string;
  name?: string;
  imageUrl?: string;
  type?: string;
  category?: string;
  price?: number;
  currencyCode?: string;
  priceRange?: number;
  city?: string;
  country?: string;
  status?: string;
  start?: string;
  end?: string;
  ownerImageUrl?: string;
  latitude?: number;
  longitude?: number;
  position?: { type: 'Point'; coordinates: [number, number] };
  ownerId?: string | null;
  owner?: { id: string; name?: string | null; email?: string; userAvatar?: string | null } | null;
  fromGoogle?: boolean;
  googleData?: { rating?: number; user_ratings_total?: number } | null;
};

export const dynamic = 'force-dynamic';

async function getThing(id: string): Promise<Thing | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || ''}/api/things/${id}`, {
      next: { revalidate: 0 },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.thing as Thing;
  } catch {
    return null;
  }
}

export default async function ThingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Protect route: require signed-in user
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) redirect(`/signin?next=/things/${encodeURIComponent(id)}`);
  } catch {
    redirect(`/signin?next=/things/${encodeURIComponent(id)}`);
  }
  const thing = await getThing(id);
  if (!thing) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <h1 className="text-2xl font-semibold">Thing not found</h1>
        <p className="mt-2 text-gray-600">We couldn’t load that thing. It may have been removed.</p>
      </div>
    );
  }

  // Derive coordinates if only GeoJSON provided
  const derivedLat = typeof thing.latitude === 'number'
    ? thing.latitude
    : Array.isArray(thing.position?.coordinates) ? thing.position!.coordinates[1] : undefined;
  const derivedLng = typeof thing.longitude === 'number'
    ? thing.longitude
    : Array.isArray(thing.position?.coordinates) ? thing.position!.coordinates[0] : undefined;

  const rating = thing.googleData?.rating;
  const ratingsTotal = thing.googleData?.user_ratings_total;

  const statusClass = (s?: string) => {
    const v = (s || '').toLowerCase();
    if (v === 'available' || v === 'active') return 'bg-green-100 text-green-700';
    if (v === 'unavailable' || v === 'inactive') return 'bg-gray-100 text-gray-700';
    if (v === 'sold' || v === 'ended') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Cover image */}
        <div className="overflow-hidden rounded-lg border bg-white">
          <div className="relative h-64 w-full bg-gray-100 md:h-80">
            <Image
              src={thing.imageUrl || '/placeholder.png'}
              alt={thing.name || 'Thing'}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Right: Details */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold">{thing.name}</h1>
            {thing.fromGoogle && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Google</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            {thing.type && <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs uppercase text-indigo-700">{thing.type}</span>}
            {thing.category && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">{thing.category}</span>}
            {thing.status && <span className={`rounded px-2 py-0.5 text-xs ${statusClass(thing.status)}`}>{thing.status}</span>}
            {typeof rating === 'number' && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">⭐ {rating} {ratingsTotal ? `(${ratingsTotal})` : ''}</span>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {thing.type !== 'store' && thing.price != null && (
              <div className="text-sm"><span className="text-gray-500">Price:</span> <span className="font-medium">{symbolForCurrency((thing as any).currencyCode) || (thing as any).currencySymbol || ''}{thing.price}</span></div>
            )}
            {thing.type === 'store' && thing.priceRange != null && (
              <div className="text-sm"><span className="text-gray-500">Price Range:</span> <span className="font-medium">{thing.priceRange}</span></div>
            )}
            {(thing.city || thing.country) && (
              <div className="text-sm"><span className="text-gray-500">Location:</span> <span className="font-medium">{[thing.city, thing.country].filter(Boolean).join(', ')}</span></div>
            )}
            {thing.type === 'event' && (thing.start || thing.end) && (
              <div className="text-sm text-gray-700">
                {thing.start && <span>Start: {new Date(thing.start).toLocaleString()}</span>}
                {thing.end && <span className="ml-2">End: {new Date(thing.end).toLocaleString()}</span>}
              </div>
            )}
            {(derivedLat != null && derivedLng != null) && (
              <div className="text-sm text-gray-600">Coords: {derivedLat.toFixed(5)}, {derivedLng.toFixed(5)}</div>
            )}
            {(derivedLat != null && derivedLng != null) && (
              <div>
                <a
                  className="btn-secondary text-sm"
                  href={`https://www.google.com/maps?q=${encodeURIComponent(`${derivedLat},${derivedLng}`)}`}
                  target="_blank" rel="noopener noreferrer"
                >
                  Open in Google Maps
                </a>
              </div>
            )}
          </div>

          <ThingOwnerSection ownerId={thing.ownerId as any} owner={thing.owner as any} fallbackAvatar={thing.ownerImageUrl as any} thingId={thing.id} />
          <ThingActions thingId={thing.id} ownerId={thing.ownerId as any} thingName={thing.name || null} />
        </div>
      </div>

      <div className="mt-6">
        <MapView
          className="h-64 md:h-80"
          items={[{ ...thing, latitude: derivedLat as any, longitude: derivedLng as any } as any]}
          fitToItems
          showLegend={false}
          showLocateButton={false}
          showUserLocation={false}
          interactive={false}
        />
      </div>
    </div>
  );
}
