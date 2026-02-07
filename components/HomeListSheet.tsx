"use client";
import Image from 'next/image';
import Link from 'next/link';
import type { Thing } from '@/lib/api/types';
import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics';

export type FilterState = {
  type: string;
  status: string;
  priceMin: string;
  priceMax: string;
  eventStart: string;
  eventEnd: string;
  distanceKm: string;
  hasLocation: boolean;
};

type SortKey = 'newest' | 'priceAsc' | 'priceDesc' | 'distance';

type Props = {
  items: Thing[];
  loading?: boolean;
  selectedId?: string | null;
  onHoverItem?: (id: string) => void;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  filters: FilterState;
  onApplyFilters: (next: Omit<FilterState, 'hasLocation'>) => void;
};

export default function HomeListSheet({
  items,
  loading,
  selectedId,
  onHoverItem,
  sortKey,
  onSortChange,
  filters,
  onApplyFilters,
}: Props) {
  const [open, setOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [scrollTop, setScrollTop] = useState(0);

  // Persist open/closed state in localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = window.localStorage.getItem('home_results_sheet_open');
        if (saved === '1' || saved === 'true') setOpen(true);
      }
    } catch {}
    // no deps: run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('home_results_sheet_open', open ? '1' : '0');
      }
    } catch {}
  }, [open]);

  useEffect(() => {
    if (!selectedId) return;
    const el = itemRefs.current[selectedId];
    if (el && open) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedId, open]);

  const emptyMessage = loading
    ? null
    : items.length === 0
      ? 'No results here. Try moving the map or changing filters.'
      : null;

  const enableVirtual = items.length > 60;
  const rowHeight = 64;
  const listHeight = 256;
  const totalHeight = enableVirtual ? items.length * rowHeight : undefined;
  const start = enableVirtual ? Math.max(0, Math.floor(scrollTop / rowHeight) - 4) : 0;
  const end = enableVirtual ? Math.min(items.length, Math.ceil((scrollTop + listHeight) / rowHeight) + 4) : items.length;
  const visible = enableVirtual ? items.slice(start, end) : items;

  return (
    <div className="pointer-events-auto fixed bottom-0 left-1/2 z-20 -translate-x-1/2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}>
      <div className={`relative mb-2 w-[86vw] max-w-[560px] overflow-hidden rounded-t-2xl border bg-white/95 shadow-lg ring-1 ring-black/5 transition-[height] sm:max-w-[600px] lg:max-w-[680px] ${open ? 'h-72' : 'h-10'} pt-3`}>
        <button
          type="button"
          aria-label={open ? 'Collapse list' : 'Expand list'}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-2 border-b bg-white/80 py-2 text-sm text-gray-700 backdrop-blur-sm hover:bg-white"
        >
          <span className="h-1.5 w-10 rounded-full bg-gray-300" />
          <span>{open ? 'Hide results' : 'Show results'}</span>
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{items.length}</span>
        </button>
        {/* Quick actions */}
        <div className="absolute top-1 left-2 flex gap-2">
          <button type="button" aria-label="Filters" className="rounded-full border bg-white/90 p-2 shadow-sm hover:bg-white" onClick={()=>{ setFiltersOpen(true); setSortOpen(false); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12 10 19 14 21 14 12 22 3"/></svg>
          </button>
          <button type="button" aria-label="Sort" className="rounded-full border bg-white/90 p-2 shadow-sm hover:bg-white" onClick={()=>{ setSortOpen((v)=>!v); setFiltersOpen(false); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/><path d="M3 17l3 3 3-3"/><path d="M6 18V4"/></svg>
          </button>
        </div>

        {open && (
          <div
            className="max-h-64 overflow-y-auto"
            onScroll={(e) => setScrollTop((e.currentTarget as HTMLDivElement).scrollTop)}
          >
            {loading && (
              <div className="px-3 py-2">
                <div className="space-y-2">
                  {[1,2,3].map((i)=> (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded bg-gray-100 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-1/2 rounded bg-gray-100 animate-pulse" />
                        <div className="h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {emptyMessage && (
              <div className="px-3 py-2 text-sm text-gray-600">{emptyMessage}</div>
            )}
            {!loading && items.length > 0 && (
              <div className="relative" style={enableVirtual ? { height: totalHeight } : undefined}>
                <ul className={`divide-y ${enableVirtual ? 'absolute left-0 top-0 w-full' : ''}`} style={enableVirtual ? { transform: `translateY(${start * rowHeight}px)` } : undefined}>
                  {visible.map((t) => (
                    <li key={t.id} style={enableVirtual ? { height: rowHeight } : undefined}>
                      <Link
                        ref={(el) => { if (t.id) itemRefs.current[t.id] = el; }}
                        href={t.id ? `/things/${t.id}` : '#'}
                        className={`flex items-center gap-3 px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${selectedId === t.id ? 'bg-gray-50' : ''}`}
                        aria-label={`View ${t.name || 'item'}`}
                        onMouseEnter={() => { if (t.id && onHoverItem) onHoverItem(t.id); }}
                        onFocus={() => { if (t.id && onHoverItem) onHoverItem(t.id); }}
                        onClick={() => { if (t.id) track('discovery_result_click', { thingId: t.id }); }}
                      >
                        <div className="h-12 w-12 overflow-hidden rounded bg-gray-100">
                          <Image src={t.imageUrl || '/placeholder.png'} alt="" width={48} height={48} className="h-12 w-12 object-cover" loading="lazy" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-gray-800">{t.name || 'Thing'}</div>
                          <div className="truncate text-xs text-gray-600">{[t.category, t.city, t.country].filter(Boolean).join(' â€¢ ')}</div>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M9 18l6-6-6-6"/></svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Sort menu */}
        {sortOpen && (
          <div className="absolute -top-28 right-2 z-10 rounded-md border bg-white p-1 text-sm shadow">
            <button className={`block w-full rounded px-3 py-1 text-left hover:bg-gray-100 ${sortKey==='newest'?'bg-gray-50':''}`} onClick={()=>{ onSortChange('newest'); setSortOpen(false); }}>Newest</button>
            <button className={`block w-full rounded px-3 py-1 text-left hover:bg-gray-100 ${sortKey==='priceAsc'?'bg-gray-50':''}`} onClick={()=>{ onSortChange('priceAsc'); setSortOpen(false); }}>Price: Low to High</button>
            <button className={`block w-full rounded px-3 py-1 text-left hover:bg-gray-100 ${sortKey==='priceDesc'?'bg-gray-50':''}`} onClick={()=>{ onSortChange('priceDesc'); setSortOpen(false); }}>Price: High to Low</button>
            <button className={`block w-full rounded px-3 py-1 text-left hover:bg-gray-100 ${sortKey==='distance'?'bg-gray-50':''}`} onClick={()=>{ onSortChange('distance'); setSortOpen(false); }}>Distance</button>
          </div>
        )}
        {/* Filters modal */}
        {filtersOpen && (
          <FiltersModal onClose={()=>setFiltersOpen(false)} filters={filters} onApply={onApplyFilters} />
        )}
      </div>
    </div>
  );
}

function FiltersModal({
  onClose,
  filters,
  onApply,
}: {
  onClose: () => void;
  filters: FilterState;
  onApply: (next: Omit<FilterState, 'hasLocation'>) => void;
}) {
  const [type, setType] = useState(filters.type || 'all');
  const [status, setStatus] = useState(filters.status || 'all');
  const [priceMin, setPriceMin] = useState(filters.priceMin || '');
  const [priceMax, setPriceMax] = useState(filters.priceMax || '');
  const [eventStart, setEventStart] = useState(filters.eventStart || '');
  const [eventEnd, setEventEnd] = useState(filters.eventEnd || '');
  const [distanceKm, setDistanceKm] = useState(filters.distanceKm || '');

  function apply() {
    onApply({ type, status, priceMin, priceMax, eventStart, eventEnd, distanceKm });
    onClose();
  }

  function clearAll() {
    setType('all');
    setStatus('all');
    setPriceMin('');
    setPriceMax('');
    setEventStart('');
    setEventEnd('');
    setDistanceKm('');
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/20 p-3">
      <div className="w-full max-w-md rounded-2xl border bg-white p-4 shadow-lg">
        <div className="mb-3 text-sm font-semibold text-gray-700">Filters</div>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-gray-600">
              Type
              <select className="mt-1 w-full rounded border px-3 py-2" value={type} onChange={(e)=>setType(e.target.value)}>
                <option value="all">All</option>
                <option value="thing">Thing</option>
                <option value="store">Store</option>
                <option value="event">Event</option>
              </select>
            </label>
            <label className="text-sm text-gray-600">
              Status
              <select className="mt-1 w-full rounded border px-3 py-2" value={status} onChange={(e)=>setStatus(e.target.value)}>
                <option value="all">All</option>
                <option value="available">Available</option>
                <option value="unavailable">Unavailable</option>
                <option value="sold">Sold</option>
                <option value="ended">Ended</option>
              </select>
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-gray-600">
              Price min
              <input type="number" inputMode="decimal" className="mt-1 w-full rounded border px-3 py-2" value={priceMin} onChange={(e)=>setPriceMin(e.target.value)} placeholder="0" />
            </label>
            <label className="text-sm text-gray-600">
              Price max
              <input type="number" inputMode="decimal" className="mt-1 w-full rounded border px-3 py-2" value={priceMax} onChange={(e)=>setPriceMax(e.target.value)} placeholder="100" />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-gray-600">
              Event start
              <input type="date" className="mt-1 w-full rounded border px-3 py-2" value={eventStart} onChange={(e)=>setEventStart(e.target.value)} />
            </label>
            <label className="text-sm text-gray-600">
              Event end
              <input type="date" className="mt-1 w-full rounded border px-3 py-2" value={eventEnd} onChange={(e)=>setEventEnd(e.target.value)} />
            </label>
          </div>

          <label className="text-sm text-gray-600">
            Distance (km)
            <input type="number" inputMode="decimal" className="mt-1 w-full rounded border px-3 py-2" value={distanceKm} onChange={(e)=>setDistanceKm(e.target.value)} placeholder="5" />
            {!filters.hasLocation && (
              <div className="mt-1 text-xs text-gray-500">Distance works best with location permission.</div>
            )}
          </label>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button className="btn-secondary" onClick={clearAll}>Clear</button>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={apply}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}
