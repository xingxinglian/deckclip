import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-10 text-sm text-paper-500">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 sm:flex-row sm:items-center sm:justify-between">
        <p>DeckClip v1 · English (US) · Clips for X and LinkedIn</p>
        <div className="flex gap-4">
          <Link href="/pricing" className="hover:text-paper-100">
            Pricing
          </Link>
          <Link href="/studio" className="hover:text-paper-100">
            Studio
          </Link>
        </div>
      </div>
    </footer>
  );
}
