export function buildWhatsAppLink(phone: string, businessName: string) {
  const message = `Olá! Vim do Cerâmica Hub e quero saber mais sobre a ${businessName}.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
