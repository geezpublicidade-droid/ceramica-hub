"use client";

import { StatusToggleRow } from "@/components/admin/StatusToggleRow";
import { updateHotelStatus, deleteHotel } from "@/lib/actions/admin-hotels";
import type { Hotel } from "@/lib/services/hotels";

export function HotelRow({ hotel }: { hotel: Hotel }) {
  return (
    <StatusToggleRow
      title={hotel.name}
      subtitle={hotel.address}
      status={hotel.status}
      onStatusChange={(status) => updateHotelStatus(hotel.id, status)}
      onDelete={() => deleteHotel(hotel.id)}
    />
  );
}
