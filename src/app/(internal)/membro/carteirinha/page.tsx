import { redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { BackLink } from "@/components/nav/BackLink";
import { memberCardCode } from "@/lib/services/member-card";

export const metadata = { title: "Carteirinha — Cerâmica Hub" };
export const dynamic = "force-dynamic";

export default async function MemberCardPage() {
  const session = await auth();
  const memberId = session?.user?.memberId;
  if (!memberId) redirect("/membro/login");

  const code = memberCardCode(memberId);
  const qrSvg = await QRCode.toString(code, { type: "svg", margin: 1, color: { dark: "#2b211d", light: "#ffffff" } });

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto flex max-w-sm flex-col gap-6">
        <BackLink href="/membro" />
        <div className="gradient-terracotta-animated rounded-3xl p-6 text-white shadow-lg">
          <p className="text-[13px] font-medium uppercase tracking-[0.2em] text-white/70">Cerâmica Hub · Membro</p>
          <p className="mt-6 text-[22px] font-semibold leading-tight">{session?.user?.name ?? "Membro"}</p>
          <p className="mt-1 text-[14px] text-white/80">{session?.user?.email}</p>
          <div
            role="img"
            aria-label={`QR Code da carteirinha ${code}`}
            className="mx-auto mt-6 h-48 w-48 overflow-hidden rounded-2xl bg-white p-2 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="mt-4 text-center font-mono text-[18px] font-semibold tracking-[0.25em]">{code}</p>
        </div>
        <p className="text-center text-[14px] text-muted">
          Mostre este QR Code nas empresas parceiras para identificar você como membro e validar benefícios.
        </p>
      </div>
    </main>
  );
}
