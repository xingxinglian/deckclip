import { NextResponse } from "next/server";
import path from "path";
import { getActor, quotaFor, consumeRender, touchGuestCookie } from "@/lib/auth";
import { createJob, writeUpload, samplePdf } from "@/lib/jobs";
import { rid } from "@/lib/ids";
import { UPLOADS_DIR, ensureDirs } from "@/lib/paths";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const actor = await getActor();
  await touchGuestCookie(actor.guest.id);
  const quota = quotaFor(actor);
  if (!quota.allowed) {
    return NextResponse.json(
      { error: quota.reason === "need_auth" ? "Sign in to render another clip." : "Upgrade to Pro for more renders.", reason: quota.reason },
      { status: 402 },
    );
  }

  const ct = req.headers.get("content-type") || "";
  let sourceKind: "pdf" | "pptx" | "url" | "sample" = "pdf";
  let sourceLabel = "";
  let inputPath: string | undefined;
  let url: string | undefined;

  if (ct.includes("application/json")) {
    const body = await req.json();
    if (body.sample) {
      sourceKind = "sample";
      sourceLabel = "sample-deck.pdf";
      inputPath = samplePdf();
    } else if (body.url) {
      sourceKind = "url";
      sourceLabel = String(body.url).slice(0, 180);
      url = String(body.url).trim();
      if (!/^https?:\/\//i.test(url)) {
        return NextResponse.json({ error: "URL must start with http(s)://" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Pass a file, url, or sample." }, { status: 400 });
    }
  } else {
    const form = await req.formData();
    const file = form.get("file");
    const sample = form.get("sample");
    const pasted = form.get("url");
    if (sample === "1" || sample === "true") {
      sourceKind = "sample";
      sourceLabel = "sample-deck.pdf";
      inputPath = samplePdf();
    } else if (file instanceof File && file.size > 0) {
      const ext = path.extname(file.name).toLowerCase();
      if (![".pdf", ".pptx", ".ppt"].includes(ext)) {
        return NextResponse.json({ error: "Upload a PDF or PPTX." }, { status: 400 });
      }
      if (ext === ".ppt") {
        return NextResponse.json({ error: "Legacy .ppt is not supported. Export PPTX or PDF." }, { status: 400 });
      }
      if (file.size > 28 * 1024 * 1024) {
        return NextResponse.json({ error: "File is over 28 MB." }, { status: 400 });
      }
      ensureDirs();
      inputPath = path.join(UPLOADS_DIR, `${rid("up")}${ext}`);
      await writeUpload(file, inputPath);
      sourceKind = ext === ".pptx" ? "pptx" : "pdf";
      sourceLabel = file.name;
    } else if (typeof pasted === "string" && pasted.trim()) {
      url = pasted.trim();
      sourceKind = "url";
      sourceLabel = url.slice(0, 180);
      if (!/^https?:\/\//i.test(url)) {
        return NextResponse.json({ error: "URL must start with http(s)://" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Drop a deck or paste a URL." }, { status: 400 });
    }
  }

  consumeRender(actor);
  try {
    const job = createJob({
      actor,
      sourceKind,
      sourceLabel,
      inputPath,
      url,
      watermark: quota.watermark,
    });
    return NextResponse.json({ id: job.id, status: job.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not start job" }, { status: 500 });
  }
}
