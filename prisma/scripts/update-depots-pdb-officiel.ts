import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const depotsPDBOfficiel: Array<{ nom: string; ordre: number }> = [
  { nom: "0001 - NANTERRE", ordre: 1 },
  { nom: "0002 - NICE 1 - L'ARIANE", ordre: 2 },
  { nom: "0003 - LYON 1 - VÉNISSIEUX", ordre: 3 },
  { nom: "0004 - AUBERVILLIERS", ordre: 4 },
  { nom: "0005 - VILLEMOMBLE", ordre: 5 },
  { nom: "0006 - IVRY", ordre: 6 },
  { nom: "0007 - BORDEAUX 1 - MÉRIGNAC", ordre: 7 },
  { nom: "0008 - GRIGNY", ordre: 8 },
  { nom: "0009 - MARSEILLE 1 - LES ARNAVAUX", ordre: 9 },
  { nom: "0010 - TOULON", ordre: 10 },
  { nom: "0011 - TOULOUSE 1 - CHAPÎTRE", ordre: 11 },
  { nom: "0012 - MARSEILLE 2 - AUBAGNE", ordre: 12 },
  { nom: "0013 - COIGNIÈRES", ordre: 13 },
  { nom: "0015 - LA COURNEUVE", ordre: 15 },
  { nom: "0016 - PIERRELAYE", ordre: 16 },
  { nom: "0017 - LYON 2 - VAULX EN VELIN", ordre: 17 },
  { nom: "0018 - CLAMART", ordre: 18 },
  { nom: "0019 - TOULOUSE 2 - GRAMONT", ordre: 19 },
  { nom: "0021 - LILLE 1 - WASQUEHAL", ordre: 21 },
  { nom: "0022 - MONTPELLIER", ordre: 22 },
  { nom: "0023 - BORDEAUX 2 - BÈGLES", ordre: 23 },
  { nom: "0024 - PARIS 19 - STALINGRAD", ordre: 24 },
  { nom: "0025 - MANTES-BUCHELAY", ordre: 25 },
  { nom: "0026 - SAINT-BRICE", ordre: 26 },
  { nom: "0027 - CANNES - LA BOCCA", ordre: 27 },
  { nom: "0028 - CHAMPIGNY-SUR-MARNE", ordre: 28 },
  { nom: "0029 - ALFORTVILLE", ordre: 29 },
  { nom: "0030 - DIJON - MARSANNAY", ordre: 30 },
  { nom: "0031 - VILLENEUVE LA GARENNE", ordre: 31 },
  { nom: "0032 - BONNEUIL", ordre: 32 },
  { nom: "0033 - BOULOGNE", ordre: 33 },
  { nom: "0034 - MARSEILLE 3 - LA CAPELETTE", ordre: 34 },
  { nom: "0035 - ORLÉANS", ordre: 35 },
  { nom: "0036 - PARIS 14 - PLACE ITALIE DENFERT", ordre: 36 },
  { nom: "0037 - ARCUEIL", ordre: 37 },
  { nom: "0038 - TOULOUSE 3 - LES MINIMES", ordre: 38 },
  { nom: "0040 - ROUEN", ordre: 40 },
  { nom: "0041 - ARGENTEUIL", ordre: 41 },
  { nom: "0042 - LILLE 2 - ROUBAIX", ordre: 42 },
  { nom: "0043 - NANTES", ordre: 43 },
  { nom: "0044 - PARIS 15 - GRENELLE", ordre: 44 },
  { nom: "0045 - MONTROUGE", ordre: 45 },
  { nom: "0046 - PARIS 18 - PORTE AUBERVILLIERS", ordre: 46 },
  { nom: "0047 - LIVRY GARGAN", ordre: 47 },
  { nom: "0048 - NEUILLY - LES SABLONS", ordre: 48 },
  { nom: "0049 - PUTEAUX", ordre: 49 },
  { nom: "0050 - PARIS 20 - DAVOUT", ordre: 50 },
  { nom: "0051 - PARIS 20 - CHARONNE", ordre: 51 },
  { nom: "0052 - PARIS 17 - CHAMPERRET", ordre: 52 },
  { nom: "0053 - LYON 3 - VAISE", ordre: 53 },
  { nom: "0054 - PARIS 12 - BIZOT", ordre: 54 },
  { nom: "0055 - SAINT-GERMAIN-EN-LAYE", ordre: 55 },
  { nom: "0056 - NICE 2 - MAGNAN", ordre: 56 },
  { nom: "0057 - NEUILLY 2 - PONT DE NEUILLY", ordre: 57 },
  { nom: "0058 - SAINT DENIS", ordre: 58 },
  { nom: "0059 - VERSAILLES CHANTIERS", ordre: 59 },
  { nom: "0060 - PARIS 03 - TURBIGO", ordre: 60 },
  { nom: "0061 - MARSEILLE 4 - ST CHARLES", ordre: 61 },
  { nom: "0062 - PANTIN - LA HALLE", ordre: 62 },
  { nom: "0063 - PARIS 16 - MAISON DE LA RADIO", ordre: 63 },
  { nom: "0065 - PARIS 12 - BASTILLE", ordre: 65 },
  { nom: "0066 - PARIS 15 - PORTE DE VANVES", ordre: 66 },
  { nom: "0067 - PARIS 12 - GARE DE LYON", ordre: 67 },
  { nom: "0068 - PARIS 11 - JULES FERRY", ordre: 68 },
  { nom: "0069 - MONTROUGE - COMPTOIR", ordre: 69 },
  { nom: "0071 - MAISONS ALFORT - COMPTOIR", ordre: 71 },
  { nom: "0072 - MATÉRIAUTHÈQUE", ordre: 72 },
  { nom: "0073 - BORDEAUX 3 - LAC", ordre: 73 },
  { nom: "0074 - AIX-EN-PROVENCE", ordre: 74 },
];

async function main() {
  console.log(`Début — ${depotsPDBOfficiel.length} dépôts dans la liste officielle`);

  const avant = await prisma.depotConfig.findMany({
    where: { prescripteurType: "PDB" },
    select: { id: true, nom: true, actif: true, _count: { select: { entreprises: true, leads: true } } },
  });
  console.log(`Avant : ${avant.length} dépôts PDB en base, ${avant.filter((d) => d.actif).length} actifs`);

  await prisma.depotConfig.updateMany({ where: { prescripteurType: "PDB" }, data: { actif: false } });

  let crees = 0, reactives = 0;
  for (const d of depotsPDBOfficiel) {
    const existing = await prisma.depotConfig.findUnique({ where: { nom_prescripteurType: { nom: d.nom, prescripteurType: "PDB" } } });
    await prisma.depotConfig.upsert({
      where: { nom_prescripteurType: { nom: d.nom, prescripteurType: "PDB" } },
      update: { ordre: d.ordre, actif: true },
      create: { nom: d.nom, prescripteurType: "PDB", ordre: d.ordre },
    });
    if (existing) reactives++; else crees++;
  }

  const apres = await prisma.depotConfig.count({ where: { prescripteurType: "PDB", actif: true } });
  const desactives = await prisma.depotConfig.findMany({
    where: { prescripteurType: "PDB", actif: false },
    select: { nom: true, _count: { select: { entreprises: true, leads: true } } },
  });

  console.log(`\n✅ ${crees} créés, ${reactives} réactivés, ${apres} actifs au total, ${desactives.length} désactivés`);
  const orphelins = desactives.filter((d) => d._count.entreprises > 0 || d._count.leads > 0);
  if (orphelins.length > 0) {
    console.log(`\n⚠️  Dépôts désactivés avec dossiers rattachés :`);
    orphelins.forEach((d) => console.log(`  ${d.nom} : ${d._count.entreprises} entreprises, ${d._count.leads} leads`));
  }
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
