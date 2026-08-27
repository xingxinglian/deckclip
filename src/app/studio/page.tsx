"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthModal } from "@/components/AuthModal";

function StudioInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ stage: string; percent: number; message: string } | null>(null);

  useEffect(() => {
    if (params.get("signedin")) setNotice("Signed in. Your free render quota is on this account.");
    if (params.get("upgraded")) setNotice("Pro is on. Renders drop the watermark.");
    if (params.get("authError")) setError(params.get("authError") || "");
  }, [params]);

  useEffect(() => {
    if (!jobId) return;
    let stop = false;
    const tick = async () => {
      const res = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      if (!res.ok || stop) return;
      const data = await res.json();
      setProgress(data.progress);
      if (data.status === "done") {
        router.push(`/result/${jobId}`);
        return;
      }
      if (data.status === "error") {
        setError(data.error || data.progress?.message || "Render failed");
        setBusy(false);
        setJobId(null);
        return;
      }
      setTimeout(tick, 1000);
    };
    tick();
    return () => {
      stop = true;
    };
  }, [jobId, router]);

  async function start(kind: "file" | "url" | "sample") {
    setError("");
    setBusy(true);
    try {
      let res: Response;
      if (kind === "url") {
        res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      } else if (kind === "sample") {
        res = await fetch("/api/jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sample: true }),
        });
      } else {
        if (!file) throw new Error("Choose a PDF or PPTX");
        const fd = new FormData();
        fd.set("file", file);
        res = await fetch("/api/jobs", { method: "POST", body: fd });
      }
      const data = await res.json();
      if (res.status === 402 && data.reason === "need_auth") {
        setAuthOpen(true);
        throw new Error(data.error);
      }
      if (!res.ok) throw new Error(data.error || "Could not start");
      setJobId(data.id);
      setProgress({ stage: "queued", percent: 4, message: "Queued" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-500">Studio</p>
      <h1 className="mt-2 font-display text-4xl">Make the clip</h1>
      <p className="mt-3 text-paper-300">Upload a deck or paste a public URL. No timeline — we cut the beats.</p>
      {notice && <p className="mt-4 rounded-2xl border border-mint-500/30 bg-mint-500/10 px-4 py-3 text-sm">{notice}</p>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
        className={`mt-8 rounded-[2rem] border border-dashed px-6 py-12 text-center ${
          drag ? "border-gold-500 bg-gold-500/5" : "border-white/15 bg-ink-800/50"
        }`}
      >
        <p className="font-display text-2xl">Drop PPT, PPTX, or PDF</p>
        <p className="mt-2 text-sm text-paper-500">Up to 28 MB</p>
        <label className="mt-5 inline-block cursor-pointer rounded-full bg-ink-700 px-5 py-2 text-sm">
          Choose file
          <input
            type="file"
            accept=".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        {file && <p className="mt-3 text-sm text-paper-100">{file.name}</p>}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-landing-page.com"
          className="flex-1 rounded-2xl border border-white/10 bg-ink-800 px-4 py-3 outline-none ring-gold-500 focus:ring-2"
        />
        <button
          disabled={busy || !url}
          onClick={() => start("url")}
          className="rounded-2xl border border-white/15 px-5 py-3 text-sm disabled:opacity-50"
        >
          Fetch URL
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          disabled={busy || !file}
          onClick={() => start("file")}
          className="rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-ink-950 disabled:opacity-50"
        >
          Render clip
        </button>
        <button
          disabled={busy}
          onClick={() => start("sample")}
          className="rounded-full border border-white/15 px-6 py-3 text-sm disabled:opacity-50"
        >
          Use sample deck
        </button>
      </div>

      {busy && (
        <div className="mt-10 rounded-3xl border border-white/10 bg-ink-800 p-6">
          <p className="text-xs uppercase tracking-widest text-gold-500">{progress?.stage || "working"}</p>
          <p className="mt-2 font-display text-2xl">{progress?.message || "Starting the pipeline"}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink-700">
            <div
              className="h-full bg-gold-500 transition-all"
              style={{ width: `${Math.min(100, progress?.percent || 6)}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-paper-500">Extract → script → cards → ffmpeg. Usually under a minute.</p>
        </div>
      )}

      {error && <p className="mt-6 text-sm text-red-300">{error}</p>}
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={<div className="px-5 py-16 text-paper-500">Loading studio…</div>}>
      <StudioInner />
    </Suspense>
  );
}
