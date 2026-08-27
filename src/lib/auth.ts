import { cookies } from "next/headers";
import { updateDb, readDb, type User, type Guest, type Plan } from "./store";
import { rid, emailOk } from "./ids";
import { appUrl } from "./paths";

const SESSION = "dc_session";
const GUEST = "dc_guest";

export type Actor = {
  user: User | null;
  guest: Guest;
};

export async function getActor(): Promise<Actor> {
  const jar = await cookies();
  const token = jar.get(SESSION)?.value;
  const guestId = jar.get(GUEST)?.value;
  const db = readDb();
  let user: User | null = null;
  if (token && db.sessions[token]) {
    user = db.users[db.sessions[token].userId] || null;
  }
  const guest = ensureGuest(guestId);
  return { user, guest };
}

function ensureGuest(id?: string) {
  return updateDb((db) => {
    if (id && db.guests[id]) return db.guests[id];
    const g: Guest = { id: rid("g"), renderCount: 0, createdAt: new Date().toISOString() };
    db.guests[g.id] = g;
    return g;
  });
}

export type Quota = {
  allowed: boolean;
  remaining: number;
  watermark: boolean;
  reason?: "need_auth" | "need_pro";
  plan: Plan | "guest";
};

export function quotaFor(actor: Actor): Quota {
  if (actor.user?.plan === "pro") {
    return { allowed: true, remaining: 9999, watermark: false, plan: "pro" };
  }
  if (actor.user) {
    const remaining = Math.max(0, 1 - actor.user.renderCount);
    return {
      allowed: remaining > 0,
      remaining,
      watermark: true,
      reason: remaining > 0 ? undefined : "need_pro",
      plan: "free",
    };
  }
  const remaining = Math.max(0, 1 - actor.guest.renderCount);
  return {
    allowed: remaining > 0,
    remaining,
    watermark: true,
    reason: remaining > 0 ? undefined : "need_auth",
    plan: "guest",
  };
}

export function consumeRender(actor: Actor) {
  updateDb((db) => {
    if (actor.user && db.users[actor.user.id]) {
      db.users[actor.user.id].renderCount += 1;
    }
    if (db.guests[actor.guest.id]) {
      db.guests[actor.guest.id].renderCount += 1;
    }
  });
}

export function refundRender(actor: Actor) {
  updateDb((db) => {
    if (actor.user && db.users[actor.user.id]) {
      db.users[actor.user.id].renderCount = Math.max(0, db.users[actor.user.id].renderCount - 1);
    }
    if (db.guests[actor.guest.id]) {
      db.guests[actor.guest.id].renderCount = Math.max(0, db.guests[actor.guest.id].renderCount - 1);
    }
  });
}

export function createMagicLink(email: string) {
  const clean = email.trim().toLowerCase();
  if (!emailOk(clean)) throw new Error("Enter a valid email");
  const token = rid("mag");
  const now = Date.now();
  updateDb((db) => {
    db.magic[token] = {
      token,
      email: clean,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 20 * 60 * 1000).toISOString(),
    };
  });
  const url = `${appUrl()}/api/auth/verify?token=${token}`;
  const canEmail = Boolean(process.env.RESEND_API_KEY);
  console.log("[deckclip] magic link for", clean, url);
  return { token, url, email: clean, emailed: canEmail };
}

export async function sendMagicEmail(email: string, url: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;
  const from = process.env.EMAIL_FROM || "DeckClip <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: "Your DeckClip sign-in link",
      text: `Open this link to sign in (expires in 20 minutes):\n\n${url}\n`,
    }),
  });
  if (!res.ok) {
    console.error("[deckclip] resend failed", await res.text());
    return false;
  }
  return true;
}

export async function verifyMagic(token: string) {
  const jar = await cookies();
  const guestId = jar.get(GUEST)?.value;
  const session = updateDb((db) => {
    const mag = db.magic[token];
    if (!mag) throw new Error("Invalid or used link");
    if (new Date(mag.expiresAt).getTime() < Date.now()) throw new Error("Link expired");
    delete db.magic[token];
    let user = Object.values(db.users).find((u) => u.email === mag.email);
    if (!user) {
      user = {
        id: rid("u"),
        email: mag.email,
        plan: "free",
        renderCount: 0,
        createdAt: new Date().toISOString(),
      };
      db.users[user.id] = user;
    }
    if (guestId && db.guests[guestId]) {
      user.renderCount = Math.max(user.renderCount, db.guests[guestId].renderCount);
    }
    const tok = rid("sess");
    db.sessions[tok] = { token: tok, userId: user.id, createdAt: new Date().toISOString() };
    return tok;
  });
  jar.set(SESSION, session, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION)?.value;
  if (token) {
    updateDb((db) => {
      delete db.sessions[token];
    });
  }
  jar.set(SESSION, "", { path: "/", maxAge: 0 });
}

export function setPlan(userId: string, plan: Plan) {
  updateDb((db) => {
    if (db.users[userId]) db.users[userId].plan = plan;
  });
}

export async function touchGuestCookie(guestId: string) {
  const jar = await cookies();
  jar.set(GUEST, guestId, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
}
