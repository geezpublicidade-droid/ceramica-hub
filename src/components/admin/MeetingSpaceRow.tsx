"use client";

import { StatusToggleRow } from "@/components/admin/StatusToggleRow";
import { updateMeetingSpaceStatus, deleteMeetingSpace } from "@/lib/actions/admin-meeting-spaces";
import type { MeetingSpace } from "@/lib/services/meeting-spaces";

export function MeetingSpaceRow({ space }: { space: MeetingSpace }) {
  const subtitle = (
    <>
      {space.spaceType === "auditorio" ? "Auditório" : "Sala de reunião"}
      {space.capacity && ` · até ${space.capacity} pessoas`}
      {space.towerName && ` · ${space.towerName}`}
    </>
  );

  return (
    <StatusToggleRow
      title={space.name}
      subtitle={subtitle}
      status={space.status}
      onStatusChange={(status) => updateMeetingSpaceStatus(space.id, status)}
      onDelete={() => deleteMeetingSpace(space.id)}
    />
  );
}
