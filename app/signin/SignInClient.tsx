"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/api/endpoints';
import { useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';

export default function SignInClient({ next, unauthorized }: { next: string; unauthorized?: string | null }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    if (unauthorized) setBanner('Please sign in to continue.');
  }, [unauthorized]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await signIn(email, password);
      // Optimistically set auth state to avoid flicker
      qc.setQueryData(['auth', 'me'], res.user);
      router.push(next as any);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Sign-in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <div className="mb-6 flex items-center justify-center gap-2 text-primary">
        <Image src="/mainIcon.png" alt="Things" width={56} height={56} />
        <span className="text-2xl font-bold">Things</span>
      </div>
      <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>
      {banner && <div className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{banner}</div>}
      <form onSubmit={onSubmit} className="card space-y-4 p-4">
        <label htmlFor="email" className="sr-only">Email</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16v16H4z" fill="none"/>
              <path d="M22 6l-10 7L2 6" />
            </svg>
          </span>
          <input id="email"
            className="w-full rounded border pl-9 pr-3 py-2"
            placeholder="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <label htmlFor="password" className="sr-only">Password</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="10" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </span>
          <input id="password"
            className="w-full rounded border pl-9 pr-10 py-2"
            placeholder="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-600 hover:bg-gray-100"
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.29 20.29 0 0 1 5.06-6.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.29 20.29 0 0 1-3.23 4.62" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button disabled={loading} className="btn-primary w-full" type="submit">{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <div className="mt-4 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-gray-600 hover:text-primary">Forgot password?</Link>
        <span className="text-gray-600">No account? <Link href="/signup" className="text-primary">Sign up</Link></span>
      </div>
    </div>
  );
}
