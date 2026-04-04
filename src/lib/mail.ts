import nodemailer from "nodemailer";

// Global transporter (fallback)
let globalTransporter: nodemailer.Transporter | null = null;

function getGlobalTransporter() {
  if (globalTransporter) return globalTransporter;
  globalTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return globalTransporter;
}

// Per-user transporter cache (keyed by smtpUser)
const userTransporters = new Map<string, nodemailer.Transporter>();

function getUserTransporter(smtp: { host: string; port: number; user: string; pass: string }) {
  const key = smtp.user;
  if (userTransporters.has(key)) return userTransporters.get(key)!;
  const t = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  userTransporters.set(key, t);
  return t;
}

export interface SmtpConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
  cc?: string;
  bcc?: string;
  smtp?: SmtpConfig | null;
}

export async function sendMail({ to, subject, html, from, cc, bcc, smtp }: SendMailOptions) {
  // Use per-user SMTP if provided, otherwise global
  const transport = smtp ? getUserTransporter(smtp) : getGlobalTransporter();
  const fromAddress = from || (smtp ? smtp.user : null) || process.env.SMTP_FROM || process.env.SMTP_USER;
  const fromHeader = fromAddress && fromAddress.includes("<") ? fromAddress : `"Tenakoe" <${fromAddress}>`;

  const info = await transport.sendMail({
    from: fromHeader,
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
