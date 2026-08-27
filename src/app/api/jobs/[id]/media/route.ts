import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { jobDir } from "@/lib/paths";

export const runtime = "nodejs";

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const name = url.searchParams.get("file") || "out.mp4";
  if (name.includes("..") || name.includes("/") || name.includes("\\")) {
    return NextResponse.json({ error: "Bad file" }, { status: 400 });
  }
  const filePath = path.join(jobDir(id), name);
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: "Missing" }, { status: 404 });
  const buf = fs.readFileSync(filePath);
  const type = name.endsWith(".mp4") ? "video/mp4" : name.endsWith(".txt") ? "text/plain" : "application/octet-stream";
  return new NextResponse(buf, {
    headers: {
      "Content-Type": type,
      "Content-Length": String(buf.length),
      "Content-Disposition": url.searchParams.get("download") === "1"
        ? `attachment; filename="deckclip-${id}.mp4"`
        : "inline",
      "Cache-Control": "private, max-age=60",
    },
  });
}
