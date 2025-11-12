"use client";
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api/client';
import type { User } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/provider';
import ChatDialog from '@/components/ChatDialog';

export default function ThingOwnerSection({
  ownerId,
  fallbackAvatar,
  thingId,
  owner,
  privacyVisibility,
  privacyRadiusKm,
}: {
  ownerId?: string | null;
  fallbackAvatar?: string;
  thingId: string;
  owner?: User | null;
  privacyVisibility?: 'public_km' | 'verified_only' | 'hidden_until_contact';
  privacyRadiusKm?: number | null;
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
  const canManage = isOwner || !!me?.isAdmin;
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedChatUserId, setSelectedChatUserId] = useState<string | null>(null);
  const [vis, setVis] = useState<typeof privacyVisibility | undefined>(privacyVisibility);
  const [radius, setRadius] = useState<number>(Math.max(1, Math.round((privacyRadiusKm || 2))));
  const [approveUserId, setApproveUserId] = useState('');
  const [conversations, setConversations] = useState<Array<{ id: string; otherUser?: any; lastMessage?: any }>>([]);
  const [loadingConvs, setLoadingConvs] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadConvs() {
      if (!isOwner) return;
      try {
        setLoadingConvs(true);
        const res = await api.get(`/api/things/${thingId}/conversations`);
        if (!cancelled) setConversations(res.data.conversations || []);
      } catch {
        if (!cancelled) setConversations([]);
      } finally {
        if (!cancelled) setLoadingConvs(false);
      }
    }
    loadConvs();
  }, [isOwner, thingId]);

  async function onDelete() {
    if (!canManage) return;
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
    <div className="mt-6 rounded-lg border bg-white p-4">
      <div className="mb-3 text-sm font-semibold text-gray-700">Owner</div>
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 overflow-hidden rounded-full bg-gray-100">
          <Image src={avatar || '/avatar.png'} alt="Owner avatar" width={40} height={40} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm text-gray-800" title={name}>{name}</div>
          {/* Do not expose private contact details unless owner/admin */}
          {canManage && ownerState?.email && (
            <div className="truncate text-xs text-gray-500" title={ownerState.email}>{ownerState.email}</div>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {!isOwner && (
          <button className="btn-primary" onClick={() => { setSelectedChatUserId(String(ownerId)); setChatOpen(true); }}>Message Seller</button>
        )}
        {canManage && (
          <>
            <button
              className="btn-secondary"
              onClick={() => router.push(`/things/${thingId}/edit`)}
            >
              Edit
            </button>
            <button className="btn-danger" onClick={onDelete}>Delete</button>
          </>
        )}
      </div>
      {isOwner && (
        <div className="mt-4 rounded-lg border bg-white p-3">
          <div className="mb-2 text-sm font-semibold text-gray-700">Messages</div>
          {loadingConvs && <div className="text-sm text-gray-500">Loading…</div>}
          {!loadingConvs && conversations.length === 0 && (
            <div className="text-sm text-gray-600">No messages yet.</div>
          )}
          <div className="divide-y">
            {conversations.map((c) => (
              <button
                key={c.id}
                className="flex w-full items-center gap-3 py-2 text-left hover:bg-gray-50"
                onClick={() => { setSelectedChatUserId(String(c.otherUser?.id || '')); setChatOpen(true); }}
              >
                <Image src={c.otherUser?.userAvatar || '/avatar.png'} alt="" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="truncate text-sm text-gray-800">{c.otherUser?.name || c.otherUser?.id || 'Unknown user'}</div>
                  {c.lastMessage && (
                    <div className="truncate text-xs text-gray-500">{c.lastMessage.text}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      {isOwner && (
        <div className="mt-4 rounded-lg border bg-white p-3">
          <div className="mb-2 text-sm font-semibold text-gray-700">Approve exact location for a user</div>
          <div className="flex gap-2">
            <input
              className="w-full rounded border px-3 py-2 text-sm"
              placeholder="Enter user ID to approve"
              value={approveUserId}
              onChange={(e)=>setApproveUserId(e.target.value)}
            />
            <button
              className="btn-primary"
              onClick={async ()=>{
                const v = approveUserId.trim();
                if (!v) return;
                try {
                  await api.post(`/api/things/${thingId}/approve`, { viewerUserId: v });
                  alert('User approved to view exact location');
                  setApproveUserId('');
                } catch {
                  alert('Failed to approve user');
                }
              }}
            >Approve</button>
          </div>
          <div className="mt-1 text-xs text-gray-500">Paste the buyer's user ID. We can add a searchable UI later.</div>
        </div>
      )}
      {/* Visibility UI removed per simplification; approvals now control exact access */}
      {/* Lightweight in-app chat modal. Replace with real backend when available. */}
      {selectedChatUserId && (
        <ChatDialog open={chatOpen} onClose={() => setChatOpen(false)} withUserId={selectedChatUserId} thingId={thingId} />
      )}
    </div>
  );
}
