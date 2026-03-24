import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendVerificationEmail(
  email: string,
  token: string,
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${appUrl}/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: email,
    subject: "[Tipping] 이메일 인증을 완료해주세요",
    html: `
      <div style="max-width: 480px; margin: 0 auto; font-family: sans-serif;">
        <h2>Tipping 이메일 인증</h2>
        <p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요.</p>
        <a href="${verifyUrl}"
           style="display: inline-block; padding: 12px 24px; background: #f59e0b; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold;">
          이메일 인증하기
        </a>
        <p style="margin-top: 16px; color: #666; font-size: 14px;">
          이 링크는 24시간 동안 유효합니다.<br/>
          본인이 요청하지 않았다면 이 메일을 무시해주세요.
        </p>
      </div>
    `,
  });
}
