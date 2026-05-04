import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

const ETAPES_RGE = [
  { nom: "Transmission par prescripteurs", ordre: 1, delaiJours: 0 },
  { nom: "Prise en charge", ordre: 2, delaiJours: 2 },
  { nom: "Première prise de contact — Explication méthode de travail", ordre: 3, delaiJours: 1 },
  { nom: "Envoi devis", ordre: 4, delaiJours: 15 },
  { nom: "Envoi facture (caution ou fonds propre), CGV", ordre: 5, delaiJours: 15 },
  { nom: "Vérif paiement = GO", ordre: 6, delaiJours: 2 },
  { nom: "Envoi liste documents à fournir + Mandat + doc se préparer", ordre: 7, delaiJours: 5 },
  { nom: "Mail automatique rappel du RDV J-4", ordre: 8, delaiJours: 5 },
  { nom: "Mail automatique rappel du RDV J-1", ordre: 9, delaiJours: 5 },
  { nom: "RDV RECUEIL EN DIRECT DES DOCS", ordre: 10, delaiJours: 15 },
  { nom: "Demande de bon de commande", ordre: 11, delaiJours: 7 },
  { nom: "Ouverture du compte QUALIBAT + Paiement QUALIBAT", ordre: 12, delaiJours: 0 },
  { nom: "Début échanges avec instructeur", ordre: 13, delaiJours: 0 },
  { nom: "FINALISATION DE LA COLLECTE", ordre: 14, delaiJours: 0 },
  { nom: "Bilan docs EL + chargée de projet avant dépôt", ordre: 15, delaiJours: 0 },
  { nom: "État du dossier — feu vert client dépôt ?", ordre: 16, delaiJours: 0 },
  { nom: "Dépôt du dossier + compléments éventuels", ordre: 17, delaiJours: 0 },
  { nom: "Info au client sur modalités réponse par commission", ordre: 18, delaiJours: 0 },
  { nom: "Obtention QUALIF : info au client (n° qualifié et usage marque Qualibat-RGE)", ordre: 19, delaiJours: 0 },
  { nom: "Téléchargement certificat Qualif dans dossier client (France Rénov)", ordre: 20, delaiJours: 0 },
  { nom: "Remplir les dates échéances dans dossier client", ordre: 21, delaiJours: 0 },
  { nom: "Envoi questionnaire satisfaction", ordre: 22, delaiJours: 0 },
];

export async function POST() {
  const user = await getCurrentUser();
  if (!user || user.role === "PRESCRIPTEUR") {
    return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });
  }

  // Ensure TrackTemplate exists
  let trackTemplate = await prisma.trackTemplate.findFirst({
    where: { nom: { contains: "Qualibat RGE", mode: "insensitive" } },
    include: { etapes: { orderBy: { ordre: "asc" } } },
  });

  if (!trackTemplate) {
    trackTemplate = await prisma.trackTemplate.create({
      data: {
        id: "track-qualibat-rge",
        nom: "Feuille de route Qualibat RGE",
        description: "Parcours complet qualification RGE — 22 etapes",
        etapes: { createMany: { data: ETAPES_RGE } },
      },
      include: { etapes: { orderBy: { ordre: "asc" } } },
    });
  }

  if (trackTemplate.etapes.length === 0) {
    for (const e of ETAPES_RGE) {
      await prisma.trackTemplateEtape.create({
        data: { ...e, trackTemplateId: trackTemplate.id },
      });
    }
    trackTemplate = await prisma.trackTemplate.findUnique({
      where: { id: trackTemplate.id },
      include: { etapes: { orderBy: { ordre: "asc" } } },
    }) as typeof trackTemplate;
  }

  // Find projets with qualifications but no etapes
  const projets = await prisma.projet.findMany({
    where: {
      etapes: { none: {} },
      qualifications: { some: {} },
    },
    select: { id: true, nom: true, entreprise: { select: { nom: true } } },
  });

  const now = new Date();
  let total = 0;

  for (const projet of projets) {
    for (let i = 0; i < trackTemplate.etapes.length; i++) {
      const tpl = trackTemplate.etapes[i];
      const isFirst = i === 0;
      await prisma.etape.create({
        data: {
          nom: tpl.nom,
          description: tpl.description,
          ordre: tpl.ordre,
          delaiJours: tpl.delaiJours,
          projetId: projet.id,
          active: isFirst,
          dateObjectif: isFirst && tpl.delaiJours
            ? new Date(now.getTime() + tpl.delaiJours * 86400000)
            : null,
        },
      });
    }
    total++;
  }

  return NextResponse.json({
    message: `${total} projet(s) mis à jour avec ${trackTemplate.etapes.length} étapes chacun`,
    templateCreated: !trackTemplate,
    projets: projets.map((p) => `${p.entreprise.nom} — ${p.nom}`),
  });
}
