"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthModal } from "@/components/AuthModal";

type Job = {
  id: string;
  status: string;
  title?: string;
  caption?: string;
  duration?: number;
  beats?: number;
  watermark?: boolean;
  hasVideo?: boolean;
  error?: string;
  progress?: { stage: string; percent: number; message: string };
};

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let stop = false;
    const tick = async () => {
      const res = await fetch(`/api/jobs/${id}`, { cache: "no-store" });
      if (!res.ok || stop) return;
      const data = await res.json();
      setJob(data);
      if (data.status === "running" || data.status === "queued") setTimeout(tick, 1000);
    };
    tick();
    return () => {
      stop = true;
    };
  }, [id]);

  async function copy() {
    if (!job?.caption) return;
    await navigator.clipboard.writeText(job.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function regen() {
    setError("");
    const res = await fetch(`/api/jobs/${id}/regen`, { method: "POST" });
    const data = await res.json();
    if (res.status === 402 && data.reason === "need_auth") {
      setAuthOpen(true);
      setError(data.error);
      return;
    }
    if (res.status === 402) {
      router.push("/pricing");
      return;
    }
    if (!res.ok) {
      setError(data.error || "Could not regenerate");
      return;
    }
    router.push(`/studio`);
    // jump to new result once created — studio would re-upload; go straight
    router.replace(`/result/${data.id}`);
  }

  if (!job) return <div className="px-5 py-16 text-paper-500">Loading result…</div>;
  if (job.status === "error") {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <h1 className="font-display text-3xl">Render failed</h1>
        <p className="mt-3 text-paper-300">{job.error || job.progress?.message}</p>
        <Link href="/studio" className="mt-6 inline-block text-gold-500">
          Back to Studio
        </Link>
      </div>
    );
  }
  if (job.status !== "done" || !job.hasVideo) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16">
        <p className="text-xs uppercase tracking-widest text-gold-500">{job.progress?.stage || job.status}</p>
        <h1 className="mt-2 font-display text-3xl">{job.progress?.message || "Rendering"}</h1>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink-700">
          <div className="h-full bg-gold-500" style={{ width: `${job.progress?.percent || 10}%` }} />
        </div>
      </div>
    );
  }

  const src = `/api/jobs/${id}/media?file=out.mp4`;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="mx-auto w-full max-w-[360px]">
        <div className="hairline rounded-[2rem] bg-ink-800 p-3">
          <video
            src={src}
            controls
            playsInline
            className="aspect-[9/16] w-full rounded-[1.5rem] bg-black"
          />
        </div>
        <p className="mt-3 text-center text-xs text-paper-500">
          {job.duration ? `${job.duration.toFixed(1)}s` : "clip"} · {job.beats} beats · 1080×1920
          {job.watermark ? " · watermarked" : ""}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold-500">Result</p>
        <h1 className="mt-2 font-display text-4xl">{job.title || "Your clip"}</h1>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`${src}&download=1`}
            className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-950"
          >
            Download MP4
          </a>
          <button onClick={copy} className="rounded-full border border-white/15 px-5 py-2.5 text-sm">
            {copied ? "Copied" : "Copy caption"}
          </button>
          <button onClick={regen} className="rounded-full border border-white/15 px-5 py-2.5 text-sm">
            Regenerate
          </button>
        </div>
        <div className="mt-8 rounded-3xl border border-white/10 bg-ink-800 p-5">
          <p className="text-xs uppercase tracking-widest text-paper-500">Caption for X / LinkedIn</p>
          <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-paper-100">
            {job.caption || "—"}
          </pre>
        </div>
        {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
        <p className="mt-8 text-sm text-paper-500">
          Post as a native video. Cover is the first frame. Free plan keeps the DeckClip mark.
        </p>
        <Link href="/studio" className="mt-4 inline-block text-sm text-gold-500">
          Make another
        </Link>
      </div>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
