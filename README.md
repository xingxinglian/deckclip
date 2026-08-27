# DeckClip v1

English-US web app for indie and small-team marketers.
Upload PPT, PPTX, PDF or paste a public landing URL.
Renders a real 15-30s 9:16 H.264 MP4 for X and LinkedIn.
Pages: Landing, Studio, Result, Pricing. No timeline. No i18n.

## Paths

- App root: /workspace/deckclip
- UI and API: src/app
- Pipeline: pipeline/
- Sample PDF: fixtures/sample-deck.pdf
- Sample MP4: fixtures/sample.mp4 (generated)
- Job store: data/
- Env template: .env.example

## Requirements

- Node 20+
- Python 3.10+ and Pillow
- ffmpeg with libx264 (flite TTS optional)
- poppler pdftotext and pdftoppm

## How to run
Copy env.example to env.local. Install Node packages, then start the Next.js dev server on port 3000.

## Sample clip

scripts/generate-sample-pdf.py writes fixtures/sample-deck.pdf.
scripts/generate-sample.py writes fixtures/sample.mp4.
package.json script name: sample.
Expected output: H.264, 1080x1920, 15 to 30 seconds, free-plan watermark.

## Environment

APP_URL — magic links and Stripe redirects. Default http://localhost:3000
RESEND_API_KEY and EMAIL_FROM — send magic-link mail. If unset, the link is printed in the server log and returned by the API (dev-friendly).
STRIPE_SECRET_KEY and optional STRIPE_PRICE_ID — real Checkout for Pro at 29 USD/mo. If unset, Pricing opens /checkout/demo, a working test-mode stub.
Never commit secrets. Use env.example as the template.

## Auth and plans

Magic-link email. One free unauthenticated render, then Studio gates.
Free (signed in): 1 render, watermark.
Pro: unlimited, no watermark.
Guest renders merge into the free quota on sign-in.

## Deploy

Standard Next.js App Router (Vercel-compatible). Set env in the host, never in git.
The render pipeline shells out to ffmpeg, poppler, and Python/Pillow. Default Vercel serverless cannot run that. Use a Node host with those binaries, or keep Vercel for UI only.
data/ is local disk and will not persist on serverless.

## Stack

Next.js 15, TypeScript, Tailwind.
File-based jobs in data/db.json plus data/jobs/<id>.
Python pipeline: poppler / PPTX zip+XML / URL fetch, 5-8 beat script, Pillow cards, ffmpeg Ken Burns plus optional flite TTS, H.264.

## Out of scope

Timeline editor, i18n, extra pages, LLM rewrite, hosted queue.
