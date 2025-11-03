"use client";
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/provider';

export default function Header({ onSearch }: { onSearch?: (q: string) => void }) {
  const [q, setQ] = useState('');
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  function onSignOut() {
    signOut();
    setMenuOpen(false);
    router.push('/');
  }

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!menuOpen) return;
      const t = e.target as Node | null;
      if (menuRef.current && !menuRef.current.contains(t) && menuBtnRef.current && !menuBtnRef.current.contains(t)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [menuOpen]);
  return (
    <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="font-semibold text-primary">Things</Link>
        <div className="flex-1" />
        <div className="flex w-full max-w-md items-center gap-2 rounded-lg border bg-surface px-3 py-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (onSearch) onSearch(q);
                else router.push(`/?search=${encodeURIComponent(q)}`);
              }
            }}
            placeholder="Search nearby…"
            className="w-full bg-transparent outline-none"
          />
          <button
            className="btn-primary"
            onClick={() => {
              if (onSearch) onSearch(q);
              else router.push(`/?search=${encodeURIComponent(q)}`);
            }}
          >
            Search
          </button>
        </div>
        {/* Desktop nav */}
        <nav className="ml-4 hidden items-center gap-4 md:flex">
          {user && (
            <Link href="/my" className="text-sm text-gray-700 hover:text-primary">My Things</Link>
          )}
          {user && (
            <Link href="/my/new" className="text-sm text-primary hover:underline">Add Thing</Link>
          )}
          {!user ? (
            <Link href="/signin" className="text-sm text-gray-700 hover:text-primary">Sign in</Link>
          ) : (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">Signed in by {user.name || user.email}</span>
              <button onClick={onSignOut} className="text-sm text-gray-700 hover:text-primary">Sign out</button>
            </div>
          )}
        </nav>

        {/* Mobile menu button */}
        <div className="ml-2 md:hidden">
          <button
            ref={menuBtnRef}
            aria-label="Open menu"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="rounded p-2 hover:bg-gray-100"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          {menuOpen && (
            <div ref={menuRef} className="absolute right-3 top-14 z-20 w-56 overflow-hidden rounded-lg border bg-white shadow-lg">
              <div className="flex flex-col">
                {user && (
                  <Link href="/my" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={()=>setMenuOpen(false)}>My Things</Link>
                )}
                {user && (
                  <Link href="/my/new" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={()=>setMenuOpen(false)}>Add Thing</Link>
                )}
                {!user ? (
                  <Link href="/signin" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={()=>setMenuOpen(false)}>Sign in</Link>
                ) : (
                  <>
                    <div className="px-4 py-2 text-xs text-gray-500">Signed in by {user.name || user.email}</div>
                    <button className="px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" onClick={onSignOut}>Sign out</button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

