import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { ROOT, jobDir, ensureDirs, UPLOADS_DIR } from "./paths";
import { updateDb, type JobMeta } from "./store";
import { rid } from "./ids";
import type { Actor } from "./auth";

export function createJob(opts: {
  actor: Actor;
  sourceKind: JobMeta["sourceKind"];
  sourceLabel: string;
  inputPath?: string;
  url?: string;
  watermark: boolean;
}): JobMeta {
  ensureDirs();
  const id = rid("job");
  const dir = jobDir(id);
  fs.mkdirSync(dir, { recursive: true });
  const meta: JobMeta = {
    id,
    status: "queued",
    sourceKind: opts.sourceKind,
    sourceLabel: opts.sourceLabel,
    watermark: opts.watermark,
    userId: opts.actor.user?.id,
    guestId: opts.actor.guest.id,
    inputPath: opts.inputPath,
    url: opts.url,
    createdAt: new Date().toISOString(),
  };
  updateDb((db) => {
    db.jobs[id] = meta;
  });
  fs.writeFileSync(path.join(dir, "job.json"), JSON.stringify(meta, null, 2));
  const out = path.join(dir, "out.mp4");
  const args = [
    path.join(ROOT, "pipeline", "render.py"),
    "--out",
    out,
    "--work",
    dir,
    opts.watermark ? "--watermark" : "--no-watermark",
  ];
  if (opts.url) {
    args.push("--url", opts.url);
  } else if (opts.inputPath) {
    args.push("--input", opts.inputPath);
  } else {
    throw new Error("Missing input");
  }
  const log = fs.openSync(path.join(dir, "pipeline.log"), "a");
  const child = spawn("python3", args, {
    cwd: ROOT,
    detached: true,
    stdio: ["ignore", log, log],
    env: { ...process.env, PYTHONUNBUFFERED: "1" },
  });
  child.unref();
  fs.writeFileSync(path.join(dir, "pid"), String(child.pid || ""));
  updateDb((db) => {
    if (db.jobs[id]) db.jobs[id].status = "running";
  });
  return meta;
}

export function saveUpload(file: File, idHint?: string) {
  ensureDirs();
  const ext = path.extname(file.name || "").toLowerCase() || ".bin";
  const dest = path.join(UPLOADS_DIR, `${idHint || rid("up")}${ext}`);
  return dest;
}

export async function writeUpload(file: File, dest: string) {
  const buf = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

export function readJob(id: string) {
  const dir = jobDir(id);
  const metaPath = path.join(dir, "job.json");
  if (!fs.existsSync(metaPath)) return null;
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8")) as JobMeta;
  const progress = readJson(path.join(dir, "progress.json"));
  const result = readJson(path.join(dir, "result.json"));
  const script = readJson(path.join(dir, "script.json"));
  let status = meta.status;
  if (result?.ok) status = "done";
  else if (result && result.ok === false) status = "error";
  else if (progress?.stage === "error") status = "error";
  else if (progress && progress.stage !== "done") status = "running";
  if (status !== meta.status) {
    meta.status = status;
    if (status === "error") meta.error = result?.error || progress?.message || "Render failed";
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
    updateDb((db) => {
      if (db.jobs[id]) {
        db.jobs[id].status = status;
        if (meta.error) db.jobs[id].error = meta.error;
      }
    });
  }
  const mp4 = path.join(dir, "out.mp4");
  return {
    ...meta,
    progress: progress || { stage: status, percent: status === "queued" ? 2 : 10, message: "Starting" },
    result: result || null,
    caption: result?.caption || script?.caption || readText(path.join(dir, "caption.txt")),
    title: result?.title || script?.title || meta.sourceLabel,
    duration: result?.duration || script?.duration || null,
    beats: script?.beats?.length || result?.beats || 0,
    hasVideo: fs.existsSync(mp4) && fs.statSync(mp4).size > 1000,
  };
}

function readJson(p: string) {
  try {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function readText(p: string) {
  try {
    return fs.existsSync(p) ? fs.readFileSync(p, "utf8") : "";
  } catch {
    return "";
  }
}

export function samplePdf() {
  return path.join(ROOT, "fixtures", "sample-deck.pdf");
}
