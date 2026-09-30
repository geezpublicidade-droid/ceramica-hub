import { createServiceClient } from "@/lib/supabase/server";

export type ProductCategory = "plano" | "publicidade" | "patrocinio" | "pagina_especial" | "servico_adicional";
export type BillingType = "mensal" | "anual" | "unico" | "personalizado";

export const PRODUCT_CATEGORY_LABEL: Record<ProductCategory, string> = {
  plano: "Plano",
  publicidade: "Espaço publicitário",
  patrocinio: "Patrocínio",
  pagina_especial: "Página especial",
  servico_adicional: "Serviço adicional",
};

export const BILLING_TYPE_LABEL: Record<BillingType, string> = {
  mensal: "Mensal",
  anual: "Anual",
  unico: "Pagamento único",
  personalizado: "Personalizado",
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  description: string | null;
  billingType: BillingType;
  monthlyPriceCents: number | null;
  yearlyPriceCents: number | null;
  benefits: string[];
  limits: Record<string, number | boolean>;
  planKey: string | null;
  active: boolean;
  sortOrder: number;
};

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  description: string | null;
  billing_type: BillingType;
  monthly_price_cents: number | null;
  yearly_price_cents: number | null;
  benefits: string[];
  limits: Record<string, number | boolean>;
  plan_key: string | null;
  active: boolean;
  sort_order: number;
};

const PRODUCT_SELECT =
  "id, slug, name, category, description, billing_type, monthly_price_cents, yearly_price_cents, benefits, limits, plan_key, active, sort_order";

function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    description: row.description,
    billingType: row.billing_type,
    monthlyPriceCents: row.monthly_price_cents,
    yearlyPriceCents: row.yearly_price_cents,
    benefits: row.benefits ?? [],
    limits: row.limits ?? {},
    planKey: row.plan_key,
    active: row.active,
    sortOrder: row.sort_order,
  };
}

export async function getAllProducts(options: { onlyActive?: boolean } = {}): Promise<Product[]> {
  const supabase = createServiceClient();
  let query = supabase.from("products").select(PRODUCT_SELECT).order("category").order("sort_order");
  if (options.onlyActive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw error;
  return ((data ?? []) as unknown as ProductRow[]).map(mapProduct);
}

/** Campos editáveis de um produto (tudo exceto id); usado em criar e editar. */
export type ProductInput = Omit<Product, "id">;

function toRow(input: ProductInput) {
  return {
    slug: input.slug,
    name: input.name,
    category: input.category,
    description: input.description,
    billing_type: input.billingType,
    monthly_price_cents: input.monthlyPriceCents,
    yearly_price_cents: input.yearlyPriceCents,
    benefits: input.benefits,
    limits: input.limits,
    plan_key: input.planKey,
    active: input.active,
    sort_order: input.sortOrder,
  };
}

export async function createProduct(input: ProductInput): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("products").insert(toRow(input)).select("id").single();
  if (error || !data) throw error ?? new Error("Falha ao criar produto.");
  return data.id as string;
}

export async function updateProduct(id: string, input: ProductInput): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("products").update(toRow(input)).eq("id", id);
  if (error) throw error;
}

export async function setProductActive(id: string, active: boolean): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase.from("products").update({ active }).eq("id", id);
  if (error) throw error;
}
