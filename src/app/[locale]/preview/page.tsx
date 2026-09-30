import { redirect } from "next/navigation";

// A home foi promovida pra "/"; mantém links antigos de /preview funcionando.
export default async function Preview({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}`);
}
