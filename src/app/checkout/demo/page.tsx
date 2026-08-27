"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthModal } from "@/components/AuthModal";

export default function DemoCheckout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  async function pay() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/checkout/complete", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (res.status === 401) {
      setAuthOpen(true);
      setError("Sign in first to upgrade.");
      return;
    }
    if (!res.ok) {
      setError(data.error || "Could not complete");
      return;
    }
    router.push("/studio?upgraded=1");
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-500">Checkout</p>
      <h1 className="mt-2 font-display text-4xl">Confirm Pro</h1>
      <p className="mt-4 text-paper-300">
        Unlimited renders, no watermark. Cancel anytime.
      </p>
      <div className="mt-8 rounded-3xl border border-white/10 bg-ink-800 p-6">
        <p className="text-sm text-paper-500">DeckClip Pro</p>
        <p className="mt-1 font-display text-4xl">$29 / month</p>
        <p className="mt-3 text-sm text-paper-300">Unlimited renders · no watermark</p>
        <button
          onClick={pay}
          disabled={busy}
          className="mt-6 w-full rounded-2xl bg-gold-500 py-3 font-semibold text-ink-950 disabled:opacity-50"
        >
          {busy ? "Confirming…" : "Pay $29"}
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
