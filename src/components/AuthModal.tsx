"use client";

import { useState } from "react";

export function AuthModal({
  open,
  onClose,
  onSigned,
}: {
  open: boolean;
  onClose: () => void;
  onSigned?: () => void;
}) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [link, setLink] = useState("");

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    setLink("");
    try {
      const res = await fetch("/api/auth/magic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setMsg(data.message || "Check your email.");
      if (data.magicUrl) setLink(data.magicUrl);
      onSigned?.();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl border border-white/10 bg-ink-800 p-6 shadow-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-gold-500">Magic link</p>
        <h2 className="mt-2 font-display text-3xl">Sign in</h2>
        <p className="mt-2 text-sm text-paper-300">
          We email a link. In dev — or when no email key is set — the link is shown here and printed in the server log.
        </p>
        <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@studio.com"
            className="rounded-2xl border border-white/10 bg-ink-900 px-4 py-3 outline-none ring-gold-500 focus:ring-2"
          />
          <button
            disabled={busy}
            className="rounded-2xl bg-gold-500 px-4 py-3 font-medium text-ink-950 disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send link"}
          </button>
        </form>
        {msg && <p className="mt-4 text-sm text-paper-300">{msg}</p>}
        {link && (
          <a href={link} className="mt-3 block break-all rounded-2xl bg-ink-900 px-3 py-2 text-sm text-mint-400">
            {link}
          </a>
        )}
      </div>
    </div>
  );
}
