import type { Thing } from '@/lib/api/types';

export default function ThingCard({ thing }: { thing: Thing }) {
  return (
    <article className="card overflow-hidden">
      <div className="relative h-40 w-full bg-gray-100">
        {// eslint-disable-next-line @next/next/no-img-element
        <img
          src={thing.imageUrl || '/placeholder.png'}
          alt={thing.name ?? 'Thing'}
          className="h-full w-full object-cover"
        />}
      </div>
      <div className="space-y-1 p-4">
        <h3 className="truncate text-base font-semibold" title={thing.name}>{thing.name}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {thing.type && <span className="rounded bg-gray-100 px-2 py-0.5 text-xs uppercase">{thing.type}</span>}
          {thing.category && <span className="truncate">{thing.category}</span>}
        </div>
        {thing.price != null && thing.currencySymbol && (
          <div className="text-sm text-gray-800">{thing.currencySymbol}{thing.price}</div>
        )}
        {thing.fromGoogle && (
          <div className="text-xs text-amber-700">Imported from Google Places</div>
        )}
      </div>
    </article>
  );
}
