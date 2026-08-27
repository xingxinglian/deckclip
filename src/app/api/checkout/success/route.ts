import { NextResponse } from "next/server";
import { setPlan } from "@/lib/auth";
import { appUrl } from "@/lib/paths";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const sessionId = new URL(req.url).searchParams.get("session_id") || "";
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || !sessionId) {
    return NextResponse.redirect(appUrl() + "/pricing");
  }
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(key);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const userId = session.client_reference_id;
  if (userId && session.payment_status === "paid") {
    setPlan(userId, "pro");
  } else if (userId && session.status === "complete") {
    setPlan(userId, "pro");
  }
  return NextResponse.redirect(appUrl() + "/studio?upgraded=1");
}
