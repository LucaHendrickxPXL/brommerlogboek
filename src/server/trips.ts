import dayjs from "dayjs";
import type { PoolClient } from "pg";

import { AppError } from "@/server/app-errors";
import { numericToNumber, withDbClient, withDbTransaction } from "@/server/db";
import { StoredImageUpload } from "@/server/uploads";

function toPhotoUrl(storageKey: string | null) {
  if (!storageKey || !storageKey.startsWith("/")) {
    return undefined;
  }

  return storageKey;
}

export interface TripListItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePhotoUrl?: string;
  title: string;
  tripDate: string;
  distanceKm: number;
  durationMinutes: number | null;
  startLocationName: string | null;
  endLocationName: string | null;
  notes: string | null;
  photoUrl?: string;
}

export interface TripWriteInput {
  vehicleId: string;
  title: string | null;
  tripDate: string;
  distanceKm: number;
  durationMinutes: number | null;
  startLocationName: string | null;
  endLocationName: string | null;
  notes: string | null;
}

export interface TripDetailRecord extends TripListItem {}

export interface TripHomeSummary {
  totalCount: number;
  recentTrips: TripListItem[];
}

function buildFallbackTripTitle(tripDate: string) {
  return `Rit op ${dayjs(tripDate).format("D MMM")}`;
}

async function assertTripAccess(client: PoolClient, userId: string, tripId: string) {
  const result = await client.query<{ id: string }>(
    `
      select t.id
      from trips t
      inner join vehicles v on v.id = t.vehicle_id
      where t.id = $1
        and v.user_id = $2
      limit 1
    `,
    [tripId, userId],
  );

  if (!result.rows[0]) {
    throw new AppError({
      code: "TRIP_NOT_FOUND",
      message: "Deze rit bestaat niet meer.",
    });
  }
}

export async function listTripsForUser(userId: string) {
  return withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      vehicle_id: string;
      vehicle_name: string;
      vehicle_photo_storage_key: string | null;
      title: string;
      trip_date: string;
      distance_km: string | number;
      duration_minutes: number | null;
      start_location_name: string | null;
      end_location_name: string | null;
      notes: string | null;
      trip_photo_storage_key: string | null;
    }>(
      `
        select
          t.id,
          t.vehicle_id,
          v.name as vehicle_name,
          vehicle_photo.storage_key as vehicle_photo_storage_key,
          t.title,
          t.trip_date::text,
          t.distance_km,
          t.duration_minutes,
          t.start_location_name,
          t.end_location_name,
          t.notes,
          trip_photo.storage_key as trip_photo_storage_key
        from trips t
        inner join vehicles v on v.id = t.vehicle_id
        left join lateral (
          select vp.storage_key
          from vehicle_photos vp
          where vp.vehicle_id = v.id
            and vp.is_primary = true
          limit 1
        ) vehicle_photo on true
        left join trip_photos trip_photo on trip_photo.trip_id = t.id
        where v.user_id = $1
        order by t.trip_date desc, t.created_at desc
      `,
      [userId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      vehicleName: row.vehicle_name,
      vehiclePhotoUrl: toPhotoUrl(row.vehicle_photo_storage_key),
      title: row.title,
      tripDate: row.trip_date,
      distanceKm: numericToNumber(row.distance_km) ?? 0,
      durationMinutes: row.duration_minutes,
      startLocationName: row.start_location_name,
      endLocationName: row.end_location_name,
      notes: row.notes,
      photoUrl: toPhotoUrl(row.trip_photo_storage_key),
    }));
  });
}

export async function getTripHomeSummaryForUser(userId: string, limit = 3): Promise<TripHomeSummary> {
  return withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      vehicle_id: string;
      vehicle_name: string;
      vehicle_photo_storage_key: string | null;
      title: string;
      trip_date: string;
      distance_km: string | number;
      duration_minutes: number | null;
      start_location_name: string | null;
      end_location_name: string | null;
      notes: string | null;
      trip_photo_storage_key: string | null;
      total_count: number;
    }>(
      `
        select
          t.id,
          t.vehicle_id,
          v.name as vehicle_name,
          vehicle_photo.storage_key as vehicle_photo_storage_key,
          t.title,
          t.trip_date::text,
          t.distance_km,
          t.duration_minutes,
          t.start_location_name,
          t.end_location_name,
          t.notes,
          trip_photo.storage_key as trip_photo_storage_key,
          count(*) over()::int as total_count
        from trips t
        inner join vehicles v on v.id = t.vehicle_id
        left join lateral (
          select vp.storage_key
          from vehicle_photos vp
          where vp.vehicle_id = v.id
            and vp.is_primary = true
          limit 1
        ) vehicle_photo on true
        left join trip_photos trip_photo on trip_photo.trip_id = t.id
        where v.user_id = $1
        order by t.trip_date desc, t.created_at desc
        limit $2
      `,
      [userId, limit],
    );

    return {
      totalCount: result.rows[0]?.total_count ?? 0,
      recentTrips: result.rows.map((row) => ({
        id: row.id,
        vehicleId: row.vehicle_id,
        vehicleName: row.vehicle_name,
        vehiclePhotoUrl: toPhotoUrl(row.vehicle_photo_storage_key),
        title: row.title,
        tripDate: row.trip_date,
        distanceKm: numericToNumber(row.distance_km) ?? 0,
        durationMinutes: row.duration_minutes,
        startLocationName: row.start_location_name,
        endLocationName: row.end_location_name,
        notes: row.notes,
        photoUrl: toPhotoUrl(row.trip_photo_storage_key),
      })),
    };
  });
}

export async function createTripForUser(userId: string, input: TripWriteInput) {
  return withDbClient(async (client) => {
    const vehicleResult = await client.query<{ id: string; name: string }>(
      `
        select id, name
        from vehicles
        where id = $1
          and user_id = $2
          and is_active = true
        limit 1
      `,
      [input.vehicleId, userId],
    );

    if (!vehicleResult.rows[0]) {
      throw new AppError({
        code: "VEHICLE_NOT_FOUND",
        message: "Kies een geldige brommer.",
        fieldErrors: {
          vehicleId: "Kies een geldige brommer.",
        },
      });
    }

    const title = input.title?.trim() || buildFallbackTripTitle(input.tripDate);

    const result = await client.query<{ id: string }>(
      `
        insert into trips (
          vehicle_id,
          title,
          trip_date,
          distance_km,
          duration_minutes,
          start_location_name,
          end_location_name,
          notes
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8)
        returning id
      `,
      [
        input.vehicleId,
        title,
        input.tripDate,
        input.distanceKm,
        input.durationMinutes,
        input.startLocationName,
        input.endLocationName,
        input.notes,
      ],
    );

    return result.rows[0]!.id;
  });
}

export async function getTripDetailForUser(userId: string, tripId: string) {
  return withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      vehicle_id: string;
      vehicle_name: string;
      vehicle_photo_storage_key: string | null;
      title: string;
      trip_date: string;
      distance_km: string | number;
      duration_minutes: number | null;
      start_location_name: string | null;
      end_location_name: string | null;
      notes: string | null;
      trip_photo_storage_key: string | null;
    }>(
      `
        select
          t.id,
          t.vehicle_id,
          v.name as vehicle_name,
          vehicle_photo.storage_key as vehicle_photo_storage_key,
          t.title,
          t.trip_date::text,
          t.distance_km,
          t.duration_minutes,
          t.start_location_name,
          t.end_location_name,
          t.notes,
          trip_photo.storage_key as trip_photo_storage_key
        from trips t
        inner join vehicles v on v.id = t.vehicle_id
        left join lateral (
          select vp.storage_key
          from vehicle_photos vp
          where vp.vehicle_id = v.id
            and vp.is_primary = true
          limit 1
        ) vehicle_photo on true
        left join trip_photos trip_photo on trip_photo.trip_id = t.id
        where t.id = $1
          and v.user_id = $2
        limit 1
      `,
      [tripId, userId],
    );

    const row = result.rows[0];

    if (!row) {
      throw new AppError({
        code: "TRIP_NOT_FOUND",
        message: "Deze rit bestaat niet meer.",
      });
    }

    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      vehicleName: row.vehicle_name,
      vehiclePhotoUrl: toPhotoUrl(row.vehicle_photo_storage_key),
      title: row.title,
      tripDate: row.trip_date,
      distanceKm: numericToNumber(row.distance_km) ?? 0,
      durationMinutes: row.duration_minutes,
      startLocationName: row.start_location_name,
      endLocationName: row.end_location_name,
      notes: row.notes,
      photoUrl: toPhotoUrl(row.trip_photo_storage_key),
    } satisfies TripDetailRecord;
  });
}

export async function updateTripForUser(userId: string, tripId: string, input: TripWriteInput) {
  return withDbClient(async (client) => {
    await assertTripAccess(client, userId, tripId);

    const vehicleResult = await client.query<{ id: string; name: string }>(
      `
        select id, name
        from vehicles
        where id = $1
          and user_id = $2
          and is_active = true
        limit 1
      `,
      [input.vehicleId, userId],
    );

    if (!vehicleResult.rows[0]) {
      throw new AppError({
        code: "VEHICLE_NOT_FOUND",
        message: "Kies een geldige brommer.",
        fieldErrors: {
          vehicleId: "Kies een geldige brommer.",
        },
      });
    }

    const title = input.title?.trim() || buildFallbackTripTitle(input.tripDate);

    await client.query(
      `
        update trips
        set
          vehicle_id = $2,
          title = $3,
          trip_date = $4,
          distance_km = $5,
          duration_minutes = $6,
          start_location_name = $7,
          end_location_name = $8,
          notes = $9
        where id = $1
      `,
      [
        tripId,
        input.vehicleId,
        title,
        input.tripDate,
        input.distanceKm,
        input.durationMinutes,
        input.startLocationName,
        input.endLocationName,
        input.notes,
      ],
    );

    return tripId;
  });
}

export async function deleteTripForUser(userId: string, tripId: string) {
  return withDbTransaction(async (client) => {
    const tripResult = await client.query<{
      id: string;
      vehicle_id: string;
      photo_storage_key: string | null;
    }>(
      `
        select
          t.id,
          t.vehicle_id,
          tp.storage_key as photo_storage_key
        from trips t
        inner join vehicles v on v.id = t.vehicle_id
        left join trip_photos tp on tp.trip_id = t.id
        where t.id = $1
          and v.user_id = $2
        limit 1
      `,
      [tripId, userId],
    );

    const trip = tripResult.rows[0];

    if (!trip) {
      throw new AppError({
        code: "TRIP_NOT_FOUND",
        message: "Deze rit bestaat niet meer.",
      });
    }

    await client.query("delete from trips where id = $1", [tripId]);

    return {
      vehicleId: trip.vehicle_id,
      photoStorageKey: trip.photo_storage_key,
    };
  });
}

export async function setTripPhotoForUser(userId: string, tripId: string, photo: StoredImageUpload) {
  return withDbTransaction(async (client) => {
    await assertTripAccess(client, userId, tripId);

    const existingPhotoResult = await client.query<{ storage_key: string | null }>(
      `
        select storage_key
        from trip_photos
        where trip_id = $1
        limit 1
      `,
      [tripId],
    );

    await client.query(
      `
        insert into trip_photos (
          trip_id,
          storage_key,
          original_filename,
          mime_type,
          file_size_bytes,
          width_px,
          height_px
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (trip_id) do update
        set
          storage_key = excluded.storage_key,
          original_filename = excluded.original_filename,
          mime_type = excluded.mime_type,
          file_size_bytes = excluded.file_size_bytes,
          width_px = excluded.width_px,
          height_px = excluded.height_px
      `,
      [
        tripId,
        photo.storageKey,
        photo.originalFilename,
        photo.mimeType,
        photo.fileSizeBytes,
        photo.widthPx,
        photo.heightPx,
      ],
    );

    return existingPhotoResult.rows[0]?.storage_key ?? null;
  });
}

export async function deleteTripPhotoForUser(userId: string, tripId: string) {
  return withDbTransaction(async (client) => {
    await assertTripAccess(client, userId, tripId);

    const result = await client.query<{ storage_key: string | null }>(
      `
        delete from trip_photos
        where trip_id = $1
        returning storage_key
      `,
      [tripId],
    );

    return result.rows[0]?.storage_key ?? null;
  });
}
