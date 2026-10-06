/** Só dígitos; número brasileiro sem DDI (10-11 dígitos) ganha o 55. */
export function whatsappDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11 ? `55${digits}` : digits;
}

export function whatsappUrl(phone: string, message: string): string {
  return `https://wa.me/${whatsappDigits(phone)}?text=${encodeURIComponent(message)}`;
}

export const defaultWhatsappMessage = (businessName: string) =>
  `Olá! Encontrei a ${businessName} pelo Cerâmica Hub e gostaria de mais informações.`;

export const serviceWhatsappMessage = (serviceName: string) =>
  `Olá, encontrei a empresa pelo Cerâmica Hub e gostaria de saber mais sobre ${serviceName}.`;
