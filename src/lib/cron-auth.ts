/** Cron do Vercel manda "Authorization: Bearer <CRON_SECRET>". Sem o segredo configurado, só o ambiente de desenvolvimento passa. */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.get("authorization") === `Bearer ${secret}`;
}
