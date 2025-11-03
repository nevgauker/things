"use client";
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { Bounds, FetchThingsResponse, Thing, User } from '@/lib/api/types';

// Things
export async function fetchThings(params: {
  bounds?: Bounds | null;
  category?: string; // comma separated
  searchText?: string;
  status?: string;
  type?: string; // single
  ownerId?: string;
}) {
  const qs = new URLSearchParams();
  if (params.searchText) qs.set('search', params.searchText);
  if (params.category) qs.set('category', params.category);
  if (params.type) qs.set('type', params.type);
  if (params.status) qs.set('status', params.status);
  if (params.ownerId) qs.set('ownerId', params.ownerId);
  if (params.bounds) {
    qs.set('neLat', String(params.bounds.northeast.lat));
    qs.set('neLng', String(params.bounds.northeast.lng));
    qs.set('swLat', String(params.bounds.southwest.lat));
    qs.set('swLng', String(params.bounds.southwest.lng));
  }
  const res = await api.get<FetchThingsResponse>(`/api/things?${qs.toString()}`);
  return res.data;
}

export function useFetchThingsByBounds(params: {
  bounds?: Bounds | null;
  category?: string;
  searchText?: string;
  status?: string;
  type?: string;
}) {
  return useQuery({
    queryKey: ['things', params],
    queryFn: async () => fetchThings(params),
    enabled: true,
  });
}

export async function fetchMyThings(ownerId: string) {
  const res = await api.get<FetchThingsResponse>(`/api/things?ownerId=${encodeURIComponent(ownerId)}`);
  return res.data;
}

export async function createThing(form: FormData) {
  const res = await api.post<{ thing: Thing }>('/api/things', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.thing;
}

// Users
export async function signIn(email: string, password: string) {
  const res = await api.post<{ token: string; user: User; newUser: boolean }>(
    '/api/auth/signin',
    { email, password }
  );
  if (typeof window !== 'undefined') {
    // Token is now stored as HttpOnly cookie by the server.
    window.localStorage.setItem('user', JSON.stringify(res.data.user));
  }
  return res.data;
}

export async function signUp(params: {
  name: string;
  email: string;
  password: string;
  userAvatar?: File | null;
  preferredCurrency?: string;
}) {
  const form = new FormData();
  form.set('name', params.name);
  form.set('email', params.email);
  form.set('password', params.password);
  form.set('preferredCurrency', params.preferredCurrency ?? '$');
  if (params.userAvatar) {
    form.set('userAvatar', params.userAvatar);
  }
  const res = await api.post<{ token: string; user: User; newUser: boolean }>('/api/users', form);
  return res.data;
}

export async function fetchUserById(id: string) {
  const res = await api.get<{ user: User }>(`/api/users/${id}`);
  return res.data.user;
}

