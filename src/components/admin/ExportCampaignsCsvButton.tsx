"use client";

import type { CampaignWithDetails, CampaignMetrics } from "@/lib/services/ads";

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

export function ExportCampaignsCsvButton({
  rows,
}: {
  rows: { campaign: CampaignWithDetails; metrics: CampaignMetrics }[];
}) {
  function handleExport() {
    const header = ["Campanha", "Anunciante", "Posição", "Status", "Início", "Fim", "Impressões", "Cliques", "CTR (%)"];
    const lines = rows.map(({ campaign, metrics }) =>
      [
        campaign.title,
        campaign.advertiserName,
        campaign.placementName,
        campaign.status,
        campaign.startsAt,
        campaign.endsAt,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr.toFixed(2),
      ]
        .map(csvEscape)
        .join(",")
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "relatorio-publicidade.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={handleExport} className="neu rounded-full px-4 py-2 text-[15px] font-medium text-foreground">
      Exportar relatório (CSV)
    </button>
  );
}
