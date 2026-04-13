import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: Number(process.env.EMAIL_PORT) || 465,
  secure: Number(process.env.EMAIL_PORT || 465) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendPasswordResetEmail(toEmail: string, resetToken: string) {
  const resetUrl = `${process.env.FRONTEND_URL ?? "http://localhost:5173"}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM || `"StudyFlow" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: "Reset your StudyFlow password",
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f4f5fb; border-radius: 16px;">
        <div style="text-align: center; margin-bottom: 28px;">
          <div style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg,#7b7ec8,#5c6380); padding: 10px 18px; border-radius: 12px;">
            <span style="color:#fff; font-size:18px; font-weight:800; letter-spacing:-0.5px;">✦ StudyFlow</span>
          </div>
        </div>
        <div style="background:#fff; border-radius:16px; padding:32px; box-shadow:0 4px 24px rgba(92,99,128,0.10);">
          <h2 style="margin:0 0 12px; color:#1e2235; font-size:22px; font-weight:800;">Reset your password</h2>
          <p style="color:#9298b0; font-size:14px; line-height:1.7; margin:0 0 24px;">
            We received a request to reset the password for your StudyFlow account. Click the button below to choose a new password. This link expires in <strong>15 minutes</strong>.
          </p>
          <a href="${resetUrl}" style="display:block; text-align:center; background:linear-gradient(135deg,#7b7ec8,#5c6380); color:#fff; text-decoration:none; padding:14px 24px; border-radius:12px; font-weight:700; font-size:15px; letter-spacing:0.01em;">
            → Reset Password
          </a>
          <p style="color:#c8c8d0; font-size:12px; margin:20px 0 0; text-align:center;">
            If you didn't request this, you can safely ignore this email.<br/>Your password will not change.
          </p>
        </div>
        <p style="color:#c8c8d0; font-size:11px; text-align:center; margin-top:18px;">
          © 2025 StudyFlow. All rights reserved.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
}
