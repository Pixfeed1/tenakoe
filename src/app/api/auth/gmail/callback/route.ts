import { NextRequest } from "next/server";
import { handleGmailCallback } from "@/lib/gmail";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return new Response(`<html><body><script>
      window.opener?.postMessage({ type: "gmail-oauth-error", msg: "Code ou state manquant" }, "*");
      window.close();
    </script><p>Erreur: paramètres manquants. Vous pouvez fermer cette fenêtre.</p></body></html>`, {
      headers: { "Content-Type": "text/html" },
    });
  }

  try {
    await handleGmailCallback(code, state);
    return new Response(`<html><body><script>
      window.opener?.postMessage({ type: "gmail-oauth-success" }, "*");
      window.close();
    </script><p>Connexion réussie! Vous pouvez fermer cette fenêtre.</p></body></html>`, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur inconnue";
    return new Response(`<html><body><script>
      window.opener?.postMessage({ type: "gmail-oauth-error", msg: ${JSON.stringify(msg)} }, "*");
      window.close();
    </script><p>Erreur: ${msg}. Vous pouvez fermer cette fenêtre.</p></body></html>`, {
      headers: { "Content-Type": "text/html" },
    });
  }
}
