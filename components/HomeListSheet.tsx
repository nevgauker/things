"use client";
import Image from 'next/image';
import type { Thing } from '@/lib/api/types';
import { useState } from 'react';

export default function HomeListSheet({ items, loading }: { items: Thing[]; loading?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="pointer-events-auto fixed bottom-0 left-1/2 z-20 -translate-x-1/2">
      <div className={`mb-2 w-[80vw] max-w-[520px] overflow-hidden rounded-t-2xl border bg-white/95 shadow transition-[height] sm:max-w-[560px] lg:max-w-[640px] ${open ? 'h-64' : 'h-10'}`}>
        <button
          type="button"
          aria-label={open ? 'Collapse list' : 'Expand list'}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-2 border-b bg-white/70 py-2 text-sm text-gray-700 hover:bg-white"
        >
          <span className="h-1.5 w-10 rounded-full bg-gray-300" />
          <span>{open ? 'Hide results' : 'Show results'}</span>
          <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">{items.length}</span>
        </button>
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
