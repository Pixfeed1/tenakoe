/**
 * Backfill du corps (contenu) des Transmission entrantes (mails reçus) restées
 * vides à cause de l'ancienne extraction naïve (multipart imbriqués / HTML-only).
 *
 * Écriture MINIMALE : met à jour uniquement `contenu`. Aucune création, aucune
 * suppression, aucun autre champ touché. Lecture seule côté Gmail.
 *
 * Lancer depuis la racine du projet : npx tsx prisma/scripts/backfill-transmissions-entrantes-vides.ts
 */
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import { extractMailBody } from "../../src/lib/mail-body";

const prisma = new PrismaClient();

function buildOAuthClient(account: { accessToken: string; refreshToken: string; expiryDate: bigint | null }) {
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/auth/gmail/callback`
  );
  oauth2.setCredentials({
    access_token: account.accessToken,
    refresh_token: account.refreshToken,
    expiry_date: account.expiryDate ? Number(account.expiryDate) : undefined,
  });
  return oauth2;
}

async function main() {
  const gmailAccounts = await prisma.gmailAccount.findMany();
  if (gmailAccounts.length === 0) {
    console.log("Aucun compte Gmail connecté — rien à faire.");
    return;
  }

  // Un client Gmail authentifié par compte connecté.
  const clients = gmailAccounts.map((acc) => ({
    email: acc.email,
    gmail: google.gmail({ version: "v1", auth: buildOAuthClient(acc) }),
  }));

  const cibles = await prisma.transmission.findMany({
    where: {
      direction: "ENTRANT",
      canal: "EMAIL",
      gmailMessageId: { not: null },
      OR: [{ contenu: null }, { contenu: "" }],
    },
    select: { id: true, gmailMessageId: true, expediteurEmail: true, objet: true },
  });

  console.log(`${cibles.length} transmission(s) entrante(s) à corps vide à traiter.\n`);

  let refilled = 0;
  let skipped = 0;
  let unchanged = 0;

  // On tente le compte qui a réussi précédemment en premier (les mails d'une
  // même boîte se suivent souvent), puis les autres.
  let preferredIndex = 0;

  for (const t of cibles) {
    const messageId = t.gmailMessageId!;
    const order = [preferredIndex, ...clients.map((_, i) => i).filter((i) => i !== preferredIndex)];

    let fetched = false;
    for (const idx of order) {
      const { gmail } = clients[idx];
      try {
        const full = await gmail.users.messages.get({ userId: "me", id: messageId, format: "full" });
        fetched = true;
        preferredIndex = idx;

        const body = extractMailBody(full.data.payload || undefined).slice(0, 20000);
        if (body.trim().length > 0) {
          await prisma.transmission.update({ where: { id: t.id }, data: { contenu: body } });
          refilled++;
          console.log(`  ✓ rempli   [${t.expediteurEmail || "?"}] ${t.objet || "(sans objet)"}`);
        } else {
          unchanged++;
          console.log(`  ~ vide     [${t.expediteurEmail || "?"}] ${t.objet || "(sans objet)"} (aucun corps extractible)`);
        }
        break;
      } catch (e) {
        const code = (e as { code?: number }).code;
        // 404 = message pas dans cette boîte → on essaie le compte suivant.
        // Autre erreur (token, réseau) → on essaie aussi les autres comptes.
        if (code !== 404) {
          // On ne log que les erreurs non-404 pour ne pas noyer la sortie.
          // (log léger, on continue quand même sur les autres comptes)
        }
        continue;
      }
    }

    if (!fetched) {
      skipped++;
      console.log(`  ⨯ skip     [${t.expediteurEmail || "?"}] ${t.objet || "(sans objet)"} (message inaccessible)`);
    }
  }

  console.log(`\nRésumé : ${refilled} rempli(s), ${skipped} skippé(s) (inaccessibles), ${unchanged} inchangé(s) (corps vide).`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
