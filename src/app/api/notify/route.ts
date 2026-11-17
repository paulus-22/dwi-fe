import { mkdir, readFile, appendFile, rename, rm } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FILE = path.join(process.cwd(), ".data", "notify.csv");
const LOCK = `${FILE}.lock`;

/**
 * The landing page's "notify me" signup. Appends the email to a plain CSV
 * file on the Vercel filesystem (see README for how to read it). This is a
 * deliberately tiny "get contact info before we build the real thing"
 * capture — not a mailing-list system. Best-effort: an error never blocks
 * the visitor; if writing fails we still respond 200 with a friendly
 * message so the form never feels broken.
 */
export async function POST(req: Request) {
  const email = ((await req.json().catch(() => ({ email: "" }))) as { email?: unknown }).email;
  const normalized = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalized || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return NextResponse.json({ ok: false, message: "Email tidak valid." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const row = `${csvEscape(normalized)},${now}\n`;

  try {
    await mkdir(path.dirname(FILE), { recursive: true });
    // A crude single-process lock: the form is low traffic, cold starts are
    // serialized by Vercel, and atomic rename avoids a torn write.
    for (let i = 0; i < 40; i++) {
      try {
        await rename(FILE, LOCK);
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 25));
      }
    }
    let prev = "";
    try {
      prev = await readFile(LOCK, "utf8").catch(() => "");
    } catch {
      /* first write */
    }
    if (!prev.split("\n").some((l) => l.startsWith(`${csvEscape(normalized)},`))) {
      await appendFile(LOCK, row);
    } else {
      // Already signed up — pretend success so we don't nag.
    }
    await rename(LOCK, FILE).catch(async () => {
      // Lock file may not exist if we never acquired it; fall back to append.
      await appendFile(FILE, row);
    });
  } catch (e) {
    console.error("notify write failed:", e);
  } finally {
    await rm(LOCK, { force: true }).catch(() => {});
  }

  return NextResponse.json({ ok: true, message: "Terima kasih! Kami akan memberi kabar." });
}

function csvEscape(v: string) {
  return v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
}
