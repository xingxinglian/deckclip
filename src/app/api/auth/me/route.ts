import { NextResponse } from "next/server";
import { getActor, quotaFor, touchGuestCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const actor = await getActor();
  await touchGuestCookie(actor.guest.id);
  const quota = quotaFor(actor);
  return NextResponse.json({
    user: actor.user ? { id: actor.user.id, email: actor.user.email, plan: actor.user.plan } : null,
    guestId: actor.guest.id,
    quota,
  });
}
