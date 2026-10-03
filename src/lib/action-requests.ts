/** Tipos de ação que a empresa pode pedir à equipe pelo portal de resultados (Fase 3.5). Constantes puras, seguras pra client components. */
export const ACTION_REQUEST_TYPES = [
  "destaque_home",
  "renovar_destaque_categoria",
  "novo_destaque_categoria",
  "post_instagram",
  "email_marketing",
  "campanha",
  "revisar_perfil",
  "outro",
] as const;
export type ActionRequestType = (typeof ACTION_REQUEST_TYPES)[number];

export const ACTION_REQUEST_LABEL: Record<ActionRequestType, string> = {
  destaque_home: "Destaque na home",
  renovar_destaque_categoria: "Renovar destaque em categoria",
  novo_destaque_categoria: "Contratar destaque em categoria",
  post_instagram: "Post no Instagram do Hub",
  email_marketing: "E-mail para a base de contatos",
  campanha: "Campanha de divulgação",
  revisar_perfil: "Revisar minha página",
  outro: "Outra ação",
};
