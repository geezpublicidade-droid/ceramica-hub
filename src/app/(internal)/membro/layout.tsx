import { SupportWhatsAppButton } from "@/components/support/SupportWhatsAppButton";

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SupportWhatsAppButton />
    </>
  );
}
