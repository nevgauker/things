"use client";
import { createContext, useContext, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import type { User } from '@/lib/api/types';
import { usePathname } from 'next/navigation';

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  refetch: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const pathname = usePathname();
  const onAuthPage = pathname === '/signin' || pathname === '/signup';
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        const res = await api.get<{ user: User }>('/api/auth/me');
        const user = res.data.user;
        if (typeof window !== 'undefined') window.localStorage.setItem('user', JSON.stringify(user));
        return user;
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    enabled: !onAuthPage, // prevent fetch + redirect loops on auth pages
    retry: false,
  });

  const value = useMemo<AuthContextValue>(() => ({
    user: data ?? null,
    loading: isLoading,
    refetch,
    signOut: async () => {
      try { await api.post('/api/auth/signout'); } catch {}
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('auth_token');
        window.localStorage.removeItem('user');
      }
      qc.invalidateQueries({ queryKey: ['auth'] });
    },
  }), [data, isLoading, refetch, qc]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

