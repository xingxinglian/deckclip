import path from "path";
import fs from "fs";

export const ROOT = process.cwd();
export const DATA = path.join(ROOT, "data");
export const DB_PATH = path.join(DATA, "db.json");
export const JOBS_DIR = path.join(DATA, "jobs");
export const UPLOADS_DIR = path.join(DATA, "uploads");

export function ensureDirs() {
  for (const d of [DATA, JOBS_DIR, UPLOADS_DIR]) {
    fs.mkdirSync(d, { recursive: true });
  }
}

export function jobDir(id: string) {
  return path.join(JOBS_DIR, id);
}

export function appUrl() {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}
