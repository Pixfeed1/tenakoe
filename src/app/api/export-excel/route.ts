import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import ExcelJS from "exceljs";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = await request.json();
  const { headers, rows, title } = body as { headers: string[]; rows: string[][]; title?: string };

  if (!headers || !rows) return NextResponse.json({ error: "headers et rows requis" }, { status: 400 });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Kiwi CRM";
  wb.created = new Date();

  const ws = wb.addWorksheet(title || "Export");

  // Header row
  const headerRow = ws.addRow(headers);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF16a34a" } };
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11, name: "Calibri" };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      bottom: { style: "thin", color: { argb: "FF15803d" } },
    };
  });

  // Data rows
  rows.forEach((row, idx) => {
    const r = ws.addRow(row);
    r.height = 22;
    r.eachCell((cell) => {
      cell.font = { size: 10.5, name: "Calibri", color: { argb: "FF374151" } };
      cell.alignment = { vertical: "middle" };
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF8F9FB" } };
      }
      cell.border = {
        bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  // Auto-width columns
  ws.columns.forEach((col) => {
    let maxLen = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value || "").length;
      if (len > maxLen) maxLen = len;
    });
    col.width = Math.min(maxLen + 4, 50);
  });

  // Freeze header
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await wb.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${(title || "export").replace(/[^a-zA-Z0-9-_ àéèêëïôùûç]/g, "")}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}
