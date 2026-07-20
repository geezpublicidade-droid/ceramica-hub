"use server";

import bcrypt from "bcryptjs";
import { createServiceClient } from "@/lib/supabase/server";

export type RegisterBusinessInput = {
  name: string;
  responsibleName: string;
  email: string;
  password: string;
  phone: string;
  document: string;
  category: string;
  shortDescription: string;
  towerId: string;
  floor: string;
  roomNumber: string;
  logoUrl: string;
  coverPhotoUrl: string;
  instagram: string;
  websiteUrl: string;
  openingHours: string;
  services: { name: string; description: string }[];
  termsAccepted: boolean;
  privacyAccepted: boolean;
  imageUsageAuthorized: boolean;
  addressConfirmed: boolean;
};

export type RegisterBusinessResult = { success: true; businessId: string } | { success: false; error: string };

export async function registerBusiness(input: RegisterBusinessInput): Promise<RegisterBusinessResult> {
  if (
    !input.name.trim() ||
    !input.responsibleName.trim() ||
    !input.email.trim() ||
    !input.password ||
    !input.phone.trim() ||
    !input.category.trim() ||
    !input.towerId ||
    !input.floor.trim() ||
    !input.roomNumber.trim()
  ) {
    return { success: false, error: "Preencha todos os campos obrigatórios." };
  }

  if (!input.termsAccepted || !input.privacyAccepted || !input.addressConfirmed) {
    return { success: false, error: "É necessário aceitar os termos, a política de privacidade e confirmar o funcionamento no endereço." };
  }

  if (input.password.length < 8) {
    return { success: false, error: "A senha precisa ter pelo menos 8 caracteres." };
  }

  const supabase = createServiceClient();
  const passwordHash = await bcrypt.hash(input.password, 10);

  const { data: business, error } = await supabase
    .from("businesses")
    .insert({
      email: input.email.trim().toLowerCase(),
      password_hash: passwordHash,
      name: input.name.trim(),
      responsible_name: input.responsibleName.trim(),
      document: input.document.trim() || null,
      category: input.category,
      description: input.shortDescription.trim() || null,
      instagram: input.instagram.trim() || null,
      phone: input.phone.trim(),
      tower_id: input.towerId,
      floor: input.floor.trim(),
      room_number: input.roomNumber.trim(),
      logo_url: input.logoUrl.trim() || null,
      cover_photo_url: input.coverPhotoUrl.trim() || null,
      website_url: input.websiteUrl.trim() || null,
      opening_hours: input.openingHours.trim() || null,
      image_usage_authorized: input.imageUsageAuthorized,
      plan: "presenca",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Já existe um cadastro com esse e-mail." };
    }
    return { success: false, error: "Não foi possível concluir o cadastro. Tente novamente." };
  }

  const services = input.services.filter((s) => s.name.trim()).slice(0, 3);
  if (services.length > 0) {
    await supabase.from("business_services").insert(
      services.map((s, index) => ({
        business_id: business.id,
        name: s.name.trim(),
        description: s.description.trim() || null,
        sort_order: index,
      }))
    );
  }

  return { success: true, businessId: business.id };
}
