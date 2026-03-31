import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS, // App password for Gmail
    },
  });

  return transporter;
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  cc?: string;
  bcc?: string;
}

export async function sendMail({ to, subject, html, from, cc, bcc }: SendMailOptions) {
  const transport = getTransporter();
  const fromAddress = from || process.env.SMTP_FROM || process.env.SMTP_USER;

  const info = await transport.sendMail({
    from: `"Tenakoe" <${fromAddress}>`,
    to,
    cc: cc || undefined,
    bcc: bcc || undefined,
    subject,
    html,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
  };
}
