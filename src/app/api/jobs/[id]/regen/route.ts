import { NextResponse } from "next/server";
import { getActor, quotaFor, consumeRender, touchGuestCookie } from "@/lib/auth";
import { readJob, createJob, samplePdf } from "@/lib/jobs";
import fs from "fs";

export const runtime = "nodejs";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  await touchGuestCookie(actor.guest.id);
  const quota = quotaFor(actor);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.reason === "need_auth" ? "Sign in to regenerate." : "Upgrade to Pro to regenerate.", reason: quota.reason },
      { status: 402 },
    );
  }
  const { id } = await ctx.params;
  const prev = readJob(id);
  if (!prev) return NextResponse.json({ error: "Not found" }, { status: 404 });
  consumeRender(actor);
  let inputPath: string | undefined;
  let url: string | undefined;
  if (prev.sourceKind === "url" || prev.url) {
    url = prev.url || prev.sourceLabel;
  } else if (prev.sourceKind === "sample") {
    inputPath = samplePdf();
  } else if (prev.inputPath && fs.existsSync(prev.inputPath)) {
    inputPath = prev.inputPath;
  } else {
    return NextResponse.json({ error: "Original file is gone. Upload again." }, { status: 410 });
  }
  const job = createJob({
    actor,
    sourceKind: prev.sourceKind,
    sourceLabel: prev.sourceLabel,
    inputPath,
    url,
    watermark: quota.watermark,
  });
  return NextResponse.json({ id: job.id, status: job.status });
}
