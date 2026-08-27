"use client";

import { useState } from "react";
import { AuthModal } from "@/components/AuthModal";

export default function PricingPage() {
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function checkout() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/checkout", { method: "POST" });
      const data = await res.json();
      if (res.status === 401) {
        setAuthOpen(true);
        throw new Error("Sign in with a magic link first.");
      }
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-500">Pricing</p>
      <h1 className="mt-2 font-display text-5xl">One free clip. Then Pro.</h1>
      <p className="mt-4 max-w-xl text-paper-300">
        USD. Cancel anytime. If Stripe keys are not set, checkout opens a working test-mode stub.
      </p>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <article className="rounded-[2rem] border border-white/10 bg-ink-800 p-7">
          <p className="text-sm text-paper-500">Free</p>
          <p className="mt-2 font-display text-5xl">$0</p>
          <ul className="mt-6 space-y-2 text-sm text-paper-300">
            <li>1 render</li>
            <li>Watermark on the clip</li>
            <li>1080×1920 H.264</li>
            <li>No card required</li>
          </ul>
          <a href="/studio" className="mt-8 inline-block rounded-full border border-white/15 px-5 py-2.5 text-sm">
            Start free
          </a>
        </article>
        <article className="rounded-[2rem] border border-gold-500/40 bg-ink-800 p-7 shadow-glow">
          <p className="text-sm text-gold-500">Pro</p>
          <p className="mt-2 font-display text-5xl">
            $29<span className="text-2xl text-paper-500">/mo</span>
          </p>
          <ul className="mt-6 space-y-2 text-sm text-paper-300">
            <li>Unlimited renders</li>
            <li>No watermark</li>
            <li>Same 9:16 pipeline</li>
            <li>Priority in the queue (v1: same box)</li>
          </ul>
          <button
            onClick={checkout}
            disabled={busy}
            className="mt-8 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-950 disabled:opacity-50"
          >
            {busy ? "Opening…" : "Upgrade to Pro"}
          </button>
        </article>
      </div>
      {error && <p className="mt-6 text-sm text-red-300">{error}</p>}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
