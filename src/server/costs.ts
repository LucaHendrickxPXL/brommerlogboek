import dayjs from "dayjs";
import type { PoolClient } from "pg";

import { CostCategory, FuelType, PaymentMethod } from "@/lib/domain";
import { AppError } from "@/server/app-errors";
import { numericToNumber, withDbClient } from "@/server/db";
import { VehicleOption, listVehicleOptionsForUser } from "@/server/vehicles";

export interface CostListItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePhotoUrl?: string;
  category: CostCategory;
  title: string;
  amountEur: number;
  entryDate: string;
  vendorName: string | null;
  locationName: string | null;
  paymentMethod: PaymentMethod | null;
  fuelType: FuelType | null;
  fuelStation: string | null;
  isFullTank: boolean | null;
  odometerKm: number | null;
  notes: string | null;
  linkedMaintenanceEventId: string | null;
}

export interface CostDetailRecord extends CostListItem {}

export interface CostsPageData {
  fuelThisMonth: number;
  insuranceThisMonth: number;
  totalsByCategory: Record<CostCategory, number>;
  entries: CostListItem[];
  vehicles: VehicleOption[];
}

export interface GeneralCostWriteInput {
  vehicleId: string;
  category: Exclude<CostCategory, "fuel">;
  title: string;
  amountEur: number;
  entryDate: string;
  vendorName: string | null;
  locationName: string | null;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
}

export interface FuelEntryWriteInput {
  vehicleId: string;
  fuelType: FuelType;
  amountEur: number;
  entryDate: string;
  fuelStation: string | null;
  paymentMethod: PaymentMethod | null;
  isFullTank: boolean;
  odometerKm: number | null;
  notes: string | null;
}

export interface CurrentMonthCostSummary {
  totalCosts: number;
  fuelCosts: number;
}

function toPhotoUrl(storageKey: string | null) {
  if (!storageKey || !storageKey.startsWith("/")) {
    return undefined;
  }

  return storageKey;
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

export async function listCostsForUser(userId: string) {
  return withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      vehicle_id: string;
      vehicle_name: string;
      vehicle_photo_storage_key: string | null;
      category: CostCategory;
      title: string;
      amount_eur: string | number;
      entry_date: string;
      vendor_name: string | null;
      location_name: string | null;
      payment_method: PaymentMethod | null;
      fuel_type: FuelType | null;
      fuel_station: string | null;
      is_full_tank: boolean | null;
      odometer_km: number | null;
      notes: string | null;
      linked_maintenance_event_id: string | null;
    }>(
      `
        select
          ce.id,
          ce.vehicle_id,
          v.name as vehicle_name,
          photo.storage_key as vehicle_photo_storage_key,
          ce.category,
          ce.title,
          ce.amount_eur,
          ce.entry_date::text,
          ce.vendor_name,
          ce.location_name,
          ce.payment_method,
          ce.fuel_type,
          ce.fuel_station,
          ce.is_full_tank,
          ce.odometer_km,
          ce.notes,
          ce.linked_maintenance_event_id
        from cost_entries ce
        inner join vehicles v on v.id = ce.vehicle_id
        left join lateral (
          select vp.storage_key
          from vehicle_photos vp
          where vp.vehicle_id = v.id
            and vp.is_primary = true
          limit 1
        ) photo on true
        where v.user_id = $1
        order by ce.entry_date desc, ce.created_at desc
      `,
      [userId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      vehicleName: row.vehicle_name,
      vehiclePhotoUrl: toPhotoUrl(row.vehicle_photo_storage_key),
      category: row.category,
      title: row.title,
      amountEur: numericToNumber(row.amount_eur) ?? 0,
      entryDate: row.entry_date,
      vendorName: row.vendor_name,
      locationName: row.location_name,
      paymentMethod: row.payment_method,
      fuelType: row.fuel_type,
      fuelStation: row.fuel_station,
      isFullTank: row.is_full_tank,
      odometerKm: row.odometer_km,
      notes: row.notes,
      linkedMaintenanceEventId: row.linked_maintenance_event_id,
    }));
  });
}

export async function getCostsPageData(userId: string): Promise<CostsPageData> {
  const [entries, vehicles] = await Promise.all([
    listCostsForUser(userId),
    listVehicleOptionsForUser(userId),
  ]);
  const currentMonth = dayjs().format("YYYY-MM");
  const totalsByCategory = createEmptyCategoryTotals();

  for (const entry of entries) {
    if (entry.entryDate.startsWith(currentMonth)) {
      totalsByCategory[entry.category] += entry.amountEur;
    }
  }

  return {
    fuelThisMonth: totalsByCategory.fuel,
    insuranceThisMonth: totalsByCategory.insurance,
    totalsByCategory,
    entries,
    vehicles,
  };
}

export async function getCurrentMonthCostSummaryForUser(userId: string): Promise<CurrentMonthCostSummary> {
  return withDbClient(async (client) => {
    const result = await client.query<{
      total_amount_eur: string | number | null;
      fuel_amount_eur: string | number | null;
    }>(
      `
        select
          coalesce(sum(ce.amount_eur), 0)::numeric as total_amount_eur,
          coalesce(
            sum(
              case
                when ce.category = 'fuel' then ce.amount_eur
                else 0
              end
            ),
            0
          )::numeric as fuel_amount_eur
        from cost_entries ce
        inner join vehicles v on v.id = ce.vehicle_id
        where v.user_id = $1
          and ce.entry_date >= date_trunc('month', current_date)::date
          and ce.entry_date < (date_trunc('month', current_date) + interval '1 month')::date
      `,
      [userId],
    );

    return {
      totalCosts: numericToNumber(result.rows[0]?.total_amount_eur) ?? 0,
      fuelCosts: numericToNumber(result.rows[0]?.fuel_amount_eur) ?? 0,
    };
  });
}

async function assertVehicleAccess(
  client: PoolClient,
  userId: string,
  vehicleId: string,
) {
  const vehicleResult = await client.query<{ id: string }>(
    `
      select id
      from vehicles
      where id = $1
        and user_id = $2
        and is_active = true
      limit 1
    `,
    [vehicleId, userId],
  );

  if (!vehicleResult.rows[0]) {
    throw new AppError({
      code: "COST_VEHICLE_MISMATCH",
      message: "Kies een geldige brommer.",
      fieldErrors: {
        vehicleId: "Kies een geldige brommer.",
      },
    });
  }
}

async function getEditableCostEntry(
  client: PoolClient,
  userId: string,
  entryId: string,
) {
  const result = await client.query<{
    id: string;
    category: CostCategory;
    vehicle_id: string;
    linked_maintenance_event_id: string | null;
  }>(
    `
      select
        ce.id,
        ce.category,
        ce.vehicle_id,
        ce.linked_maintenance_event_id
      from cost_entries ce
      inner join vehicles v on v.id = ce.vehicle_id
      where ce.id = $1
        and v.user_id = $2
      limit 1
    `,
    [entryId, userId],
  );

  const row = result.rows[0];

  if (!row) {
    throw new AppError({
      code: "COST_NOT_FOUND",
      message: "Deze kost bestaat niet meer.",
    });
  }

  if (row.linked_maintenance_event_id) {
    throw new AppError({
      code: "COST_LINKED_TO_MAINTENANCE",
      message: "Deze kost hoort bij een onderhoudsbeurt en moet daar aangepast worden.",
    });
  }

  return row;
}

export async function getCostDetailForUser(userId: string, entryId: string) {
  return withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      vehicle_id: string;
      vehicle_name: string;
      vehicle_photo_storage_key: string | null;
      category: CostCategory;
      title: string;
      amount_eur: string | number;
      entry_date: string;
      vendor_name: string | null;
      location_name: string | null;
      payment_method: PaymentMethod | null;
      fuel_type: FuelType | null;
      fuel_station: string | null;
      is_full_tank: boolean | null;
      odometer_km: number | null;
      notes: string | null;
      linked_maintenance_event_id: string | null;
    }>(
      `
        select
          ce.id,
          ce.vehicle_id,
          v.name as vehicle_name,
          photo.storage_key as vehicle_photo_storage_key,
          ce.category,
          ce.title,
          ce.amount_eur,
          ce.entry_date::text,
          ce.vendor_name,
          ce.location_name,
          ce.payment_method,
          ce.fuel_type,
          ce.fuel_station,
          ce.is_full_tank,
          ce.odometer_km,
          ce.notes,
          ce.linked_maintenance_event_id
        from cost_entries ce
        inner join vehicles v on v.id = ce.vehicle_id
        left join lateral (
          select vp.storage_key
          from vehicle_photos vp
          where vp.vehicle_id = v.id
            and vp.is_primary = true
          limit 1
        ) photo on true
        where ce.id = $1
          and v.user_id = $2
        limit 1
      `,
      [entryId, userId],
    );

    const row = result.rows[0];

    if (!row) {
      throw new AppError({
        code: "COST_NOT_FOUND",
        message: "Deze kost bestaat niet meer.",
      });
    }

    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      vehicleName: row.vehicle_name,
      vehiclePhotoUrl: toPhotoUrl(row.vehicle_photo_storage_key),
      category: row.category,
      title: row.title,
      amountEur: numericToNumber(row.amount_eur) ?? 0,
      entryDate: row.entry_date,
      vendorName: row.vendor_name,
      locationName: row.location_name,
      paymentMethod: row.payment_method,
      fuelType: row.fuel_type,
      fuelStation: row.fuel_station,
      isFullTank: row.is_full_tank,
      odometerKm: row.odometer_km,
      notes: row.notes,
      linkedMaintenanceEventId: row.linked_maintenance_event_id,
    } satisfies CostDetailRecord;
  });
}

export async function createGeneralCostForUser(userId: string, input: GeneralCostWriteInput) {
  return withDbClient(async (client) => {
    await assertVehicleAccess(client, userId, input.vehicleId);

    const result = await client.query<{ id: string }>(
      `
        insert into cost_entries (
          vehicle_id,
          category,
          title,
          amount_eur,
          entry_date,
          vendor_name,
          location_name,
          payment_method,
          notes
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        returning id
      `,
      [
        input.vehicleId,
        input.category,
        input.title,
        input.amountEur,
        input.entryDate,
        input.vendorName,
        input.locationName,
        input.paymentMethod,
        input.notes,
      ],
    );

    return result.rows[0]!.id;
  });
}

export async function createFuelEntryForUser(userId: string, input: FuelEntryWriteInput) {
  return withDbClient(async (client) => {
    await assertVehicleAccess(client, userId, input.vehicleId);

    const result = await client.query<{ id: string }>(
      `
        insert into cost_entries (
          vehicle_id,
          category,
          title,
          amount_eur,
          entry_date,
          payment_method,
          notes,
          fuel_type,
          fuel_station,
          is_full_tank,
          odometer_km
        )
        values ($1, 'fuel', $2, $3, $4, $5, $6, $7, $8, $9, $10)
        returning id
      `,
      [
        input.vehicleId,
        `Tankbeurt ${input.fuelType}`,
        input.amountEur,
        input.entryDate,
        input.paymentMethod,
        input.notes,
        input.fuelType,
        input.fuelStation,
        input.isFullTank,
        input.odometerKm,
      ],
    );

    return result.rows[0]!.id;
  });
}

export async function updateGeneralCostForUser(userId: string, entryId: string, input: GeneralCostWriteInput) {
  return withDbClient(async (client) => {
    const existingEntry = await getEditableCostEntry(client, userId, entryId);

    if (existingEntry.category === "fuel") {
      throw new AppError({
        code: "COST_CATEGORY_MISMATCH",
        message: "Deze kost moet via de tankbeurt-flow aangepast worden.",
      });
    }

    await assertVehicleAccess(client, userId, input.vehicleId);

    await client.query(
      `
        update cost_entries
        set
          vehicle_id = $2,
          category = $3,
          title = $4,
          amount_eur = $5,
          entry_date = $6,
          vendor_name = $7,
          location_name = $8,
          payment_method = $9,
          notes = $10,
          fuel_type = null,
          fuel_station = null,
          is_full_tank = null,
          odometer_km = null
        where id = $1
      `,
      [
        entryId,
        input.vehicleId,
        input.category,
        input.title,
        input.amountEur,
        input.entryDate,
        input.vendorName,
        input.locationName,
        input.paymentMethod,
        input.notes,
      ],
    );

    return {
      id: entryId,
      previousVehicleId: existingEntry.vehicle_id,
      vehicleId: input.vehicleId,
    };
  });
}

export async function updateFuelEntryForUser(userId: string, entryId: string, input: FuelEntryWriteInput) {
  return withDbClient(async (client) => {
    const existingEntry = await getEditableCostEntry(client, userId, entryId);

    if (existingEntry.category !== "fuel") {
      throw new AppError({
        code: "COST_CATEGORY_MISMATCH",
        message: "Deze kost hoort niet bij een tankbeurt.",
      });
    }

    await assertVehicleAccess(client, userId, input.vehicleId);

    await client.query(
      `
        update cost_entries
        set
          vehicle_id = $2,
          category = 'fuel',
          title = $3,
          amount_eur = $4,
          entry_date = $5,
          vendor_name = null,
          location_name = null,
          payment_method = $6,
          notes = $7,
          fuel_type = $8,
          fuel_station = $9,
          is_full_tank = $10,
          odometer_km = $11
        where id = $1
      `,
      [
        entryId,
        input.vehicleId,
        `Tankbeurt ${input.fuelType}`,
        input.amountEur,
        input.entryDate,
        input.paymentMethod,
        input.notes,
        input.fuelType,
        input.fuelStation,
        input.isFullTank,
        input.odometerKm,
      ],
    );

    return {
      id: entryId,
      previousVehicleId: existingEntry.vehicle_id,
      vehicleId: input.vehicleId,
    };
  });
}

export async function deleteCostForUser(userId: string, entryId: string) {
  return withDbClient(async (client) => {
    const existingEntry = await getEditableCostEntry(client, userId, entryId);

    await client.query("delete from cost_entries where id = $1", [entryId]);

    return {
      id: entryId,
      vehicleId: existingEntry.vehicle_id,
      category: existingEntry.category,
    };
  });
}
