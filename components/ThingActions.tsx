"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/provider';

export default function ThingActions({ thingId, ownerId, thingName }: { thingId: string; ownerId?: string | null; thingName?: string | null; }) {
  const router = useRouter();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const url = typeof window !== 'undefined' ? window.location.origin + `/things/${thingId}` : '';

  async function onShare() {
    try {
      if (navigator.share) {
        await navigator.share({ title: thingName || 'Thing', url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  }

  function onToggleSave() {
    setSaved((s) => !s);
  }

  async function onReport() {
    const ok = confirm('Report this item for review?');
    if (!ok) return;
    try {
      // Optional: send to server later; for now just acks UI
      alert('Thanks for your report. We will review.');
    } catch {}
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button className="inline-flex items-center gap-2 rounded-full border bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={onShare} aria-label="Share">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
        <span>{copied ? 'Copied!' : 'Share'}</span>
      </button>
      <button className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${saved ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'}`} onClick={onToggleSave} aria-pressed={saved}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
        <span>{saved ? 'Saved' : 'Save'}</span>
      </button>
      <button className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 hover:bg-amber-100" onClick={onReport}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22V4a2 2 0 0 1 2-2h10l4 4v16"/><path d="M9 9h6"/><path d="M9 13h6"/><path d="M9 17h3"/></svg>
        <span>Report</span>
      </button>
    </div>
  );
}
