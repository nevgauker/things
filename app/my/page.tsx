"use client";
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchMyThings } from '@/lib/api/endpoints';
import ThingCard from '@/components/ThingCard';
import CategoryChips from '@/components/CategoryChips';
import type { Thing } from '@/lib/api/types';
import { getMockThings } from '@/lib/mock/things';
import { useAuth } from '@/lib/auth/provider';
import { api } from '@/lib/api/client';

export default function MyThingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'my' | 'mock'>('mock');
  const [allItems, setAllItems] = useState<Thing[]>([]);
  const [myItems, setMyItems] = useState<Thing[] | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [type, setType] = useState<'all' | 'thing' | 'store' | 'event'>('all');
  const [status, setStatus] = useState<'all' | 'available' | 'unavailable'>('all');

  // Paging
  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    const userStr = window.localStorage.getItem('user');
    if (userStr) setSource('my');

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (userStr) {
          const user = JSON.parse(userStr);
          const userId = (user as any)?.id || (user as any)?._id;
          const res = await fetchMyThings(String(userId));
          const items = res.things || [];
          if (items.length) {
            setMyItems(items as Thing[]);
            setAllItems(items as Thing[]);
            setSource('my');
          } else {
            setMyItems([]);
            setAllItems(getMockThings());
            setSource('mock');
          }
        } else {
          setAllItems(getMockThings());
          setSource('mock');
        }
      } catch {
        setAllItems(getMockThings());
        setSource('mock');
        setError('Showing mock data (failed to load your things).');
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading && user) load();
    if (!authLoading && !user) {
      setAllItems(getMockThings());
      setSource('mock');
      setLoading(false);
    }
  }, [authLoading, user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allItems.filter((t) => {
      if (q) {
        const hay = `${t.name ?? ''} ${t.category ?? ''} ${t.city ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (selectedCategories.length && t.category) {
        const match = selectedCategories.some((c) => t.category?.toLowerCase().includes(c.toLowerCase()));
        if (!match) return false;
      } else if (selectedCategories.length) {
        return false;
      }
      if (type !== 'all' && t.type !== type) return false;
      if (status !== 'all' && t.status !== status) return false;
      return true;
    });
  }, [allItems, search, selectedCategories, type, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => { setPage(1); }, [search, selectedCategories, type, status, allItems]);

  async function onDelete(id: string) {
    const ok = confirm('Delete this thing? This action cannot be undone.');
    if (!ok) return;
    try {
      await api.delete(`/api/things/${id}`);
      setAllItems((items) => items.filter((x) => x.id !== id));
      setMyItems((items) => (items ? items.filter((x) => x.id !== id) : items));
    } catch (e) {
      alert('Failed to delete');
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
      {!authLoading && !user && (
        <div className="mb-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          You are not signed in. Showing mock data.
        </div>
      )}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold">My Things</h1>
        <div className="inline-flex overflow-hidden rounded border">
          <button
            className={`px-3 py-1 text-sm ${source === 'my' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
            onClick={() => { setSource('my'); if (myItems) setAllItems(myItems); }}
            disabled={source === 'my'}
          >My data</button>
          <button
            className={`px-3 py-1 text-sm ${source === 'mock' ? 'bg-primary text-white' : 'bg-white text-gray-700'}`}
            onClick={() => { setSource('mock'); setAllItems(getMockThings()); }}
            disabled={source === 'mock'}
          >Mock data</button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <input
          value={search}
          onChange={(e)=>setSearch(e.target.value)}
          placeholder="Search by name, category, city…"
          className="rounded border px-3 py-2"
        />
        <select value={type} onChange={(e)=>setType(e.target.value as any)} className="rounded border px-3 py-2">
          <option value="all">All types</option>
          <option value="thing">Thing</option>
          <option value="store">Store</option>
          <option value="event">Event</option>
        </select>
        <select value={status} onChange={(e)=>setStatus(e.target.value as any)} className="rounded border px-3 py-2">
          <option value="all">All statuses</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
      </div>

      <div className="mb-4">
        <CategoryChips value={selectedCategories} onChange={setSelectedCategories} />
      </div>

      {loading && <div className="text-gray-500">Loading…</div>}
      {error && <div className="mb-3 text-sm text-amber-700">{error}</div>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pageItems.map((t: any) => (
          <div key={t.id} className="flex flex-col gap-2">
            <ThingCard thing={t} />
            <div className="flex items-center gap-2">
              <button className="btn-secondary" onClick={() => router.push(`/things/${t.id}`)}>View</button>
              {source === 'my' && user && (
                <>
                  <button className="btn-primary" onClick={() => router.push(`/things/${t.id}/edit`)}>Edit</button>
                  <button className="btn-danger" onClick={() => onDelete(t.id)}>Delete</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <span className="text-sm text-gray-600">{filtered.length} items • Page {page} of {totalPages}</span>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" disabled={page <= 1} onClick={()=>setPage((p)=>Math.max(1, p-1))}>Prev</button>
          <button className="btn-secondary" disabled={page >= totalPages} onClick={()=>setPage((p)=>Math.min(totalPages, p+1))}>Next</button>
        </div>
      </div>
    </div>
  );
}
