import { NextResponse } from "next/server";
import { createMagicLink, sendMagicEmail, getActor, touchGuestCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const actor = await getActor();
  await touchGuestCookie(actor.guest.id);
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "");
  try {
    const magic = createMagicLink(email);
    let emailed = false;
    if (process.env.RESEND_API_KEY) {
      emailed = await sendMagicEmail(magic.email, magic.url);
    }
    const showLink = !emailed || process.env.NODE_ENV !== "production";
    return NextResponse.json({
      ok: true,
      emailed,
      // Dev / no-provider: show the link so you can sign in without SMTP.
      magicUrl: showLink ? magic.url : undefined,
      message: emailed
        ? "Check your email for a sign-in link."
        : "Email is not configured. Use the magic link below (also printed in the server log).",
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not start sign-in" }, { status: 400 });
  }
}
