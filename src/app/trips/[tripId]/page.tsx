import { notFound } from "next/navigation";

import { TripDetailScreen } from "@/features/trips/trip-detail-screen";
import { isNotFoundAppError } from "@/server/app-errors";
import { requireAppUser } from "@/server/auth";
import { getTripDetailForUser } from "@/server/trips";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const user = await requireAppUser();
  const { tripId } = await params;

  try {
    const trip = await getTripDetailForUser(user.id, tripId);

    return <TripDetailScreen trip={trip} />;
  } catch (error) {
    if (isNotFoundAppError(error)) {
      notFound();
    }

    throw error;
  }
}
