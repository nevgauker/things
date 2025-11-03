"use client";
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/api/endpoints';

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [preferredCurrency, setPreferredCurrency] = useState('$');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUp({ name, email, password, preferredCurrency, userAvatar: avatar });
      router.push(next as any);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Sign-up failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Create account</h1>
      <form onSubmit={onSubmit} className="card space-y-4 p-4">
        <input className="w-full rounded border px-3 py-2" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-700">Preferred currency</label>
          <select className="rounded border px-3 py-2" value={preferredCurrency} onChange={(e)=>setPreferredCurrency(e.target.value)}>
            <option value="$">$</option>
            <option value="€">€</option>
            <option value="£">£</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-700">Avatar (optional)</label>
          <input type="file" accept="image/*" onChange={(e)=>setAvatar(e.target.files?.[0] ?? null)} />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button disabled={loading} className="btn-primary w-full" type="submit">{loading ? 'Creating…' : 'Sign up'}</button>
      </form>
      <p className="mt-4 text-sm text-gray-600">Have an account? <Link href="/signin" className="text-primary">Sign in</Link></p>
    </div>
  );
}
