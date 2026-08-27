import { NextResponse } from "next/server";
import { getActor, touchGuestCookie } from "@/lib/auth";
import { appUrl } from "@/lib/paths";

export const runtime = "nodejs";

export async function POST() {
  const actor = await getActor();
  await touchGuestCookie(actor.guest.id);
  if (!actor.user) {
    return NextResponse.json({ error: "Sign in first", reason: "need_auth" }, { status: 401 });
  }
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return NextResponse.json({
      url: "/checkout/demo",
      mode: "stub",
      message: "STRIPE_SECRET_KEY is not set. Using the test-mode demo checkout.",
    });
  }
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(key);
  const price = process.env.STRIPE_PRICE_ID;
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: actor.user.email,
    client_reference_id: actor.user.id,
    success_url: `${appUrl()}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl()}/pricing?canceled=1`,
    line_items: price
      ? [{ price, quantity: 1 }]
      : [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: 2900,
              recurring: { interval: "month" },
              product_data: { name: "DeckClip Pro" },
            },
          },
        ],
  });
  return NextResponse.json({ url: session.url, mode: "stripe" });
}
