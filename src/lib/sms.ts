import twilio from "twilio";

let client: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (client) return client;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error("TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN requis");
  }

  client = twilio(sid, token);
  return client;
}

interface SendSMSOptions {
  to: string;
  body: string;
}

export async function sendSMS({ to, body }: SendSMSOptions) {
  const twilioClient = getClient();
  const from = process.env.TWILIO_PHONE_NUMBER;

  if (!from) {
    throw new Error("TWILIO_PHONE_NUMBER requis");
  }

  // Format numéro FR si nécessaire
  const formattedTo = to.startsWith("+") ? to : `+33${to.replace(/^0/, "").replace(/\s/g, "")}`;

  const message = await twilioClient.messages.create({
    body,
    from,
    to: formattedTo,
  });

  return {
    sid: message.sid,
    status: message.status,
  };
}
