import { SupportWhatsAppButton } from "@/components/support/SupportWhatsAppButton";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <SupportWhatsAppButton />
    </>
  );
}
