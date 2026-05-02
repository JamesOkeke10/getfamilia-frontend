const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendSubmissionEmail({ name, email, inquiryType, links, message }) {
  // 1️⃣ ADMIN NOTIFICATION (THIS IS WHAT YOU'RE MISSING)
  await resend.emails.send({
    from: process.env.FROM_EMAIL, // Get Familia <no-reply@getfamilia.ca>
    to: [process.env.NOTIFY_EMAIL], // info@getfamilia.ca
    subject: `New Contact Submission – ${inquiryType}`,
    replyTo: email, // so you can reply directly to the sender
    html: `
      <h2>New Contact Form Submission</h2>

      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Inquiry Type:</strong> ${inquiryType}</p>

      ${links ? `<p><strong>Links:</strong><br>${links}</p>` : ""}

      <p><strong>Message:</strong></p>
      <p>${message.replace(/\n/g, "<br />")}</p>
    `,
  });

    // 2️⃣ AUTO-REPLY TO USER (Better template)
  await resend.emails.send({
    from: process.env.FROM_EMAIL, // Get Familia <no-reply@getfamilia.ca>
    to: [email],
    replyTo: process.env.NOTIFY_EMAIL, // <-- IMPORTANT: replies go to info@getfamilia.ca
    subject: "We got your message — Get Familia",
    html: `
      <div style="background:#0b1220;padding:32px 12px;font-family:Inter,Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,.08);border-radius:16px;overflow:hidden;">
          
          <!-- Header -->
          <div style="padding:20px 22px;background:linear-gradient(135deg,#0f172a,#0b1220);border-bottom:1px solid rgba(255,255,255,.08);">
            <div style="display:flex;align-items:center;gap:12px;">
              <img src="https://getfamilia.ca/assets/logo/logo-getfamilia-main.png" alt="Get Familia" style="height:34px;width:auto;display:block;" />
              <div>
                <div style="color:#f8fafc;font-weight:800;font-size:16px;letter-spacing:.2px;">Get Familia</div>
                <div style="color:#cbd5e1;font-size:13px;">Contact confirmation</div>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div style="padding:22px;">
            <h2 style="margin:0 0 10px;color:#f8fafc;font-size:20px;">Thanks for reaching out, ${name}.</h2>
            <p style="margin:0 0 14px;color:#cbd5e1;line-height:1.6;">
              We’ve received your message and our team will review it. If it’s a strong fit, we’ll reply with next steps.
            </p>

            <div style="margin:18px 0;padding:14px 14px;border-radius:12px;background:#0b1220;border:1px solid rgba(255,255,255,.08);">
              <div style="color:#94a3b8;font-size:12px;margin-bottom:6px;">Submission summary</div>
              <div style="color:#e2e8f0;font-size:14px;line-height:1.6;">
                <strong style="color:#f8fafc;">Inquiry:</strong> ${inquiryType}<br/>
                <strong style="color:#f8fafc;">Email:</strong> ${email}<br/>
                ${links ? `<strong style="color:#f8fafc;">Links:</strong> ${links}<br/>` : ""}
                <strong style="color:#f8fafc;">Message:</strong><br/>
                <span style="color:#cbd5e1;">${message.replace(/\n/g, "<br/>")}</span>
              </div>
            </div>

            <div style="margin-top:16px;padding:14px 14px;border-radius:12px;background:rgba(249,115,22,.08);border:1px solid rgba(249,115,22,.25);">
              <div style="color:#fb923c;font-weight:700;margin-bottom:6px;">Need to add more info?</div>
              <div style="color:#cbd5e1;line-height:1.6;font-size:14px;">
                Just reply to this email and it will go directly to <strong style="color:#f8fafc;">${process.env.NOTIFY_EMAIL}</strong>.
              </div>
            </div>

            <p style="margin:18px 0 0;color:#94a3b8;font-size:13px;line-height:1.6;">
              — Get Familia Team<br/>
              Toronto, Canada
            </p>
          </div>

          <!-- Footer -->
          <div style="padding:16px 22px;border-top:1px solid rgba(255,255,255,.08);background:#0b1220;">
            <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;">
              <div style="color:#94a3b8;font-size:12px;">
                © ${new Date().getFullYear()} Get Familia
              </div>
              <div style="font-size:12px;">
                <a href="https://getfamilia.ca" style="color:#fb923c;text-decoration:none;margin-right:10px;">Website</a>
                <a href="https://www.instagram.com/getfamilia_tv" style="color:#fb923c;text-decoration:none;margin-right:10px;">Instagram</a>
                <a href="https://www.youtube.com/@GetFamilia-Tv" style="color:#fb923c;text-decoration:none;">YouTube</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    `,
  });

}

module.exports = { sendSubmissionEmail };
