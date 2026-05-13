import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const global = await prisma.integration.findFirst({ where: { id: "gmail-oauth" } });
  if (!global?.config) {
    console.log("Aucune intégration Gmail globale à migrer.");
    return;
  }

  const config = JSON.parse(global.config);
  console.log("Intégration globale trouvée pour :", config.email);

  let targetUser = await prisma.user.findFirst({ where: { email: config.email } });
  if (!targetUser) {
    targetUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (!targetUser) {
      console.log("Aucun user trouvé. Migration impossible.");
      return;
    }
    console.log(`Pas de match email, assignation à l'admin : ${targetUser.email}`);
  } else {
    console.log(`Assignation au user : ${targetUser.email}`);
  }

  await prisma.gmailAccount.upsert({
    where: { userId: targetUser.id },
    update: {
      email: config.email,
      accessToken: config.access_token,
      refreshToken: config.refresh_token,
      expiryDate: config.expiry_date ? BigInt(config.expiry_date) : null,
    },
    create: {
      userId: targetUser.id,
      email: config.email,
      accessToken: config.access_token,
      refreshToken: config.refresh_token,
      expiryDate: config.expiry_date ? BigInt(config.expiry_date) : null,
    },
  });

  console.log(`Migré : ${config.email} → ${targetUser.email}`);

  await prisma.integration.update({
    where: { id: global.id },
    data: { actif: false },
  });
  console.log("Ancienne intégration globale désactivée");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
