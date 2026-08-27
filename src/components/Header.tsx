"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthModal } from "./AuthModal";

type Me = {
  user: { id: string; email: string; plan: string } | null;
  quota: { remaining: number; plan: string; watermark: boolean };
};

export function Header() {
  const [me, setMe] = useState<Me | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  async function load() {
    const res = await fetch("/api/auth/me", { cache: "no-store" });
    if (res.ok) setMe(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMe(null);
    load();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-900/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-gold-500/40 bg-ink-800 text-gold-500">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
              <path d="M3 1.5h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2.2 3.4v4.2L9.4 7 5.2 4.9z" />
            </svg>
          </span>
          <span className="font-display text-lg tracking-tight">DeckClip</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm text-paper-300">
          <Link href="/pricing" className="rounded-full px-3 py-1.5 hover:text-paper-50">
            Pricing
          </Link>
          {me?.user ? (
            <>
              <span className="hidden rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-wide text-paper-500 sm:inline">
                {me.user.plan}
              </span>
              <Link href="/studio" className="rounded-full px-3 py-1.5 hover:text-paper-50">
                Studio
              </Link>
              <button onClick={signOut} className="rounded-full px-3 py-1.5 hover:text-paper-50">
                Sign out
              </button>
            </>
          ) : (
            <button onClick={() => setAuthOpen(true)} className="rounded-full px-3 py-1.5 hover:text-paper-50">
              Sign in
            </button>
          )}
          <Link
            href="/studio"
            className="ml-1 rounded-full bg-gold-500 px-4 py-1.5 font-medium text-ink-950 hover:bg-gold-400"
          >
            Open Studio
          </Link>
        </nav>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} onSigned={() => load()} />
    </header>
  );
}
