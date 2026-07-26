import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.2,
  // Sem DSN configurado, o SDK simplesmente não envia nada — não bloqueia
  // nem quebra o app enquanto a chave não existir.
});
