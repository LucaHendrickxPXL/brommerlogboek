import type { PoolClient } from "pg";

import { CostCategory, DueStatus, FuelType } from "@/lib/domain";
import { getDueStatus } from "@/lib/maintenance";
import { AppError } from "@/server/app-errors";
import { numericToNumber, withDbClient, withDbTransaction } from "@/server/db";
import { StoredImageUpload } from "@/server/uploads";

function toPhotoUrl(storageKey: string | null) {
  if (!storageKey || !storageKey.startsWith("/")) {
    return undefined;
  }

  return storageKey;
}

function mapDueStatus(value: string | null): DueStatus | null {
  if (!value) {
    return null;
  }

  return getDueStatus(value);
}

export interface VehicleOption {
  id: string;
  name: string;
}

export interface VehiclePickerCardOption extends VehicleOption {
  brand: string | null;
  model: string | null;
  licensePlate: string | null;
  photoUrl?: string;
}

export interface GarageVehicleSummary {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  licensePlate: string | null;
  purchaseOdometerKm: number | null;
  monthlyCostEur: number;
  nextMaintenanceTitle: string | null;
  nextMaintenanceDueDate: string | null;
  nextMaintenanceStatus: DueStatus | null;
  photoUrl?: string;
}

export interface VehicleDetailRecord {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  licensePlate: string | null;
  engineCc: number | null;
  purchaseDate: string | null;
  purchasePriceEur: number | null;
  purchaseOdometerKm: number | null;
  insuranceProvider: string | null;
  insuranceCostMonthlyEur: number | null;
  notes: string | null;
  photoUrl?: string;
  monthlyCostEur: number;
  nextMaintenanceTitle: string | null;
  nextMaintenanceDueDate: string | null;
  nextMaintenanceStatus: DueStatus | null;
}

export interface VehicleTripSnippet {
  id: string;
  title: string;
  tripDate: string;
  distanceKm: number;
}

export interface VehicleCostSnippet {
  id: string;
  title: string;
  category: CostCategory;
  amountEur: number;
  entryDate: string;
}

export interface VehicleFuelSnippet {
  id: string;
  title: string;
  fuelType: FuelType | null;
  fuelStation: string | null;
  amountEur: number;
  entryDate: string;
}

export interface VehicleMaintenanceRuleSnippet {
  id: string;
  title: string;
  intervalMonths: number;
  nextDueDate: string;
  status: DueStatus;
}

export interface VehicleDetailPageData {
  vehicle: VehicleDetailRecord;
  recentTrips: VehicleTripSnippet[];
  recentCosts: VehicleCostSnippet[];
  recentFuelEntries: VehicleFuelSnippet[];
  costTotalsByCategory: Record<CostCategory, number>;
  maintenanceRules: VehicleMaintenanceRuleSnippet[];
}

export interface VehicleWriteInput {
  name: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  licensePlate: string | null;
  engineCc: number | null;
  purchaseDate: string | null;
  purchasePriceEur: number | null;
  purchaseOdometerKm: number | null;
  insuranceProvider: string | null;
  insuranceCostMonthlyEur: number | null;
  notes: string | null;
}

function createEmptyCategoryTotals() {
  return {
    fuel: 0,
    insurance: 0,
    maintenance: 0,
    taxes: 0,
    parking: 0,
    equipment: 0,
    repair: 0,
    other: 0,
  } satisfies Record<CostCategory, number>;
}

async function assertVehicleAccess(client: PoolClient, userId: string, vehicleId: string) {
  const result = await client.query<{ id: string }>(
    `
      select id
      from vehicles
      where user_id = $1
        and id = $2
      limit 1
    `,
    [userId, vehicleId],
  );

  if (!result.rows[0]) {
    throw new AppError({
      code: "VEHICLE_NOT_FOUND",
      message: "Deze brommer bestaat niet meer.",
    });
  }
}

export async function listVehicleOptionsForUser(
  userId: string,
  options?: { includeVehicleId?: string | null },
) {
  return withDbClient(async (client) => {
    const includeVehicleId = options?.includeVehicleId ?? null;

    const result = await client.query<VehicleOption>(
      `
        select id, name
        from vehicles
        where user_id = $1
          and (
            is_active = true
            or id = $2
          )
        order by
          case when is_active = true then 0 else 1 end,
          lower(name) asc
      `,
      [userId, includeVehicleId],
    );

    return result.rows;
  });
}

export async function listVehiclePickerCardsForUser(userId: string) {
  return withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      name: string;
      brand: string | null;
      model: string | null;
      license_plate: string | null;
      photo_storage_key: string | null;
    }>(
      `
        select
          v.id,
          v.name,
          v.brand,
          v.model,
          coalesce(v.license_plate, v.plate_label) as license_plate,
          photo.storage_key as photo_storage_key
        from vehicles v
        left join lateral (
          select vp.storage_key
          from vehicle_photos vp
          where vp.vehicle_id = v.id
            and vp.is_primary = true
          limit 1
        ) photo on true
        where v.user_id = $1
          and v.is_active = true
        order by lower(v.name) asc, v.created_at desc
      `,
      [userId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      brand: row.brand,
      model: row.model,
      licensePlate: row.license_plate,
      photoUrl: toPhotoUrl(row.photo_storage_key),
    })) satisfies VehiclePickerCardOption[];
  });
}

export async function listGarageVehiclesForUser(userId: string) {
  return withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      name: string;
      brand: string | null;
      model: string | null;
      year: number | null;
      license_plate: string | null;
      purchase_odometer_km: number | null;
      monthly_cost_eur: string | number | null;
      next_maintenance_title: string | null;
      next_maintenance_due_date: string | null;
      photo_storage_key: string | null;
    }>(
      `
        select
          v.id,
          v.name,
          v.brand,
          v.model,
          v.year,
          coalesce(v.license_plate, v.plate_label) as license_plate,
          v.purchase_odometer_km,
          monthly.monthly_cost_eur,
          next_rule.title as next_maintenance_title,
          next_rule.next_due_date::text as next_maintenance_due_date,
          photo.storage_key as photo_storage_key
        from vehicles v
        left join lateral (
          select coalesce(sum(ce.amount_eur), 0)::numeric as monthly_cost_eur
          from cost_entries ce
          where ce.vehicle_id = v.id
            and ce.entry_date >= date_trunc('month', current_date)::date
            and ce.entry_date < (date_trunc('month', current_date) + interval '1 month')::date
        ) monthly on true
        left join lateral (
          select mr.title, mr.next_due_date
          from maintenance_rules mr
          where mr.vehicle_id = v.id
            and mr.active = true
          order by mr.next_due_date asc
          limit 1
        ) next_rule on true
        left join lateral (
          select vp.storage_key
          from vehicle_photos vp
          where vp.vehicle_id = v.id
            and vp.is_primary = true
          limit 1
        ) photo on true
        where v.user_id = $1
          and v.is_active = true
        order by lower(v.name) asc, v.created_at desc
      `,
      [userId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      brand: row.brand,
      model: row.model,
      year: row.year,
      licensePlate: row.license_plate,
      purchaseOdometerKm: row.purchase_odometer_km,
      monthlyCostEur: numericToNumber(row.monthly_cost_eur) ?? 0,
      nextMaintenanceTitle: row.next_maintenance_title,
      nextMaintenanceDueDate: row.next_maintenance_due_date,
      nextMaintenanceStatus: mapDueStatus(row.next_maintenance_due_date),
      photoUrl: toPhotoUrl(row.photo_storage_key),
    }));
  });
}

export async function getVehicleDetailForUser(userId: string, vehicleId: string) {
  return withDbClient(async (client) => {
    const vehicleResult = await client.query<{
      id: string;
      name: string;
      brand: string | null;
      model: string | null;
      year: number | null;
      license_plate: string | null;
      engine_cc: number | null;
      purchase_date: string | null;
      purchase_price_eur: string | number | null;
      purchase_odometer_km: number | null;
      insurance_provider: string | null;
      insurance_cost_monthly_eur: string | number | null;
      notes: string | null;
      monthly_cost_eur: string | number | null;
      next_maintenance_title: string | null;
      next_maintenance_due_date: string | null;
      photo_storage_key: string | null;
    }>(
      `
        select
          v.id,
          v.name,
          v.brand,
          v.model,
          v.year,
          coalesce(v.license_plate, v.plate_label) as license_plate,
          v.engine_cc,
          v.purchase_date::text,
          v.purchase_price_eur,
          v.purchase_odometer_km,
          v.insurance_provider,
          v.insurance_cost_monthly_eur,
          v.notes,
          monthly.monthly_cost_eur,
          next_rule.title as next_maintenance_title,
          next_rule.next_due_date::text as next_maintenance_due_date,
          photo.storage_key as photo_storage_key
        from vehicles v
        left join lateral (
          select coalesce(sum(ce.amount_eur), 0)::numeric as monthly_cost_eur
          from cost_entries ce
          where ce.vehicle_id = v.id
            and ce.entry_date >= date_trunc('month', current_date)::date
            and ce.entry_date < (date_trunc('month', current_date) + interval '1 month')::date
        ) monthly on true
        left join lateral (
          select mr.title, mr.next_due_date
          from maintenance_rules mr
          where mr.vehicle_id = v.id
            and mr.active = true
          order by mr.next_due_date asc
          limit 1
        ) next_rule on true
        left join lateral (
          select vp.storage_key
          from vehicle_photos vp
          where vp.vehicle_id = v.id
            and vp.is_primary = true
          limit 1
        ) photo on true
        where v.user_id = $1
          and v.id = $2
        limit 1
      `,
      [userId, vehicleId],
    );

    const vehicleRow = vehicleResult.rows[0];

    if (!vehicleRow) {
      throw new AppError({
        code: "VEHICLE_NOT_FOUND",
        message: "Deze brommer bestaat niet meer.",
      });
    }

    const recentTripsResult = await client.query<{
      id: string;
      title: string;
      trip_date: string;
      distance_km: string | number;
    }>(
      `
        select id, title, trip_date::text, distance_km
        from trips
        where vehicle_id = $1
        order by trip_date desc, created_at desc
        limit 3
      `,
      [vehicleId],
    );

    const recentCostsResult = await client.query<{
      id: string;
      title: string;
      category: CostCategory;
      amount_eur: string | number;
      entry_date: string;
    }>(
      `
        select id, title, category, amount_eur, entry_date::text
        from cost_entries
        where vehicle_id = $1
        order by entry_date desc, created_at desc
        limit 3
      `,
      [vehicleId],
    );

    const recentFuelResult = await client.query<{
      id: string;
      title: string;
      fuel_type: FuelType | null;
      fuel_station: string | null;
      amount_eur: string | number;
      entry_date: string;
    }>(
      `
        select id, title, fuel_type, fuel_station, amount_eur, entry_date::text
        from cost_entries
        where vehicle_id = $1
          and category = 'fuel'
        order by entry_date desc, created_at desc
        limit 3
      `,
      [vehicleId],
    );

    const costTotalsResult = await client.query<{
      category: CostCategory;
      total_amount_eur: string | number;
    }>(
      `
        select category, coalesce(sum(amount_eur), 0)::numeric as total_amount_eur
        from cost_entries
        where vehicle_id = $1
        group by category
      `,
      [vehicleId],
    );

    const rulesResult = await client.query<{
      id: string;
      title: string;
      interval_months: number;
      next_due_date: string;
    }>(
      `
        select id, title, interval_months, next_due_date::text
        from maintenance_rules
        where vehicle_id = $1
          and active = true
        order by next_due_date asc
        limit 6
      `,
      [vehicleId],
    );

    return {
      vehicle: {
        id: vehicleRow.id,
        name: vehicleRow.name,
        brand: vehicleRow.brand,
        model: vehicleRow.model,
        year: vehicleRow.year,
        licensePlate: vehicleRow.license_plate,
        engineCc: vehicleRow.engine_cc,
        purchaseDate: vehicleRow.purchase_date,
        purchasePriceEur: numericToNumber(vehicleRow.purchase_price_eur),
        purchaseOdometerKm: vehicleRow.purchase_odometer_km,
        insuranceProvider: vehicleRow.insurance_provider,
        insuranceCostMonthlyEur: numericToNumber(vehicleRow.insurance_cost_monthly_eur),
        notes: vehicleRow.notes,
        monthlyCostEur: numericToNumber(vehicleRow.monthly_cost_eur) ?? 0,
        nextMaintenanceTitle: vehicleRow.next_maintenance_title,
        nextMaintenanceDueDate: vehicleRow.next_maintenance_due_date,
        nextMaintenanceStatus: mapDueStatus(vehicleRow.next_maintenance_due_date),
        photoUrl: toPhotoUrl(vehicleRow.photo_storage_key),
      },
      recentTrips: recentTripsResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        tripDate: row.trip_date,
        distanceKm: numericToNumber(row.distance_km) ?? 0,
      })),
      recentCosts: recentCostsResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        category: row.category,
        amountEur: numericToNumber(row.amount_eur) ?? 0,
        entryDate: row.entry_date,
      })),
      recentFuelEntries: recentFuelResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        fuelType: row.fuel_type,
        fuelStation: row.fuel_station,
        amountEur: numericToNumber(row.amount_eur) ?? 0,
        entryDate: row.entry_date,
      })),
      costTotalsByCategory: costTotalsResult.rows.reduce(
        (totals, row) => {
          totals[row.category] = numericToNumber(row.total_amount_eur) ?? 0;
          return totals;
        },
        createEmptyCategoryTotals(),
      ),
      maintenanceRules: rulesResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        intervalMonths: row.interval_months,
        nextDueDate: row.next_due_date,
        status: getDueStatus(row.next_due_date),
      })),
    } satisfies VehicleDetailPageData;
  });
}

export async function createVehicleForUser(userId: string, input: VehicleWriteInput) {
  return withDbClient(async (client) => {
    const result = await client.query<{ id: string }>(
      `
        insert into vehicles (
          user_id,
          name,
          brand,
          model,
          year,
          license_plate,
          engine_cc,
          purchase_date,
          purchase_price_eur,
          purchase_odometer_km,
          insurance_provider,
          insurance_cost_monthly_eur,
          notes
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        returning id
      `,
      [
        userId,
        input.name,
        input.brand,
        input.model,
        input.year,
        input.licensePlate,
        input.engineCc,
        input.purchaseDate,
        input.purchasePriceEur,
        input.purchaseOdometerKm,
        input.insuranceProvider,
        input.insuranceCostMonthlyEur,
        input.notes,
      ],
    );

    return result.rows[0]!.id;
  });
}

export async function updateVehicleForUser(userId: string, vehicleId: string, input: VehicleWriteInput) {
  return withDbClient(async (client) => {
    const result = await client.query<{ id: string }>(
      `
        update vehicles
        set
          name = $3,
          brand = $4,
          model = $5,
          year = $6,
          license_plate = $7,
          engine_cc = $8,
          purchase_date = $9,
          purchase_price_eur = $10,
          purchase_odometer_km = $11,
          insurance_provider = $12,
          insurance_cost_monthly_eur = $13,
          notes = $14
        where user_id = $1
          and id = $2
          and is_active = true
        returning id
      `,
      [
        userId,
        vehicleId,
        input.name,
        input.brand,
        input.model,
        input.year,
        input.licensePlate,
        input.engineCc,
        input.purchaseDate,
        input.purchasePriceEur,
        input.purchaseOdometerKm,
        input.insuranceProvider,
        input.insuranceCostMonthlyEur,
        input.notes,
      ],
    );

    if (!result.rows[0]) {
      throw new AppError({
        code: "VEHICLE_NOT_FOUND",
        message: "Deze brommer bestaat niet meer.",
      });
    }

    return result.rows[0].id;
  });
}

export async function archiveVehicleForUser(userId: string, vehicleId: string) {
  return withDbClient(async (client) => {
    const result = await client.query<{ id: string }>(
      `
        update vehicles
        set is_active = false
        where user_id = $1
          and id = $2
          and is_active = true
        returning id
      `,
      [userId, vehicleId],
    );

    if (!result.rows[0]) {
      throw new AppError({
        code: "VEHICLE_NOT_FOUND",
        message: "Deze brommer bestaat niet meer.",
      });
    }
  });
}

export async function setVehiclePhotoForUser(userId: string, vehicleId: string, photo: StoredImageUpload) {
  return withDbTransaction(async (client) => {
    await assertVehicleAccess(client, userId, vehicleId);

    const existingPhotoResult = await client.query<{ storage_key: string | null }>(
      `
        select storage_key
        from vehicle_photos
        where vehicle_id = $1
          and is_primary = true
        limit 1
      `,
      [vehicleId],
    );

    await client.query("delete from vehicle_photos where vehicle_id = $1", [vehicleId]);

    await client.query(
      `
        insert into vehicle_photos (
          vehicle_id,
          storage_key,
          original_filename,
          mime_type,
          file_size_bytes,
          width_px,
          height_px,
          is_primary
        )
        values ($1, $2, $3, $4, $5, $6, $7, true)
      `,
      [
        vehicleId,
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

export async function deleteVehiclePhotoForUser(userId: string, vehicleId: string) {
  return withDbTransaction(async (client) => {
    await assertVehicleAccess(client, userId, vehicleId);

    const result = await client.query<{ storage_key: string | null }>(
      `
        delete from vehicle_photos
        where vehicle_id = $1
          and is_primary = true
        returning storage_key
      `,
      [vehicleId],
    );

    return result.rows[0]?.storage_key ?? null;
  });
}
