import { createServiceClient } from "@/lib/supabase/server";
import { RegisterWizard } from "@/components/register/RegisterWizard";

export const metadata = {
  title: "Cadastrar empresa gratuitamente — Cerâmica Hub",
  description: "Crie sua página comercial gratuita e comece a ser encontrado no Espaço Cerâmica.",
};

export type TowerOption = { id: string; name: string; address: string };

async function getTowers(): Promise<TowerOption[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("towers")
    .select("id, name, address")
    .eq("active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export default async function CadastroPage() {
  const towers = await getTowers();

  return (
    <main className="min-h-screen bg-background px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-primary">
          Cadastro gratuito
        </p>
        <h1 className="mt-3 text-[clamp(1.8rem,4vw,2.5rem)] font-semibold tracking-tight text-foreground">
          Crie sua página comercial e comece a ser encontrado no Cerâmica.
        </h1>
        <p className="mt-4 text-[15px] leading-relaxed text-muted">
          Leva menos de 5 minutos. Nossa equipe verificará os dados antes de publicar sua página.
        </p>

        <div className="mt-10">
          <RegisterWizard towers={towers} />
        </div>
      </div>
    </main>
  );
}
