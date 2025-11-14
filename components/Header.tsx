"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/api/types';
import { useAuth } from '@/lib/auth/provider';
import CategoryChips from '@/components/CategoryChips';
import { useSearchParams, usePathname } from 'next/navigation';
import { loadGoogleMaps } from '@/lib/maps/google';

export default function Header({ onSearch }: { onSearch?: (q: string) => void }) {
  const [q, setQ] = useState('');
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [cats, setCats] = useState<string[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Array<{ description: string; place_id: string }>>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const acServiceRef = useRef<any>(null);
  const acTokenRef = useRef<any>(null);
  const acTimerRef = useRef<any>(null);
  const menuBtnRef = useRef<HTMLButtonElement | HTMLAnchorElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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

  // Prepare Google Places AutocompleteService
  useEffect(() => {
    loadGoogleMaps().then(() => {
      try {
        if ((window as any).google?.maps?.places) {
          acServiceRef.current = new (window as any).google.maps.places.AutocompleteService();
        }
      } catch {}
    });
    return () => {
      if (acTimerRef.current) clearTimeout(acTimerRef.current);
    };
  }, []);
  // Sync categories from URL
  useEffect(() => {
    if (!searchParams) return;
    const param = searchParams.get('category') || '';
    const tokens = param.split(',').map((s) => s.trim()).filter(Boolean);
    setCats(tokens);
    // Sync search query into the input
    const s = searchParams.get('search') || '';
    setQ(s);
  }, [searchParams]);

  function onCatsChange(next: string[]) {
    setCats(next);
    const sp = new URLSearchParams((searchParams && searchParams.toString()) || '');
    if (next.length) sp.set('category', next.join(','));
    else sp.delete('category');
    const s = sp.toString();
    router.push((`${pathname}?${s}`) as any);
  }

  function clearSearchAndRecenter() {
    setQ('');
    setSuggestions([]);
    setSuggestionsOpen(false);
    setActiveIndex(-1);
    acTokenRef.current = null;
    const sp = new URLSearchParams((searchParams && searchParams.toString()) || '');
    sp.delete('search');
    sp.delete('placeId');
    sp.set('recenter', 'user');
    const s = sp.toString();
    router.push((`${pathname}?${s}`) as any);
    // keep focus behavior natural
  }

  // Fetch autocomplete predictions when typing
  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!acServiceRef.current) return;
    if (acTimerRef.current) clearTimeout(acTimerRef.current);
    // New session token per burst of typing
    if (!acTokenRef.current && (window as any).google?.maps?.places?.AutocompleteSessionToken) {
      acTokenRef.current = new (window as any).google.maps.places.AutocompleteSessionToken();
    }
    acTimerRef.current = setTimeout(() => {
      try {
        acServiceRef.current.getPlacePredictions(
          {
            input: q,
            sessionToken: acTokenRef.current || undefined,
            // Prefer geocoding + establishments similar to Google Maps
            // types: undefined, // allow all
          },
          (preds: any[] | null) => {
            const list = Array.isArray(preds)
              ? preds.slice(0, 8).map((p) => ({ description: p.description, place_id: p.place_id }))
              : [];
            setSuggestions(list);
            setSuggestionsOpen(list.length > 0);
            setActiveIndex(list.length ? 0 : -1);
          }
        );
      } catch {
        setSuggestions([]);
        setSuggestionsOpen(false);
      }
    }, 200);
  }, [q]);

  function selectSuggestion(item: { description: string; place_id: string } | null) {
    if (!item) return;
    setQ(item.description);
    setSuggestions([]);
    setSuggestionsOpen(false);
    setActiveIndex(-1);
    acTokenRef.current = null; // end session
    const url = `/?search=${encodeURIComponent(item.description)}&placeId=${encodeURIComponent(item.place_id)}`;
    if (onSearch) onSearch(item.description);
    else router.push(url);
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-transparent">
      <div className="relative flex h-12 w-full items-center gap-2 px-2 md:px-3">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/70 to-transparent"></div>
        {/* Left: logo + search */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 font-semibold text-primary">
            <Image src="/mainIcon.png" alt="Things" width={32} height={32} />
            <span className="hidden sm:inline">Things</span>
          </Link>
          <div className="hidden sm:flex">
            <div className="relative flex w-[30ch] items-center gap-2 rounded-full border bg-white px-3 py-2 shadow-sm">
              <button
                aria-label="Search"
                className="rounded-full p-1.5 text-gray-600 hover:bg-gray-100"
                onClick={() => {
                  if (suggestionsOpen && activeIndex >= 0 && activeIndex < suggestions.length) {
                    selectSuggestion(suggestions[activeIndex]);
                    return;
                  }
                  if (onSearch) onSearch(q);
                  else router.push(`/?search=${encodeURIComponent(q)}`);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (!suggestionsOpen || !suggestions.length) return;
                    setActiveIndex((i) => Math.min(suggestions.length - 1, (i < 0 ? 0 : i + 1)));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (!suggestionsOpen || !suggestions.length) return;
                    setActiveIndex((i) => Math.max(0, i - 1));
                  } else if (e.key === 'Enter') {
                    if (suggestionsOpen && activeIndex >= 0 && activeIndex < suggestions.length) {
                      e.preventDefault();
                      selectSuggestion(suggestions[activeIndex]);
                    } else {
                      if (onSearch) onSearch(q);
                      else router.push(`/?search=${encodeURIComponent(q)}`);
                    }
                  } else if (e.key === 'Escape') {
                    setSuggestionsOpen(false);
                  }
                }}
                placeholder="Search nearby…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-500"
                onFocus={() => { if (suggestions.length) setSuggestionsOpen(true); }}
                onBlur={() => { setTimeout(() => setSuggestionsOpen(false), 120); }}
              />
              {q && (
                <button
                  aria-label="Clear search"
                  className="rounded-full p-1.5 text-gray-600 hover:bg-gray-100"
                  onClick={clearSearchAndRecenter}
                  title="Clear and center on my location"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              )}
              <button
                aria-label="Voice search"
                className="hidden rounded-full p-1.5 text-gray-600 hover:bg-gray-100 md:inline"
                onClick={() => { /* reserved for future voice search */ }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </button>
              {suggestionsOpen && suggestions.length > 0 && (
                <div className="absolute left-0 top-10 z-20 w-full overflow-hidden rounded-lg border bg-white shadow-lg">
                  <ul role="listbox" aria-label="Search suggestions" className="max-h-72 overflow-auto py-1 text-sm">
                    {suggestions.map((sug, idx) => (
                      <li
                        key={sug.place_id}
                        role="option"
                        aria-selected={idx === activeIndex}
                        className={`cursor-pointer px-3 py-2 text-gray-800 hover:bg-gray-50 ${idx === activeIndex ? 'bg-gray-100' : ''}`}
                        onMouseDown={(e) => { e.preventDefault(); }}
                        onClick={() => selectSuggestion(sug)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <div className="flex items-start gap-2">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 text-gray-500"><path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                          <span className="truncate">{sug.description}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center area now empty; filters moved below header */}
        <div className="flex flex-1 items-center justify-center" />

        {/* Right: quick actions + user (desktop) */}
        <nav className="hidden items-center gap-2 md:flex">
          {user && (
            <Link href="/my" className="rounded-full p-2 text-gray-700 hover:bg-gray-100" title="My Things" aria-label="My Things">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </Link>
          )}
          {user && (
            <Link href="/my/new" className="rounded-full p-2 text-gray-700 hover:bg-gray-100" title="Add Thing" aria-label="Add Thing">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </Link>
          )}
          {!user ? (
            <Link href="/signin" className="btn-primary">Sign in</Link>
          ) : (
            <div className="flex items-center gap-3">
              <button
                ref={menuBtnRef as any}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen((v) => !v)}
                className="group flex items-center gap-2 rounded-full p-1 hover:bg-gray-100"
                title={user.name || user.email}
              >
                <span className="hidden text-sm text-gray-700 group-hover:text-primary lg:inline">{user.name || user.email}</span>
                <Image src={user.userAvatar || '/avatar.png'} alt={user.name || 'User avatar'} width={32} height={32} className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200" />
              </button>
            </div>
          )}
        </nav>

        {/* Right: user/menu trigger (mobile) */}
        <div className="flex items-center gap-2 md:hidden">
          {!user ? (
            <Link href="/signin" className="btn-primary">Sign in</Link>
          ) : (
            <button
              ref={menuBtnRef as any}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-full p-1 hover:bg-gray-100"
              title={user.name || user.email}
            >
              <Image src={user.userAvatar || '/avatar.png'} alt={user.name || 'User avatar'} width={32} height={32} className="h-8 w-8 rounded-full object-cover ring-1 ring-gray-200" />
            </button>
          )}
        </div>

        {/* Dropdown menu (opens from user chip) */}
        {user && menuOpen && (
          <div ref={menuRef} className="absolute right-2 top-14 z-20 w-64 overflow-hidden rounded-lg border bg-white shadow-lg">
            <div className="flex flex-col">
              <Link
                href={`/users/${encodeURIComponent(String(user.id || 'me'))}`}
                className="flex items-center gap-2 px-4 py-3 hover:bg-gray-50"
                onClick={()=>setMenuOpen(false)}
              >
                <Image src={user.userAvatar || '/avatar.png'} alt="User avatar" width={28} height={28} className="h-7 w-7 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="truncate text-sm text-gray-800">{user.name || 'Profile'}</div>
                  {user.email && <div className="truncate text-xs text-gray-500">{user.email}</div>}
                </div>
              </Link>
              <hr className="border-gray-100" />
              <Link href="/my" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={()=>setMenuOpen(false)}>My Things</Link>
              <Link href="/my/new" className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-50" onClick={()=>setMenuOpen(false)}>Add Thing</Link>
              <button className="px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" onClick={() => { setMenuOpen(false); onSignOut(); }}>Sign out</button>
            </div>
          </div>
        )}
      </div>

      {/* Fixed filter bar below the nav */}
      {pathname === '/' && (
        <div className="fixed top-12 left-0 right-0 z-10 px-2 md:px-3">
          <div className="max-w-full overflow-x-auto scrollbar-none">
            <CategoryChips value={cats} onChange={onCatsChange} nowrap className="py-1" />
          </div>
        </div>
      )}
    </header>
  );
}
