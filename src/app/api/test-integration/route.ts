import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") {
    return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });
  }

  const body = await request.json();
  const { key, config } = body;

  try {
    switch (key) {
      case "gmail": {
        if (!config.smtp_user || !config.smtp_pass) {
          return NextResponse.json({ ok: false, msg: "Email et App Password requis" });
        }
        const transporter = nodemailer.createTransport({
          host: config.smtp_host || "smtp.gmail.com",
          port: Number(config.smtp_port) || 587,
          secure: false,
          auth: { user: config.smtp_user, pass: config.smtp_pass },
          connectionTimeout: 10000,
        });
        await transporter.verify();
        return NextResponse.json({ ok: true, msg: "Connexion SMTP réussie" });
      }

      case "twilio": {
        if (!config.account_sid || !config.auth_token) {
          return NextResponse.json({ ok: false, msg: "Account SID et Auth Token requis" });
        }
        const twilio = (await import("twilio")).default;
        const client = twilio(config.account_sid, config.auth_token);
        const account = await client.api.accounts(config.account_sid).fetch();
        return NextResponse.json({ ok: true, msg: `Connexion Twilio réussie — Compte: ${account.friendlyName}` });
      }

      case "smspartner": {
        if (!config.api_key) {
          return NextResponse.json({ ok: false, msg: "Clé API requise" });
        }
        const res = await fetch(`https://api.smspartner.fr/v1/me?apiKey=${config.api_key}`);
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({ ok: true, msg: `Connexion réussie — Crédit: ${data.credits || "?"}` });
        }
        return NextResponse.json({ ok: false, msg: "Clé API invalide" });
      }

      case "brevo": {
        if (!config.api_key) {
          return NextResponse.json({ ok: false, msg: "Clé API requise" });
        }
        const res = await fetch("https://api.brevo.com/v3/account", {
          headers: { "api-key": config.api_key },
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({ ok: true, msg: `Connexion réussie — ${data.email || "OK"}` });
        }
        return NextResponse.json({ ok: false, msg: "Clé API invalide" });
      }

      case "make": {
        if (!config.webhook_url) {
          return NextResponse.json({ ok: false, msg: "URL Webhook requise" });
        }
        const res = await fetch(config.webhook_url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ test: true, source: "tenakoe" }),
        });
        if (res.ok || res.status === 200) {
          return NextResponse.json({ ok: true, msg: "Webhook accessible" });
        }
        return NextResponse.json({ ok: false, msg: `Webhook a répondu ${res.status}` });
      }

      case "notion": {
        if (!config.api_key) {
          return NextResponse.json({ ok: false, msg: "Clé API requise" });
        }
        const res = await fetch("https://api.notion.com/v1/users/me", {
          headers: { "Authorization": `Bearer ${config.api_key}`, "Notion-Version": "2022-06-28" },
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({ ok: true, msg: `Connexion réussie — ${data.name || "OK"}` });
        }
        return NextResponse.json({ ok: false, msg: "Clé API invalide" });
      }

      case "capsule": {
        if (!config.api_token) {
          return NextResponse.json({ ok: false, msg: "Token API requis" });
        }
        const subdomain = config.subdomain || "app";
        const res = await fetch(`https://${subdomain}.capsulecrm.com/api/v2/users`, {
          headers: { "Authorization": `Bearer ${config.api_token}` },
        });
        if (res.ok) {
          return NextResponse.json({ ok: true, msg: "Connexion Capsule réussie" });
        }
        return NextResponse.json({ ok: false, msg: "Token API invalide ou sous-domaine incorrect" });
      }

      case "abby": {
        if (!config.api_key) {
          return NextResponse.json({ ok: false, msg: "Clé API Abby requise" });
        }
        const apiUrl = config.api_url || process.env.ABBY_API_URL || "";
        if (!apiUrl) return NextResponse.json({ ok: false, msg: "URL API requise" });
        const res = await fetch(`${apiUrl}/customers`, {
          headers: { Authorization: `Bearer ${config.api_key}`, "Content-Type": "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({ ok: true, msg: `Connexion Abby réussie — ${data.total || 0} clients` });
        }
        return NextResponse.json({ ok: false, msg: "Clé API Abby invalide" });
      }

      case "google_sheets": {
        if (!config.spreadsheet_id) {
          return NextResponse.json({ ok: false, msg: "ID de la feuille requis" });
        }
        return NextResponse.json({ ok: false, msg: "Test Google Sheets nécessite OAuth2 — configurez via Intégrations Google" });
      }

      default:
        return NextResponse.json({ ok: false, msg: "Intégration inconnue" });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ ok: false, msg: message });
  }
}
