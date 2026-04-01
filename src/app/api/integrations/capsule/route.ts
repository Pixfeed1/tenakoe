import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const token = body.token;
  if (!token) return NextResponse.json({ error: "Token API requis" }, { status: 400 });

  const headers = { Authorization: `Bearer ${token}`, Accept: "application/json" };
  const results = { contacts: 0, entreprises: 0, projets: 0, skipped: 0 };

  try {
    // 1. Import organisations
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const res = await fetch(`https://api.capsulecrm.com/api/v2/parties?type=organisation&page=${page}&perPage=100`, { headers });
      if (!res.ok) throw new Error(`Capsule API ${res.status}`);
      const data = await res.json();
      const parties = data.parties || [];

      for (const org of parties) {
        const existing = await prisma.entreprise.findFirst({ where: { sourceId: String(org.id), sourceImport: "CAPSULE" } });
        if (existing) { results.skipped++; continue; }

        await prisma.entreprise.create({
          data: {
            nom: org.name || "Sans nom",
            email: org.emailAddresses?.[0]?.address || null,
            telephone: org.phoneNumbers?.[0]?.number || null,
            adresse: org.addresses?.[0]?.street || null,
            ville: org.addresses?.[0]?.city || null,
            codePostal: org.addresses?.[0]?.zip || null,
            sourceImport: "CAPSULE",
            sourceId: String(org.id),
          },
        });
        results.entreprises++;
      }

      hasMore = parties.length === 100;
      page++;
    }

    // 2. Import contacts (persons)
    page = 1;
    hasMore = true;
    while (hasMore) {
      const res = await fetch(`https://api.capsulecrm.com/api/v2/parties?type=person&page=${page}&perPage=100`, { headers });
      if (!res.ok) break;
      const data = await res.json();
      const parties = data.parties || [];

      for (const person of parties) {
        const existingContact = await prisma.contact.findFirst({
          where: { sourceId: String(person.id), sourceImport: "CAPSULE" },
        });
        if (existingContact) { results.skipped++; continue; }

        let entrepriseId: string | null = null;
        if (person.organisation?.id) {
          const ent = await prisma.entreprise.findFirst({ where: { sourceId: String(person.organisation.id), sourceImport: "CAPSULE" } });
          if (ent) entrepriseId = ent.id;
        }

        await prisma.contact.create({
          data: {
            nom: person.lastName || "?",
            prenom: person.firstName || "?",
            email: person.emailAddresses?.[0]?.address || null,
            telephone: person.phoneNumbers?.[0]?.number || null,
            entrepriseId,
            sourceImport: "CAPSULE",
            sourceId: String(person.id),
          },
        });
        results.contacts++;
      }

      hasMore = parties.length === 100;
      page++;
    }

    // 3. Import opportunities
    page = 1;
    hasMore = true;
    while (hasMore) {
      const res = await fetch(`https://api.capsulecrm.com/api/v2/opportunities?page=${page}&perPage=100`, { headers });
      if (!res.ok) break;
      const data = await res.json();
      const opps = data.opportunities || [];

      for (const opp of opps) {
        if (!opp.party?.id) continue;

        const existingProjet = await prisma.projet.findFirst({
          where: { sourceId: String(opp.id), sourceImport: "CAPSULE" },
        });
        if (existingProjet) { results.skipped++; continue; }

        const ent = await prisma.entreprise.findFirst({ where: { sourceId: String(opp.party.id), sourceImport: "CAPSULE" } });
        if (!ent) continue;

        await prisma.projet.create({
          data: {
            nom: opp.name || "Projet Capsule",
            description: opp.description || null,
            entrepriseId: ent.id,
            sourceImport: "CAPSULE",
            sourceId: String(opp.id),
          },
        });
        results.projets++;
      }

      hasMore = opps.length === 100;
      page++;
    }

    // Log
    await prisma.logActivite.create({
      data: {
        type: "CREATION",
        description: `Import Capsule — ${results.entreprises} entreprises, ${results.contacts} contacts, ${results.projets} projets${results.skipped > 0 ? `, ${results.skipped} doublons ignorés` : ""}`,
        entite: "Import",
        entiteId: "capsule",
      },
    });

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
