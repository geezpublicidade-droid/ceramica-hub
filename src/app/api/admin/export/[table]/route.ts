import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-guards";
import { logAdminAction } from "@/lib/audit-log";
import { EXPORT_ACTION } from "@/lib/services/security-alerts";
import { fetchTableRows, isExportFormat, isExportTable, toCsv } from "@/lib/services/data-export";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Baixa uma tabela em CSV ou JSON. Só administração; cada download fica no histórico de auditoria. */
export async function GET(request: Request, { params }: { params: Promise<{ table: string }> }) {
  let adminId: string;
  try {
    adminId = await requireAdmin(["admin"]);
  } catch {
    return NextResponse.json({ error: "Acesso restrito." }, { status: 403 });
  }

  const { table } = await params;
  const format = new URL(request.url).searchParams.get("format") ?? "csv";
  if (!isExportTable(table) || !isExportFormat(format)) {
    return NextResponse.json({ error: "Tabela ou formato inválido." }, { status: 400 });
  }

  const rows = await fetchTableRows(table);
  await logAdminAction(adminId, EXPORT_ACTION, "export", null, { table, format, rows: rows.length });

  const body = format === "csv" ? toCsv(rows) : JSON.stringify(rows, null, 2);
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(body, {
    headers: {
      "Content-Type": format === "csv" ? "text/csv; charset=utf-8" : "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="ceramica-hub-${table}-${stamp}.${format}"`,
      "Cache-Control": "no-store",
    },
  });
}
