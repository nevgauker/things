"use client";
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuth } from '@/lib/auth/provider';

export default function ChatDialog({ open, onClose, withUserId, thingId }: {
  open: boolean;
  onClose: () => void;
  withUserId: string;
  thingId: string;
}) {
  const { user: me } = useAuth();
  const [messages, setMessages] = useState<Array<{ id?: string; senderId: string; text: string; createdAt?: string }>>([]);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        const res = await api.get(`/api/messages?thingId=${encodeURIComponent(thingId)}&withUserId=${encodeURIComponent(withUserId)}`);
        if (cancelled) return;
        setMessages(res.data.messages || []);
      } catch {
        if (!cancelled) setMessages([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 4000);
    return () => { cancelled = true; clearInterval(t); };
  }, [open, thingId, withUserId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const t = text.trim();
    if (!t) return;
    try {
      setPosting(true);
      setText('');
      await api.post('/api/messages', { thingId, toUserId: withUserId, text: t });
      // optimistic reload
      const res = await api.get(`/api/messages?thingId=${encodeURIComponent(thingId)}&withUserId=${encodeURIComponent(withUserId)}`);
      setMessages(res.data.messages || []);
    } catch {
      // ignore for now
    } finally {
      setPosting(false);
    }
  }

  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-xl border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-2">
          <div className="text-sm font-semibold text-gray-800">Message Seller</div>
          <button aria-label="Close" className="rounded p-1 text-gray-600 hover:bg-gray-100" onClick={onClose}>✕</button>
        </div>
        <div className="max-h-80 overflow-auto px-4 py-3">
          {messages.length === 0 && (
            <div className="text-sm text-gray-600">Start the conversation about this item.</div>
          )}
          {messages.map((m: any, i: number) => (
            <div key={m.id || i} className={`mb-2 flex ${m.senderId === me?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-1.5 text-sm ${m.senderId === me?.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'}`}>{m.text}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="flex items-center gap-2 border-t p-2">
          <input
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="Write a message…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          />
          <button className="btn-primary" onClick={send}>Send</button>
        </div>
      </div>
    </div>
  );
}
