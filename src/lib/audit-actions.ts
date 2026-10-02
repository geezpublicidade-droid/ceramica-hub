/** Nomes de ações de auditoria compartilhados entre o registro, a tela de histórico e os alertas. */

export const EXPORT_ACTION = "export_data";

/** Trechos que marcam uma ação como exclusão. Alimenta tanto o filtro SQL quanto o alerta. */
export const DELETE_KEYWORDS = ["delete", "remove", "exclu"] as const;
export const DELETE_ACTION_PATTERN = new RegExp(DELETE_KEYWORDS.join("|"), "i");
export const DELETE_ACTION_SQL_FILTER = DELETE_KEYWORDS.map((word) => `action.ilike.%${word}%`).join(",");
