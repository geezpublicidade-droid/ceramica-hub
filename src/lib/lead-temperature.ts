import type { LeadTemperature } from "@/lib/services/leads";

export const TEMPERATURE_LABEL: Record<LeadTemperature, string> = {
  frio: "Frio",
  morno: "Morno",
  quente: "Quente",
};

export const TEMPERATURE_CLASS: Record<LeadTemperature, string> = {
  frio: "bg-blue-100 text-blue-700",
  morno: "bg-yellow-100 text-yellow-700",
  quente: "bg-red-100 text-red-700",
};
