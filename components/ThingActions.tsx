"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/provider';

export default function ThingActions({ thingId, ownerId, thingName }: { thingId: string; ownerId?: string | null; thingName?: string | null; }) {
  const router = useRouter();
  const { user } = useAuth();
  const isOwner = !!(user?.id && ownerId && user.id === ownerId);
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

  async function onDelete() {
    if (!isOwner) return;
    const ok = confirm('Delete this thing? This action cannot be undone.');
    if (!ok) return;
    try {
      await api.delete(`/api/things/${thingId}`);
      router.push('/my');
    } catch (e) {
      alert('Failed to delete');
    }
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      <button className="btn-secondary" onClick={onShare}>{copied ? 'Copied!' : 'Share'}</button>
      {isOwner && (
        <>
          <button className="btn-secondary" onClick={() => router.push(`/things/${thingId}/edit`)}>Edit</button>
          <button className="btn-danger" onClick={onDelete}>Delete</button>
        </>
      )}
    </div>
  );
}

