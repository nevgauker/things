"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/api/endpoints';
import { useQueryClient } from '@tanstack/react-query';

export default function SignInClient({ next, unauthorized }: { next: string; unauthorized?: string | null }) {
  const router = useRouter();
  const qc = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <h1 className="mb-6 text-2xl font-semibold">Sign in</h1>
      {banner && <div className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">{banner}</div>}
      <form onSubmit={onSubmit} className="card space-y-4 p-4">
        <input className="w-full rounded border px-3 py-2" placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
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
