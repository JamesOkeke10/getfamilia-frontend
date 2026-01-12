import { getDb } from "./_lib/db.js";
import { submitSchema } from "./_lib/validate.js";
import { rateLimit } from "./_lib/rateLimit.js";
import { Resend } from "resend";

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

function escapeHtml(str = "") {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const rl = rateLimit({ key: `submit:${ip}`, limit: 6, windowMs: 60_000 });
  if (!rl.ok) return res.status(429).json({ error: "Too many requests. Try again soon." });

  try {
    const parsed = submitSchema.safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ error: "Invalid form data" });

    const ok = await verifyTurnstile(parsed.data.turnstileToken, ip);
    if (!ok) return res.status(400).json({ error: "Spam check failed. Please try again." });

    const doc = {
      name: parsed.data.name.trim(),
      email: parsed.data.email.toLowerCase().trim(),
      inquiryType: parsed.data.inquiryType.trim(),
      links: (parsed.data.links || "").trim(),
      message: parsed.data.message.trim(),
      ip,
      createdAt: new Date(),
    };

    const db = await getDb();
    await db.collection("submissions").insertOne(doc);

    // Email notification (optional but recommended)
    const resendKey = process.env.RESEND_API_KEY;
    const notifyTo = process.env.NOTIFY_TO_EMAIL;   // info@getfamilia.ca
    const fromEmail = process.env.FROM_EMAIL;       // temporary until domain: onboarding@resend.dev

    if (resendKey && notifyTo && fromEmail) {
      const resend = new Resend(resendKey);

      await resend.emails.send({
        from: fromEmail,
        to: notifyTo,
        replyTo: doc.email,
        subject: `New Get Familia Submission: ${doc.inquiryType}`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height:1.6">
            <h2 style="margin:0 0 12px">New Contact / Submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(doc.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(doc.email)}</p>
            <p><strong>Type:</strong> ${escapeHtml(doc.inquiryType)}</p>
            <p><strong>Links:</strong> ${escapeHtml(doc.links || "—")}</p>
            <p><strong>Message:</strong><br/>${escapeHtml(doc.message).replaceAll("\n", "<br/>")}</p>
            <hr/>
            <p style="color:#6b7280;font-size:12px">IP: ${escapeHtml(doc.ip)}</p>
          </div>
        `,
      });
    }

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: "Server error" });
  }
}
