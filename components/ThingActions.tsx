"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/provider';

export default function ThingActions({ thingId, ownerId, thingName }: { thingId: string; ownerId?: string | null; thingName?: string | null; }) {
  const router = useRouter();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
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

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button className="btn-secondary" onClick={onShare}>{copied ? 'Copied!' : 'Share'}</button>
    </div>
  );
}
