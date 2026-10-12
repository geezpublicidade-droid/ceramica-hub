import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { DashboardNav } from "@/components/dashboard/DashboardNav";
import { BackLink } from "@/components/nav/BackLink";
import { MediaLibrary, type MediaItem } from "@/components/dashboard/media/MediaLibrary";

export const metadata = { title: "Biblioteca de mídias — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function MidiasPage() {
  const session = await auth();
  const businessId = session?.user?.businessId;
  if (!businessId) redirect("/login");

  const { data, error } = await createServiceClient()
    .from("business_media")
    .select("id, kind, name, url, width, height")
    .eq("business_id", businessId)
    .order("created_at", { ascending: false });
  if (error) throw error;

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:gap-10">
        <aside className="lg:sticky lg:top-10 lg:w-64 lg:shrink-0">
          <DashboardNav currentPath="/dashboard/midias" />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col gap-6 lg:max-w-3xl">
          <div>
            <BackLink href="/dashboard" />
            <h1 className="mt-4 text-2xl font-semibold text-foreground">Biblioteca de mídias</h1>
            <p className="mt-2 text-[16px] text-muted">Logo, fotos, vídeos, banners, artes de Stories e documentos num lugar só. Avisamos se a imagem tem o tamanho certo para cada uso.</p>
          </div>
          <MediaLibrary items={(data ?? []) as MediaItem[]} />
        </div>
      </div>
    </main>
  );
}
