import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, getEntrepriseFilter, getProjetFilter } from "@/lib/rbac";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ entreprises: [], contacts: [], projets: [] });
  }

  const entFilter = getEntrepriseFilter(user);
  const projFilter = getProjetFilter(user);

  const [entreprises, contacts, projets, leads, transmissions] = await Promise.all([
    prisma.entreprise.findMany({
      where: {
        ...entFilter,
        OR: [
          { nom: { contains: q, mode: "insensitive" } },
          { siret: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
          { telephone: { contains: q } },
        ],
      },
      select: {
        id: true, nom: true, siret: true, statutPrise: true, prescripteur: true,
      },
      take: 8,
    }),
    prisma.contact.findMany({
      where: {
        OR: [
          { nom: { contains: q, mode: "insensitive" } },
          { prenom: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
        ...(user.role === "PRESCRIPTEUR" ? { entreprise: entFilter } : {}),
      },
      select: {
        id: true, nom: true, prenom: true, email: true,
        entreprise: { select: { id: true, nom: true } },
      },
      take: 5,
    }),
    prisma.projet.findMany({
      where: {
        ...projFilter,
        OR: [
          { nom: { contains: q, mode: "insensitive" } },
          { entreprise: { nom: { contains: q, mode: "insensitive" } } },
        ],
      },
      select: {
        id: true, nom: true,
        entreprise: { select: { id: true, nom: true } },
        chargee: { select: { prenom: true } },
      },
      take: 5,
    }),
    prisma.leadFormulaire.findMany({
      where: {
        converti: false,
        OR: [
          { nomArtisan: { contains: q, mode: "insensitive" } },
          { prenomArtisan: { contains: q, mode: "insensitive" } },
          { nomEntreprise: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, nomArtisan: true, prenomArtisan: true, nomEntreprise: true, prescripteur: true },
      take: 5,
    }),
    prisma.transmission.findMany({
      where: {
        OR: [
          { objet: { contains: q, mode: "insensitive" } },
          { destinataire: { contains: q, mode: "insensitive" } },
          { contenu: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true, canal: true, objet: true, destinataire: true, dateEnvoi: true,
        entreprise: { select: { id: true, nom: true } },
      },
      take: 5,
    }),
  ]);

  return NextResponse.json({ entreprises, contacts, projets, leads, transmissions });
}
