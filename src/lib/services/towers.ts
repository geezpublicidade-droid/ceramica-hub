import { createServiceClient } from "@/lib/supabase/server";

export type Tower = {
  id: string;
  name: string;
  address: string;
  cep: string;
  slug: string;
};

const COMBINING_MARKS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(COMBINING_MARKS_RE, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type TowerRow = { id: string; name: string; address: string; cep: string };

export async function getActiveTowers(): Promise<Tower[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("towers")
    .select("id, name, address, cep")
    .eq("active", true)
    .order("sort_order");
  if (error) throw error;

  return ((data ?? []) as TowerRow[]).map((row) => ({ ...row, slug: slugify(row.name) }));
}

export async function getTowerBySlug(slug: string): Promise<Tower | null> {
  const towers = await getActiveTowers();
  return towers.find((tower) => tower.slug === slug) ?? null;
}
