import { NextResponse } from "next/server";
import { verifyMagic } from "@/lib/auth";
import { appUrl } from "@/lib/paths";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") || "";
  try {
    await verifyMagic(token);
    return NextResponse.redirect(appUrl() + "/studio?signedin=1");
  } catch (e) {
    const msg = encodeURIComponent(e instanceof Error ? e.message : "Invalid link");
    return NextResponse.redirect(appUrl() + "/studio?authError=" + msg);
  }
}
