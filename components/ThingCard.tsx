import type { Thing } from '@/lib/api/types';
import Image from 'next/image';
import { symbolForCurrency } from '@/lib/money';

export default function ThingCard({ thing }: { thing: Thing }) {
  return (
    <article className="card overflow-hidden">
      <div className="relative h-40 w-full bg-gray-100">
        <Image
          src={thing.imageUrl || '/placeholder.png'}
          alt={thing.name ?? 'Thing'}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      </div>
      <div className="space-y-1 p-4">
        <h3 className="truncate text-base font-semibold" title={thing.name}>{thing.name}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {thing.type && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase">{thing.type}</span>}
          {thing.category && <span className="truncate">{thing.category}</span>}
        </div>
        {thing.price != null && (
          <div className="text-sm text-gray-800">{symbolForCurrency((thing as any).currencyCode) || (thing as any).currencySymbol || ''}{thing.price}</div>
        )}
        {thing.fromGoogle && (
          <div className="text-xs text-amber-700">Imported from Google Places</div>
        )}
      </div>
    </article>
  );
}
