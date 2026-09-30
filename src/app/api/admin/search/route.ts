import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchAdmin } from "@/lib/services/admin-search";

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const term = new URL(request.url).searchParams.get("q") ?? "";
  try {
    const results = await searchAdmin(term, session.user.adminRole ?? "admin");
    return NextResponse.json({ results });
  } catch (error) {
    console.error("[api/admin/search]", error);
    return NextResponse.json({ error: "Falha na busca." }, { status: 500 });
  }
}
