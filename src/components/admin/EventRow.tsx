"use client";

import { StatusToggleRow } from "@/components/admin/StatusToggleRow";
import { updateEventStatus, deleteEvent } from "@/lib/actions/admin-events";
import type { BusinessEvent } from "@/lib/services/events";

export function EventRow({ event }: { event: BusinessEvent }) {
  const subtitle = `${new Date(event.startsAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}${
    event.location ? ` · ${event.location}` : ""
  }`;

  return (
    <StatusToggleRow
      title={event.title}
      subtitle={subtitle}
      status={event.status}
      onStatusChange={(status) => updateEventStatus(event.id, status)}
      onDelete={() => deleteEvent(event.id)}
    />
  );
}
