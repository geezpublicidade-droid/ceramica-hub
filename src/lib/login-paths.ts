// Única fonte de verdade pra "qual URL de login pertence a qual área" —
// usada por src/auth.ts (redirect quando o Google nega login) e
// src/middleware.ts (redirect quando falta sessão), pra não ter dois mapas
// que podem divergir se uma rota de login mudar de lugar.
export const LOGIN_PATH_BY_AREA = {
  business: "/login",
  member: "/membro/login",
  admin: "/admin/login",
} as const;

export type LoginArea = keyof typeof LOGIN_PATH_BY_AREA;
