import type { Metadata } from 'next';
import Image from 'next/image';
import ThingImageGallery from '@/components/ThingImageGallery';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { symbolForCurrency } from '@/lib/money';
import ApproximateMap from '@/components/ApproximateMap';
import ThingOwnerSection from '@/components/ThingOwnerSection';
import ThingActions from '@/components/ThingActions';
import DistanceIndicator from '@/components/DistanceIndicator';

type Thing = {
  id: string;
  name?: string;
  imageUrl?: string;
  images?: string[];
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
  // Exact coords intentionally omitted in API for privacy
  approximateCenter?: { lat: number; lng: number } | null;
  approximateRadiusKm?: number | null;
  canNavigate?: boolean;
  exactCenter?: { lat: number; lng: number } | null;
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
  // Conditionally require sign-in unless privacy is globally disabled via env
  const PRIVACY_DISABLED =
    process.env.NEXT_PUBLIC_DISABLE_PRIVACY === 'true' ||
    process.env.NEXT_PUBLIC_DISABLE_PRIVACY === '1';
  if (!PRIVACY_DISABLED) {
    try {
      const cookieStore = await cookies();
      const token = cookieStore.get('auth_token')?.value;
      if (!token) redirect(`/signin?next=/things/${encodeURIComponent(id)}`);
    } catch {
      redirect(`/signin?next=/things/${encodeURIComponent(id)}`);
    }
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

  // Use approximate center provided by API. No exact coordinates are exposed client-side.
  const approx = thing.approximateCenter || null;
  const exact = (thing as any).exactCenter || null;

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
        <ThingImageGallery images={thing.images || (thing.imageUrl ? [thing.imageUrl] : [])} name={thing.name || 'Thing'} />

        {/* Right: Details */}
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold">{thing.name}</h1>
            {thing.fromGoogle && (
              <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Google</span>
            )}
          </div>
          <DistanceIndicator ownerId={thing.ownerId as any} lat={approx?.lat as any} lng={approx?.lng as any} />
          {(thing.city || thing.country) && (
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/90 px-3 py-1 text-xs text-gray-700 shadow">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 6-9 13-9 13S3 16 3 10a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>Near {[thing.city, thing.country].filter(Boolean).join(', ')}</span>
            </div>
          )}
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
            {/* City/Country already shown above in a privacy-preserving manner */}
            {thing.type === 'event' && (thing.start || thing.end) && (
              <div className="text-sm text-gray-700">
                {thing.start && <span>Start: {new Date(thing.start).toLocaleString()}</span>}
                {thing.end && <span className="ml-2">End: {new Date(thing.end).toLocaleString()}</span>}
              </div>
            )}
            {/* No exact coordinates or external map links to protect privacy */}
          </div>

          <ThingOwnerSection
            ownerId={thing.ownerId as any}
            owner={thing.owner as any}
            fallbackAvatar={thing.ownerImageUrl as any}
            thingId={thing.id}
            privacyVisibility={(thing as any).visibility}
            privacyRadiusKm={(thing as any).approximateRadiusKm as any}
          />
          <ThingActions thingId={thing.id} ownerId={thing.ownerId as any} thingName={thing.name || null} />
        </div>
      </div>

      {approx && !thing.canNavigate && (
        <div className="mt-6">
          <ApproximateMap className="h-64 md:h-80" center={approx as any} radiusKm={(thing as any).approximateRadiusKm || 2} />
        </div>
      )}
      {thing.canNavigate && exact && (
        <div className="mt-6 space-y-2">
          <div>
            <a
              className="btn-primary"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(exact.lat))},${encodeURIComponent(String(exact.lng))}`}
              target="_blank" rel="noopener noreferrer"
            >
              Open in Google Maps
            </a>
          </div>
          <ApproximateMap className="h-64 md:h-80" center={exact as any} radiusKm={0.1} interactive={true} />
        </div>
      )}
    </div>
  );
}
