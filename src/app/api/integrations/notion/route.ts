import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") return NextResponse.json({ error: "Admin uniquement" }, { status: 403 });

  const body = await request.json();
  const { token, databaseId } = body;
  if (!token || !databaseId) return NextResponse.json({ error: "Clé API et ID base requis" }, { status: 400 });

  const headers = {
    Authorization: `Bearer ${token}`,
    "Notion-Version": "2022-06-28",
    "Content-Type": "application/json",
  };
  const results = { leads: 0, clients: 0 };

  try {
    let hasMore = true;
    let startCursor: string | undefined;

    while (hasMore) {
      const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: "POST",
        headers,
        body: JSON.stringify(startCursor ? { start_cursor: startCursor } : {}),
      });
      if (!res.ok) throw new Error(`Notion API ${res.status}`);
      const data = await res.json();

      for (const page of data.results || []) {
        const props = page.properties || {};
        const sourceId = page.id;

        // Check for duplicate
        const existing = await prisma.entreprise.findFirst({
          where: { sourceId, sourceImport: "NOTION" },
        });
        if (existing) continue;

        // Extract properties
        const getName = (p: Record<string, unknown>): string => {
          if (!p) return "";
          const type = p.type as string;
          if (type === "title") return ((p.title as Array<{ plain_text: string }>)?.[0]?.plain_text) || "";
          if (type === "rich_text") return ((p.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text) || "";
          return "";
        };

        const getVal = (p: Record<string, unknown>): string => {
          if (!p) return "";
          const type = p.type as string;
          if (type === "email") return (p.email as string) || "";
          if (type === "phone_number") return (p.phone_number as string) || "";
          if (type === "number") return String(p.number || "");
          if (type === "select") return ((p.select as { name: string })?.name) || "";
          if (type === "rich_text") return ((p.rich_text as Array<{ plain_text: string }>)?.[0]?.plain_text) || "";
          if (type === "title") return ((p.title as Array<{ plain_text: string }>)?.[0]?.plain_text) || "";
          return "";
        };

        // Find key properties by common names
        const allKeys = Object.keys(props);
        const nomKey = allKeys.find((k) => /nom|name|entreprise/i.test(k)) || allKeys[0];
        const emailKey = allKeys.find((k) => /email|mail/i.test(k));
        const telKey = allKeys.find((k) => /tel|phone|t[ée]l/i.test(k));
        const siretKey = allKeys.find((k) => /siret/i.test(k));

        const nom = getName(props[nomKey]) || getVal(props[nomKey]) || "Import Notion";
        const email = emailKey ? getVal(props[emailKey]) : null;
        const telephone = telKey ? getVal(props[telKey]) : null;
        const siret = siretKey ? getVal(props[siretKey]) : null;

        await prisma.entreprise.create({
          data: {
            nom,
            email: email || null,
            telephone: telephone || null,
            siret: siret || null,
            sourceImport: "NOTION",
            sourceId,
          },
        });
        results.leads++;
      }

      hasMore = data.has_more;
      startCursor = data.next_cursor;
    }

    await prisma.logActivite.create({
      data: {
        type: "CREATION",
        description: `Import Notion — ${results.leads} entrées importées`,
        entite: "Import",
        entiteId: "notion",
      },
    });

    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Erreur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
