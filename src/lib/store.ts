import fs from "fs";
import { DB_PATH, ensureDirs } from "./paths";

export type Plan = "free" | "pro";

export type User = {
  id: string;
  email: string;
  plan: Plan;
  renderCount: number;
  createdAt: string;
};

export type Guest = {
  id: string;
  renderCount: number;
  createdAt: string;
};

export type Session = {
  token: string;
  userId: string;
  createdAt: string;
};

export type Magic = {
  token: string;
  email: string;
  createdAt: string;
  expiresAt: string;
};

export type JobMeta = {
  id: string;
  status: "queued" | "running" | "done" | "error";
  sourceKind: "pdf" | "pptx" | "url" | "sample";
  sourceLabel: string;
  watermark: boolean;
  userId?: string;
  guestId?: string;
  inputPath?: string;
  url?: string;
  createdAt: string;
  error?: string;
};

export type DB = {
  users: Record<string, User>;
  guests: Record<string, Guest>;
  sessions: Record<string, Session>;
  magic: Record<string, Magic>;
  jobs: Record<string, JobMeta>;
};

const empty = (): DB => ({
  users: {},
  guests: {},
  sessions: {},
  magic: {},
  jobs: {},
});

export function readDb(): DB {
  ensureDirs();
  if (!fs.existsSync(DB_PATH)) return empty();
  try {
    const raw = JSON.parse(fs.readFileSync(DB_PATH, "utf8"));
    return { ...empty(), ...raw };
  } catch {
    return empty();
  }
}

export function writeDb(db: DB) {
  ensureDirs();
  const tmp = DB_PATH + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

export function updateDb<T>(fn: (db: DB) => T): T {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return result;
}
