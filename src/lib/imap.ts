import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

interface ImapConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

interface ImapMessage {
  uid: number;
  messageId: string | null;
  from: string;
  to: string;
  subject: string;
  date: string | null;
  snippet: string;
  hasAttachments: boolean;
  inReplyTo: string | null;
  references: string | null;
}

export async function fetchImapMessages(config: ImapConfig, limit = 10): Promise<ImapMessage[]> {
  const client = new ImapFlow({
    host: config.host,
    port: config.port,
    secure: true,
    auth: { user: config.user, pass: config.pass },
    logger: false,
  });

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      const status = await client.status("INBOX", { messages: true });
      const total = status.messages || 0;
      if (total === 0) return [];

      const startSeq = Math.max(1, total - limit + 1);
      const range = `${startSeq}:*`;

      const messages: ImapMessage[] = [];

      for await (const msg of client.fetch(range, { source: true, uid: true })) {
        try {
          if (!msg.source) continue;
          const parsed = await simpleParser(msg.source as Buffer);
          const textBody = parsed.text || "";
          messages.push({
            uid: msg.uid,
            messageId: parsed.messageId || null,
            from: parsed.from?.text || "",
            to: parsed.to ? (Array.isArray(parsed.to) ? parsed.to.map((t) => t.text).join(", ") : parsed.to.text) : "",
            subject: parsed.subject || "(sans objet)",
            date: parsed.date ? parsed.date.toISOString() : null,
            snippet: textBody.replace(/\s+/g, " ").trim().slice(0, 200),
            hasAttachments: (parsed.attachments?.length || 0) > 0,
            inReplyTo: (parsed.inReplyTo as string) || null,
            references: parsed.references ? (Array.isArray(parsed.references) ? parsed.references.join(" ") : String(parsed.references)) : null,
          });
        } catch {
          // skip unparseable messages
        }
      }

      return messages.reverse();
    } finally {
      lock.release();
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`IMAP: ${message}`);
  } finally {
    try { await client.logout(); } catch { /* already disconnected */ }
  }
}
