"use client";
import Image from 'next/image';
import type { Thing } from '@/lib/api/types';
import { useState } from 'react';

export default function HomeListSheet({ items, loading }: { items: Thing[]; loading?: boolean }) {
  const [open, setOpen] = useState(true);
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
          <button type="button" aria-label="Filters" className="rounded-full border bg-white/90 p-2 shadow-sm hover:bg-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12 10 19 14 21 14 12 22 3"/></svg>
          </button>
        </div>
        <div className="absolute -top-4 right-2 hidden gap-2 sm:flex lg:hidden">
          <button type="button" aria-label="Sort" className="rounded-full border bg-white/90 p-2 shadow-sm hover:bg-white">
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
              {items.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-3 py-2">
                  <div className="h-12 w-12 overflow-hidden rounded bg-gray-100">
                    <Image src={t.imageUrl || '/placeholder.png'} alt="" width={48} height={48} className="h-12 w-12 object-cover" loading="lazy" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-800">{t.name || 'Thing'}</div>
                    <div className="truncate text-xs text-gray-600">{[t.category, t.city, t.country].filter(Boolean).join(' • ')}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
