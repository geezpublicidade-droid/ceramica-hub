import { notFound } from "next/navigation";
import { findCategoryByPath, getCategoryTree } from "@/lib/services/categories";

type LayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string; path: string[] }>;
};

/**
 * Valida o slug antes do `loading.tsx` começar a transmitir a página: com streaming o status HTTP
 * já sai como 200, então um `notFound()` dentro da page virava soft 404. Aqui o 404 é real.
 */
export default async function CategoryLayout({ children, params }: LayoutProps) {
  const { locale, path } = await params;
  if (!findCategoryByPath(await getCategoryTree(locale), path)) notFound();
  return children;
}
