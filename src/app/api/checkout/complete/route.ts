import { NextResponse } from "next/server";
import { getActor, setPlan } from "@/lib/auth";

export const runtime = "nodejs";

/** Test-mode stub: mark the signed-in user as Pro without Stripe. */
export async function POST() {
  const actor = await getActor();
  if (!actor.user) {
    return NextResponse.json({ error: "Sign in first", reason: "need_auth" }, { status: 401 });
  }
  if (process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Use Stripe Checkout when keys are set." }, { status: 400 });
  }
  setPlan(actor.user.id, "pro");
  return NextResponse.json({ ok: true, plan: "pro" });
}
