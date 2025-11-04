"use client";
import { useState } from 'react';

export default function ResetPasswordClient({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Failed');
      setMessage('Password updated. You can now sign in.');
    } catch (e: any) {
      setError(e?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <h1 className="mb-6 text-2xl font-semibold">Reset Password</h1>
      <form onSubmit={onSubmit} className="card space-y-4 p-4">
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="New password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" type="password" placeholder="Confirm password" value={confirm} onChange={(e)=>setConfirm(e.target.value)} />
        {message && <div className="text-sm text-green-700">{message}</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button disabled={loading} className="btn-primary w-full" type="submit">{loading ? 'Resetting…' : 'Reset password'}</button>
      </form>
    </div>
  );
}

