import Link from "next/link";

const steps = [
  { n: "01", t: "Drop the source", d: "PPT, PPTX, PDF, or a public landing URL. No timeline. No project file." },
  { n: "02", t: "We write the beats", d: "DeckClip pulls the story, cuts 5–8 beats, and lays captions on 9:16 cards." },
  { n: "03", t: "Download the MP4", d: "15–30 seconds, H.264, ready for X and LinkedIn. Caption copied in one tap." },
];

const fits = [
  "Launch week, no motion designer on payroll",
  "A webinar deck that should not die in Drive",
  "A landing page that needs a vertical cut today",
];

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pb-20 pt-16 lg:grid-cols-[1.1fr_0.9fr] lg:pt-24">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold-500">For indie & small-team marketers</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] text-paper-50 sm:text-6xl">
              Your deck.
              <br />
              A 20-second clip.
              <br />
              Posted today.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-paper-300">
              Drop a PPT, PDF, or landing URL. DeckClip extracts the story, writes a short script, and
              renders a real 9:16 MP4 for X and LinkedIn — with a caption you can paste.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/studio"
                className="rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-ink-950 hover:bg-gold-400"
              >
                Open Studio
              </Link>
              <Link
                href="/pricing"
                className="rounded-full border border-white/15 px-6 py-3 text-sm text-paper-100 hover:border-white/30"
              >
                Free vs Pro
              </Link>
            </div>
            <p className="mt-5 text-sm text-paper-500">One free render. Watermarked. No card required.</p>
          </div>
          <div className="relative mx-auto w-full max-w-sm">
            <div className="hairline rounded-[2.2rem] bg-ink-800 p-3 shadow-glow">
              <div className="overflow-hidden rounded-[1.7rem] bg-ink-950">
                <div className="flex items-center justify-between px-4 py-3 text-[11px] uppercase tracking-widest text-gold-500">
                  <span>Hook · 01 / 08</span>
                  <span>9:16</span>
                </div>
                <div className="px-5 pb-8 pt-10">
                  <p className="font-display text-4xl leading-tight">CRM that fits in a Friday</p>
                  <div className="mt-5 h-1 w-16 bg-gold-500" />
                  <p className="mt-5 text-sm text-paper-300">A 20-second cut of the story that matters.</p>
                </div>
                <div className="mx-4 mb-5 rounded-2xl border border-white/10 bg-ink-800 px-4 py-3 text-sm">
                  Save this clip. Ship the launch.
                </div>
                <div className="px-5 pb-5 text-[11px] uppercase tracking-widest text-gold-500/80">DeckClip · Free</div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs text-paper-500">Sample beat from the Harbor fixture deck</p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-ink-800/40">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-10 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n}>
              <p className="text-xs text-gold-500">{s.n}</p>
              <h2 className="mt-1 font-display text-2xl">{s.t}</h2>
              <p className="mt-2 text-sm leading-relaxed text-paper-300">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold-500">Built for the Friday shippers</p>
            <h2 className="mt-3 font-display text-4xl">No editor. No After Effects. No “we’ll cut it next week.”</h2>
            <ul className="mt-6 space-y-3 text-paper-300">
              {fits.map((f) => (
                <li key={f} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-gold-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="hairline rounded-3xl bg-ink-800 p-6">
            <p className="text-sm text-paper-500">What you get</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-paper-500">Format</dt>
                <dd>1080×1920 · H.264 MP4</dd>
              </div>
              <div>
                <dt className="text-paper-500">Length</dt>
                <dd>15–30 seconds</dd>
              </div>
              <div>
                <dt className="text-paper-500">Sources</dt>
                <dd>PDF, PPTX, public URL</dd>
              </div>
              <div>
                <dt className="text-paper-500">Caption</dt>
                <dd>Ready to paste</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="border-t border-white/5 bg-gradient-to-b from-ink-800/30 to-transparent">
        <div className="mx-auto max-w-3xl px-5 py-20 text-center">
          <h2 className="font-display text-4xl">Make the clip before standup.</h2>
          <p className="mt-4 text-paper-300">Studio is one drop zone. The first render is free and watermarked.</p>
          <Link
            href="/studio"
            className="mt-8 inline-flex rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-ink-950 hover:bg-gold-400"
          >
            Start a clip
          </Link>
        </div>
      </section>
    </div>
  );
}
