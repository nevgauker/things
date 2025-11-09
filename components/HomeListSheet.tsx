"use client";
import Image from 'next/image';
import type { Thing } from '@/lib/api/types';
import { useState } from 'react';

export default function HomeListSheet({ items, loading }: { items: Thing[]; loading?: boolean }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-20">
      <div className={`mx-2 mb-2 overflow-hidden rounded-t-2xl border bg-white/95 shadow transition-[height] ${open ? 'h-64' : 'h-10'}`}>
        <button
          type="button"
          aria-label={open ? 'Collapse list' : 'Expand list'}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-2 border-b bg-white/70 py-2 text-sm text-gray-700 hover:bg-white"
        >
          <span className="h-1.5 w-10 rounded-full bg-gray-300" />
          <span>{open ? 'Hide results' : 'Show results'}</span>
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
                    <Image src={t.imageUrl || '/placeholder.png'} alt="" width={48} height={48} className="h-12 w-12 object-cover" />
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

