"use client";
import Image from 'next/image';
import Link from 'next/link';
import type { Thing } from '@/lib/api/types';
import { useMemo, useState } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export default function HomeListSheet({ items, loading }: { items: Thing[]; loading?: boolean }) {
  const [open, setOpen] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sortKey, setSortKey] = useState<'newest'|'priceAsc'|'priceDesc'>('newest');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const displayed = useMemo(() => {
    const arr = [...items];
    if (sortKey === 'priceAsc') return arr.sort((a: any, b: any) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sortKey === 'priceDesc') return arr.sort((a: any, b: any) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
    return arr; // newest is default from API
  }, [items, sortKey]);
  return (
    <div className="pointer-events-auto fixed bottom-0 left-1/2 z-20 -translate-x-1/2" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px))' }}>
      <div className={`relative mb-2 w-[80vw] max-w-[520px] overflow-hidden rounded-t-2xl border bg-white/95 shadow-lg ring-1 ring-black/5 transition-[height] sm:max-w-[560px] lg:max-w-[640px] ${open ? 'h-64' : 'h-10'}`}>
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
        {/* Mobile spice: side quick actions (don’t overlap map controls) */}
        <div className="absolute -top-4 left-2 flex gap-2 md:hidden">
          <button type="button" aria-label="Filters" className="rounded-full border bg-white/90 p-2 shadow-sm hover:bg-white" onClick={()=>{ setFiltersOpen(true); setSortOpen(false); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12 10 19 14 21 14 12 22 3"/></svg>
          </button>
        </div>
        <div className="absolute -top-4 right-2 hidden gap-2 sm:flex lg:hidden">
          <button type="button" aria-label="Sort" className="rounded-full border bg-white/90 p-2 shadow-sm hover:bg-white" onClick={()=>{ setSortOpen((v)=>!v); setFiltersOpen(false); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5h10"/><path d="M11 9h7"/><path d="M11 13h4"/><path d="M3 17l3 3 3-3"/><path d="M6 18V4"/></svg>
          </button>
        </div>
        {open && (
          <div className="max-h-56 overflow-y-auto">
            {loading && (
              <div className="px-3 py-2 text-sm text-gray-600">Loading…</div>
            )}
            {!loading && items.length === 0 && (
              <div className="px-3 py-2 text-sm text-gray-600">No results in this area.</div>
            )}
            <ul className="divide-y">
              {displayed.map((t) => (
                <li key={t.id}>
                  <Link
                    href={t.id ? `/things/${t.id}` : '#'}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                    aria-label={`View ${t.name || 'item'}`}
                  >
                    <div className="h-12 w-12 overflow-hidden rounded bg-gray-100">
                      <Image src={t.imageUrl || '/placeholder.png'} alt="" width={48} height={48} className="h-12 w-12 object-cover" loading="lazy" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-gray-800">{t.name || 'Thing'}</div>
                      <div className="truncate text-xs text-gray-600">{[t.category, t.city, t.country].filter(Boolean).join(' • ')}</div>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M9 18l6-6-6-6"/></svg>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Sort menu */}
        {sortOpen && (
          <div className="absolute -top-28 right-2 z-10 rounded-md border bg-white p-1 text-sm shadow">
            <button className={`block w-full rounded px-3 py-1 text-left hover:bg-gray-100 ${sortKey==='newest'?'bg-gray-50':''}`} onClick={()=>{ setSortKey('newest'); setSortOpen(false); }}>Newest</button>
            <button className={`block w-full rounded px-3 py-1 text-left hover:bg-gray-100 ${sortKey==='priceAsc'?'bg-gray-50':''}`} onClick={()=>{ setSortKey('priceAsc'); setSortOpen(false); }}>Price: Low to High</button>
            <button className={`block w-full rounded px-3 py-1 text-left hover:bg-gray-100 ${sortKey==='priceDesc'?'bg-gray-50':''}`} onClick={()=>{ setSortKey('priceDesc'); setSortOpen(false); }}>Price: High to Low</button>
          </div>
        )}
        {/* Filters modal */}
        {filtersOpen && (
          <FiltersModal onClose={()=>setFiltersOpen(false)} pathname={pathname} searchParams={searchParams?.toString()||''} routerPush={(url)=>router.push(url as any)} />
        )}
      </div>
    </div>
  );
}

function FiltersModal({ onClose, pathname, searchParams, routerPush }: { onClose: ()=>void; pathname: string; searchParams: string; routerPush: (url:string)=>void }) {
  const sp = useMemo(()=> new URLSearchParams(searchParams || ''), [searchParams]);
  const initial = (sp.get('category')||'').split(',').map(s=>s.trim()).filter(Boolean);
  const [cats, setCats] = useState<string[]>(initial);
  function apply() {
    const next = new URLSearchParams(sp.toString());
    if (cats.length) next.set('category', cats.join(',')); else next.delete('category');
    routerPush(`${pathname}?${next.toString()}`);
    onClose();
  }
  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/20 p-3">
      <div className="w-full max-w-md rounded-2xl border bg-white p-3 shadow-lg">
        <div className="mb-2 text-sm font-semibold text-gray-700">Filters</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* Reuse chips with nowrap disabled for stacking */}
        {/* Using dynamic import here isn’t necessary; component is small */}
        {/* @ts-ignore - imported from global scope */}
        <div className="max-h-60 overflow-auto">
          {/* Inline import to avoid circular dep; CategoryChips already in bundle */}
          {/* We can’t import here; component scope. Duplicate simple UI would be overkill. */}
          {/* Instead, render small pill buttons like chips: */}
          <div className="-mx-1 flex flex-wrap gap-2 px-1 py-1">
            {['gadgets','fashion','art','travel','food','entertainment','garden','household','pets','hobbies','office','cars','other'].map((c)=>{
              const active = cats.includes(c);
              return (
                <button key={c} onClick={()=>{
                  setCats((prev)=> prev.includes(c) ? prev.filter(x=>x!==c) : [...prev, c]);
                }} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${active?'border-primary bg-primary text-white':'border-gray-200 bg-white text-gray-700 hover:border-primary'}`}>{c}</button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <button className="btn-secondary" onClick={()=>setCats([])}>Clear</button>
          <div className="flex items-center gap-2">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={apply}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}
