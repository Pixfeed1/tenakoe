import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";
import ExcelJS from "exceljs";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && !user.voitTousLesDossiers)) return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const [entreprises, contacts, projets, leads] = await Promise.all([
    prisma.entreprise.count({ where: { deletedAt: { equals: null } } }),
    prisma.contact.count(),
    prisma.projet.count({ where: { deletedAt: { equals: null } } }),
    prisma.leadFormulaire.count(),
  ]);
  return NextResponse.json({ entreprises, contacts, projets, leads });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "ADMIN" && !user.voitTousLesDossiers)) return NextResponse.json({ error: "Accès réservé aux administrateurs" }, { status: 403 });

  const body = await request.json();
  const { type, format } = body; // type: "entreprises"|"contacts"|"projets", format: "csv"|"xlsx"

  // Fetch data
  let rows: Record<string, unknown>[] = [];
  let columns: { key: string; header: string; width: number }[] = [];

  if (type === "entreprises") {
    const statutsPrise = await prisma.statutPriseConfig.findMany({ select: { code: true, nom: true } });
    const statutPriseLabels: Record<string, string> = {};
    for (const s of statutsPrise) statutPriseLabels[s.code] = s.nom;

    const data = await prisma.entreprise.findMany({
      include: { contacts: { take: 1 }, projets: { include: { chargee: { select: { prenom: true } }, etapes: { orderBy: { ordre: "asc" } } }, take: 1 } },
      where: { archive: false, deletedAt: { equals: null } },
      orderBy: { nom: "asc" },
    });
    columns = [
      { key: "nom", header: "Entreprise", width: 30 },
      { key: "siret", header: "SIRET", width: 18 },
      { key: "email", header: "Email", width: 30 },
      { key: "telephone", header: "Téléphone", width: 18 },
      { key: "adresse", header: "Adresse", width: 30 },
      { key: "ville", header: "Ville", width: 15 },
      { key: "codePostal", header: "Code postal", width: 10 },
      { key: "prescripteur", header: "Prescripteur", width: 12 },
      { key: "statutLead", header: "Statut du lead", width: 25 },
      { key: "statutPrise", header: "Statut prise", width: 20 },
      { key: "statutFacturation", header: "Statut facturation", width: 20 },
      { key: "etapeEnCours", header: "Étape en cours", width: 30 },
      { key: "contact", header: "Contact principal", width: 25 },
      { key: "chargee", header: "Chargée", width: 15 },
      { key: "estClient", header: "Client", width: 8 },
      { key: "dateTransmission", header: "Date transmission", width: 14 },
      { key: "createdAt", header: "Date création", width: 14 },
    ];
    rows = data.map((e) => {
      const firstProjet = e.projets[0];
      const etapeActive = firstProjet?.etapes?.find((et) => et.active);
      const etapeEnCours = etapeActive ? `${etapeActive.ordre}/${firstProjet.etapes.length} — ${etapeActive.nom}` : "";
      return {
        nom: e.nom, siret: e.siret || "", email: e.email || "", telephone: e.telephone || "",
        adresse: e.adresse || "", ville: e.ville || "", codePostal: e.codePostal || "",
        prescripteur: e.prescripteur || "",
        statutLead: statutPriseLabels[e.statutPrise] || e.statutPrise || "",
        statutPrise: e.statutPrise, statutFacturation: e.statutFacturation || "",
        etapeEnCours,
        contact: e.contacts[0] ? `${e.contacts[0].prenom} ${e.contacts[0].nom}` : "",
        chargee: firstProjet?.chargee?.prenom || "",
        estClient: e.estClient ? "Oui" : "Non",
        dateTransmission: ((e as unknown as { dateTransmission?: Date }).dateTransmission || e.createdAt).toLocaleDateString("fr-FR"),
        createdAt: e.createdAt.toLocaleDateString("fr-FR"),
      };
    });
  } else if (type === "contacts") {
    const data = await prisma.contact.findMany({
      include: { entreprise: { select: { nom: true } } },
      orderBy: { nom: "asc" },
    });
    columns = [
      { key: "nom", header: "Nom", width: 20 },
      { key: "prenom", header: "Prénom", width: 20 },
      { key: "email", header: "Email", width: 30 },
      { key: "telephone", header: "Téléphone", width: 18 },
      { key: "fonction", header: "Fonction", width: 20 },
      { key: "entreprise", header: "Entreprise", width: 30 },
    ];
    rows = data.map((c) => ({
      nom: c.nom, prenom: c.prenom, email: c.email || "", telephone: c.telephone || "",
      fonction: c.fonction || "", entreprise: c.entreprise?.nom || "",
    }));
  } else if (type === "projets") {
    const data = await prisma.projet.findMany({
      include: {
        entreprise: { select: { nom: true } },
        chargee: { select: { prenom: true } },
        qualifications: true,
        etapes: { where: { active: true }, take: 1 },
        _count: { select: { documents: true } },
      },
      where: { archive: false, deletedAt: { equals: null } },
      orderBy: { updatedAt: "desc" },
    });
    columns = [
      { key: "nom", header: "Projet", width: 30 },
      { key: "entreprise", header: "Entreprise", width: 30 },
      { key: "chargee", header: "Chargée", width: 15 },
      { key: "qualification", header: "Qualification", width: 18 },
      { key: "etapeEnCours", header: "Étape en cours", width: 25 },
      { key: "nbDocs", header: "Documents", width: 12 },
      { key: "actif", header: "Actif", width: 8 },
    ];
    rows = data.map((p) => ({
      nom: p.nom, entreprise: p.entreprise.nom, chargee: p.chargee?.prenom || "",
      qualification: p.qualifications[0]?.type || "",
      etapeEnCours: p.etapes[0]?.nom || "—",
      nbDocs: p._count.documents,
      actif: p.actif ? "Oui" : "Non",
    }));
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "Aucune donnée à exporter" }, { status: 400 });
  }

  // Generate XLSX
  if (format === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Kiwi CRM";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(type.charAt(0).toUpperCase() + type.slice(1));

    // Set columns
    sheet.columns = columns.map((c) => ({
      header: c.header,
      key: c.key,
      width: c.width,
    }));

    // Header row: bold + fill
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF16a34a" },
    };
    headerRow.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    headerRow.alignment = { vertical: "middle", horizontal: "left" };
    headerRow.height = 24;

    // Add data rows
    for (const row of rows) {
      sheet.addRow(row);
    }

    // Auto filter
    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: rows.length + 1, column: columns.length },
    };

    // Alternate row colors
    for (let i = 2; i <= rows.length + 1; i++) {
      if (i % 2 === 0) {
        const row = sheet.getRow(i);
        row.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F9FB" },
        };
      }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${type}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  }

  // Default: return JSON (for CSV generation client-side)
  return NextResponse.json(rows);
}
