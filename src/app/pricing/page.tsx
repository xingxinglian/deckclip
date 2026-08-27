export default function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-gold-500">Pricing</p>
      <h1 className="mt-2 font-display text-5xl">One free clip. Then Pro.</h1>
      <p className="mt-4 max-w-xl text-paper-300">USD. Pro checkout comes later.</p>
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
            <li>Priority in the queue</li>
          </ul>
          <button
            disabled
            className="mt-8 rounded-full bg-gold-500/40 px-5 py-2.5 text-sm font-semibold text-ink-950"
          >
            Coming soon
          </button>
        </article>
      </div>
    </div>
  );
}
