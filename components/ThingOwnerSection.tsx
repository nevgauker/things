"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import type { User } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/provider';

export default function ThingOwnerSection({
  ownerId,
  fallbackAvatar,
  thingId,
  owner,
}: {
  ownerId?: string | null;
  fallbackAvatar?: string;
  thingId: string;
  owner?: User | null;
}) {
  const { user: me } = useAuth();
  const router = useRouter();
  const [ownerState, setOwnerState] = useState<User | null>(owner ?? null);
  const [loading, setLoading] = useState<boolean>(!!ownerId && !owner);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!ownerId || owner) return;
      try {
        setLoading(true);
        const res = await api.get<{ user: User }>(`/api/users/${ownerId}`);
        if (!mounted) return;
        setOwnerState(res.data.user);
      } catch {
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [ownerId, owner]);

  const avatar = ownerState?.userAvatar || fallbackAvatar || '/avatar.png';
  const name = ownerState?.name || ownerState?.email || 'Owner';
  const isOwner = !!(me?.id && ownerId && me.id === ownerId);

  return (
    <div className="mt-6 rounded-lg border bg-white p-4">
      <div className="mb-3 text-sm font-semibold text-gray-700">Owner</div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100">
          <Image src={avatar || '/avatar.png'} alt="Owner avatar" width={40} height={40} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm text-gray-800" title={name}>{name}</div>
          {ownerState?.email && <div className="truncate text-xs text-gray-500" title={ownerState.email}>{ownerState.email}</div>}
        </div>
      </div>
      {isOwner && (
        <div className="mt-3">
          <button
            className="btn-secondary"
            onClick={() => router.push(`/things/${thingId}/edit`)}
          >
            Edit Thing
          </button>
        </div>
      )}
    </div>
  );
}
