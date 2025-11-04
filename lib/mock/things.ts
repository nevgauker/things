import type { Thing } from '@/lib/api/types';

const sampleImages = [
  'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1515248137880-08f0d31b43e0?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740106531-4243f3831c78?q=80&w=600&auto=format&fit=crop',
];

const cats = ['gadgets','fashion','art','travel','food','entertainment','garden','household','pets','hobbies','office','cars','other'];
const types: Array<NonNullable<Thing['type']>> = ['thing','store','event'];

function pick<T>(arr: T[], i: number) { return arr[i % arr.length]; }

export const mockThings: Thing[] = Array.from({ length: 24 }).map((_, i) => {
  const t = pick(types, i);
  const price = t !== 'store' ? Math.round((10 + (i * 3) % 90) * 100) / 100 : undefined;
  const priceRange = t === 'store' ? (1 + (i % 5)) : undefined;
  const baseLat = 37.7749 + (i % 6) * 0.01;
  const baseLng = -122.4194 + (i % 6) * 0.01;
  return {
    id: `mock-${i}`,
    name: t === 'event' ? `Event ${i + 1}` : t === 'store' ? `Store ${i + 1}` : `Thing ${i + 1}`,
    type: t,
    category: pick(cats, i),
    ownerId: 'mock-user',
    imageUrl: pick(sampleImages, i),
    price,
    priceRange,
    currencyCode: price != null ? 'USD' : undefined,
    country: 'United States',
    city: 'San Francisco',
    status: i % 7 === 0 ? 'unavailable' : 'available',
    position: { type: 'Point', coordinates: [baseLng, baseLat] },
    start: t === 'event' ? new Date(Date.now() + i * 86400000).toISOString() : undefined,
    end: t === 'event' ? new Date(Date.now() + (i + 1) * 86400000).toISOString() : undefined,
    fromGoogle: false,
  } as Thing;
});

export function getMockThings() {
  return mockThings;
}
