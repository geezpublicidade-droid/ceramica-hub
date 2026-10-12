import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Link do perfil a partir do @ (com ou sem "@"). */
export function instagramUrl(handle: string): string {
  return `https://instagram.com/${handle.replace(/^@/, "")}`;
}

/** Link wa.me a partir de um número em qualquer formato. */
export function whatsappUrl(number: string): string {
  return `https://wa.me/${number.replace(/D/g, "")}`;
}

export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateBR(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("pt-BR");
}

/** Converte um input de preço em R$ (aceita vírgula) pra centavos -- null se
 * vazio ou inválido, nunca NaN/negativo. Usado por todo form que cadastra
 * preço (campanha, espaço de anúncio). */
export function parseCentsInput(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

/** Data e hora no fuso de São Paulo, para telas administrativas. */
export function formatDateTimeBR(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
