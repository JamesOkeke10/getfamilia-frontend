import { getDb } from "./_lib/db.js";
import { newsletterSchema } from "./_lib/validate.js";
import { rateLimit } from "./_lib/rateLimit.js";

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) throw new Error("Missing TURNSTILE_SECRET_KEY");

  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  if (ip) formData.append("remoteip", ip);

  const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: formData,
  });

  const data = await resp.json();
  return data.success === true;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const rl = rateLimit({ key: `newsletter:${ip}`, limit: 8, windowMs: 60_000 });
  if (!rl.ok) return res.status(429).json({ error: "Too many requests. Try again soon." });

  try {
    const parsed = newsletterSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: "Invalid email" });

    const ok = await verifyTurnstile(parsed.data.turnstileToken, ip);
    if (!ok) return res.status(400).json({ error: "Spam check failed." });

    const db = await getDb();
    const email = parsed.data.email.toLowerCase().trim();

    await db.collection("newsletter").updateOne(
      { email },
      { $setOnInsert: { email, createdAt: new Date() } },
      { upsert: true }
    );

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
}
