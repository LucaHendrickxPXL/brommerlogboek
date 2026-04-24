import dayjs from "dayjs";
import type { PoolClient } from "pg";

import { PaymentMethod } from "@/lib/domain";
import { getDueStatus } from "@/lib/maintenance";
import { AppError } from "@/server/app-errors";
import { numericToNumber, withDbClient, withDbTransaction } from "@/server/db";

export interface MaintenanceRuleListItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePhotoUrl?: string;
  title: string;
  description: string | null;
  intervalMonths: number;
  lastCompletedAt: string | null;
  nextDueDate: string;
  active: boolean;
  status: "overdue" | "soon" | "ok";
}

export interface MaintenanceRuleDetailRecord {
  id: string;
  vehicleId: string;
  title: string;
  description: string | null;
  intervalMonths: number;
  lastCompletedAt: string | null;
  nextDueDate: string;
  active: boolean;
}

export interface MaintenanceEventListItem {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehiclePhotoUrl?: string;
  maintenanceRuleId: string | null;
  title: string;
  performedAt: string;
  workshopName: string | null;
  notes: string | null;
  costAmountEur: number | null;
  costVendorName: string | null;
  costPaymentMethod: PaymentMethod | null;
}

export interface MaintenanceEventDetailRecord extends MaintenanceEventListItem {}

export interface MaintenanceRuleOption {
  id: string;
  vehicleId: string;
  title: string;
  intervalMonths: number;
}

export interface MaintenancePageData {
  overdueCount: number;
  soonCount: number;
  activeCount: number;
  rules: MaintenanceRuleListItem[];
  inactiveRules: MaintenanceRuleListItem[];
  events: MaintenanceEventListItem[];
}

export interface MaintenanceRuleWriteInput {
  vehicleId: string;
  title: string;
  intervalMonths: number;
  lastCompletedAt: string | null;
  nextDueDate: string | null;
  description: string | null;
}

export interface MaintenanceEventWriteInput {
  vehicleId: string;
  maintenanceRuleId: string | null;
  title: string;
  performedAt: string;
  workshopName: string | null;
  notes: string | null;
  costAmountEur: number | null;
  costVendorName: string | null;
  costPaymentMethod: PaymentMethod | null;
}

function toPhotoUrl(storageKey: string | null) {
  if (!storageKey || !storageKey.startsWith("/")) {
    return undefined;
  }

  return storageKey;
}

function calculateNextDueDate(baseDate: string, intervalMonths: number) {
  return dayjs(baseDate).add(intervalMonths, "month").format("YYYY-MM-DD");
}

async function syncMaintenanceRuleSchedule(client: PoolClient, ruleId: string) {
  const ruleResult = await client.query<{ interval_months: number }>(
    `
      select interval_months
      from maintenance_rules
      where id = $1
      limit 1
    `,
    [ruleId],
  );

  const intervalMonths = ruleResult.rows[0]?.interval_months;

  if (!intervalMonths) {
    return;
  }

  const latestEventResult = await client.query<{ performed_at: string }>(
    `
      select performed_at::text
      from maintenance_events
      where maintenance_rule_id = $1
      order by performed_at desc, created_at desc
      limit 1
    `,
    [ruleId],
  );

  const latestPerformedAt = latestEventResult.rows[0]?.performed_at;

  if (!latestPerformedAt) {
    return;
  }

  await client.query(
    `
      update maintenance_rules
      set
        last_completed_at = $2,
        next_due_date = $3
      where id = $1
    `,
    [ruleId, latestPerformedAt, calculateNextDueDate(latestPerformedAt, intervalMonths)],
  );
}

async function assertVehicleAccess(client: PoolClient, userId: string, vehicleId: string) {
  const result = await client.query<{ id: string }>(
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

  if (!result.rows[0]) {
    throw new AppError({
      code: "VEHICLE_NOT_FOUND",
      message: "Kies een geldige brommer.",
      fieldErrors: {
        vehicleId: "Kies een geldige brommer.",
      },
    });
  }
}

function mapRuleStatus(nextDueDate: string) {
  return getDueStatus(nextDueDate);
}

async function listMaintenanceRulesByStateForUser(userId: string, active: boolean) {
  return withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      vehicle_id: string;
      vehicle_name: string;
      vehicle_photo_storage_key: string | null;
      title: string;
      description: string | null;
      interval_months: number;
      last_completed_at: string | null;
      next_due_date: string;
      active: boolean;
    }>(
      `
        select
          mr.id,
          mr.vehicle_id,
          v.name as vehicle_name,
          photo.storage_key as vehicle_photo_storage_key,
          mr.title,
          mr.description,
          mr.interval_months,
          mr.last_completed_at::text,
          mr.next_due_date::text,
          mr.active
        from maintenance_rules mr
        inner join vehicles v on v.id = mr.vehicle_id
        left join lateral (
          select vp.storage_key
          from vehicle_photos vp
          where vp.vehicle_id = v.id
            and vp.is_primary = true
          limit 1
        ) photo on true
        where v.user_id = $1
          and mr.active = $2
        order by mr.next_due_date asc, mr.created_at desc
      `,
      [userId, active],
    );

    return result.rows.map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      vehicleName: row.vehicle_name,
      vehiclePhotoUrl: toPhotoUrl(row.vehicle_photo_storage_key),
      title: row.title,
      description: row.description,
      intervalMonths: row.interval_months,
      lastCompletedAt: row.last_completed_at,
      nextDueDate: row.next_due_date,
      active: row.active,
      status: mapRuleStatus(row.next_due_date),
    })) satisfies MaintenanceRuleListItem[];
  });
}

export async function listMaintenanceRulesForUser(userId: string) {
  return listMaintenanceRulesByStateForUser(userId, true);
}

export async function listInactiveMaintenanceRulesForUser(userId: string) {
  return listMaintenanceRulesByStateForUser(userId, false);
}

export async function listMaintenanceRuleOptionsForUser(userId: string) {
  return withDbClient(async (client) => {
    const result = await client.query<MaintenanceRuleOption>(
      `
        select
          mr.id,
          mr.vehicle_id as "vehicleId",
          mr.title,
          mr.interval_months as "intervalMonths"
        from maintenance_rules mr
        inner join vehicles v on v.id = mr.vehicle_id
        where v.user_id = $1
          and mr.active = true
        order by lower(v.name) asc, mr.next_due_date asc
      `,
      [userId],
    );

    return result.rows;
  });
}

export async function listMaintenanceEventsForUser(userId: string) {
  return withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      vehicle_id: string;
      vehicle_name: string;
      vehicle_photo_storage_key: string | null;
      maintenance_rule_id: string | null;
      title: string;
      performed_at: string;
      workshop_name: string | null;
      notes: string | null;
      cost_amount_eur: string | number | null;
      cost_vendor_name: string | null;
      cost_payment_method: PaymentMethod | null;
    }>(
      `
        select
          me.id,
          me.vehicle_id,
          v.name as vehicle_name,
          photo.storage_key as vehicle_photo_storage_key,
          me.maintenance_rule_id,
          me.title,
          me.performed_at::text,
          me.workshop_name,
          me.notes,
          me.cost_amount_eur,
          linked_cost.vendor_name as cost_vendor_name,
          linked_cost.payment_method as cost_payment_method
        from maintenance_events me
        inner join vehicles v on v.id = me.vehicle_id
        left join lateral (
          select vp.storage_key
          from vehicle_photos vp
          where vp.vehicle_id = v.id
            and vp.is_primary = true
          limit 1
        ) photo on true
        left join lateral (
          select ce.vendor_name, ce.payment_method
          from cost_entries ce
          where ce.linked_maintenance_event_id = me.id
          limit 1
        ) linked_cost on true
        where v.user_id = $1
        order by me.performed_at desc, me.created_at desc
        limit 10
      `,
      [userId],
    );

    return result.rows.map((row) => ({
      id: row.id,
      vehicleId: row.vehicle_id,
      vehicleName: row.vehicle_name,
      vehiclePhotoUrl: toPhotoUrl(row.vehicle_photo_storage_key),
      maintenanceRuleId: row.maintenance_rule_id,
      title: row.title,
      performedAt: row.performed_at,
      workshopName: row.workshop_name,
      notes: row.notes,
      costAmountEur: numericToNumber(row.cost_amount_eur),
      costVendorName: row.cost_vendor_name,
      costPaymentMethod: row.cost_payment_method,
    })) satisfies MaintenanceEventListItem[];
  });
}

export async function getMaintenancePageData(userId: string): Promise<MaintenancePageData> {
  const [rules, inactiveRules, events] = await Promise.all([
    listMaintenanceRulesForUser(userId),
    listInactiveMaintenanceRulesForUser(userId),
    listMaintenanceEventsForUser(userId),
  ]);

  return {
    overdueCount: rules.filter((rule) => rule.status === "overdue").length,
    soonCount: rules.filter((rule) => rule.status === "soon").length,
    activeCount: rules.length,
    rules,
    inactiveRules,
    events,
  };
}

export async function getMaintenanceEventDetailForUser(userId: string, eventId: string) {
  return withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      vehicle_id: string;
      vehicle_name: string;
      vehicle_photo_storage_key: string | null;
      maintenance_rule_id: string | null;
      title: string;
      performed_at: string;
      workshop_name: string | null;
      notes: string | null;
      cost_amount_eur: string | number | null;
      cost_vendor_name: string | null;
      cost_payment_method: PaymentMethod | null;
    }>(
      `
        select
          me.id,
          me.vehicle_id,
          v.name as vehicle_name,
          photo.storage_key as vehicle_photo_storage_key,
          me.maintenance_rule_id,
          me.title,
          me.performed_at::text,
          me.workshop_name,
          me.notes,
          me.cost_amount_eur,
          linked_cost.vendor_name as cost_vendor_name,
          linked_cost.payment_method as cost_payment_method
        from maintenance_events me
        inner join vehicles v on v.id = me.vehicle_id
        left join lateral (
          select vp.storage_key
          from vehicle_photos vp
          where vp.vehicle_id = v.id
            and vp.is_primary = true
          limit 1
        ) photo on true
        left join lateral (
          select ce.vendor_name, ce.payment_method
          from cost_entries ce
          where ce.linked_maintenance_event_id = me.id
          limit 1
        ) linked_cost on true
        where me.id = $1
          and v.user_id = $2
        limit 1
      `,
      [eventId, userId],
    );

    const row = result.rows[0];

    if (!row) {
      throw new AppError({
        code: "MAINTENANCE_EVENT_NOT_FOUND",
        message: "Deze onderhoudsbeurt bestaat niet meer.",
      });
    }

    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      vehicleName: row.vehicle_name,
      vehiclePhotoUrl: toPhotoUrl(row.vehicle_photo_storage_key),
      maintenanceRuleId: row.maintenance_rule_id,
      title: row.title,
      performedAt: row.performed_at,
      workshopName: row.workshop_name,
      notes: row.notes,
      costAmountEur: numericToNumber(row.cost_amount_eur),
      costVendorName: row.cost_vendor_name,
      costPaymentMethod: row.cost_payment_method,
    } satisfies MaintenanceEventDetailRecord;
  });
}

export async function getMaintenanceRuleDetailForUser(userId: string, ruleId: string) {
  return withDbClient(async (client) => {
    const result = await client.query<{
      id: string;
      vehicle_id: string;
      title: string;
      description: string | null;
      interval_months: number;
      last_completed_at: string | null;
      next_due_date: string;
      active: boolean;
    }>(
      `
        select
          mr.id,
          mr.vehicle_id,
          mr.title,
          mr.description,
          mr.interval_months,
          mr.last_completed_at::text,
          mr.next_due_date::text,
          mr.active
        from maintenance_rules mr
        inner join vehicles v on v.id = mr.vehicle_id
        where mr.id = $1
          and v.user_id = $2
        limit 1
      `,
      [ruleId, userId],
    );

    const row = result.rows[0];

    if (!row) {
      throw new AppError({
        code: "MAINTENANCE_RULE_NOT_FOUND",
        message: "Dit onderhoudsplan bestaat niet meer.",
      });
    }

    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      title: row.title,
      description: row.description,
      intervalMonths: row.interval_months,
      lastCompletedAt: row.last_completed_at,
      nextDueDate: row.next_due_date,
      active: row.active,
    } satisfies MaintenanceRuleDetailRecord;
  });
}

export async function createMaintenanceRuleForUser(userId: string, input: MaintenanceRuleWriteInput) {
  return withDbClient(async (client) => {
    await assertVehicleAccess(client, userId, input.vehicleId);

    const nextDueDate = input.lastCompletedAt
      ? calculateNextDueDate(input.lastCompletedAt, input.intervalMonths)
      : input.nextDueDate;

    if (!nextDueDate) {
      throw new AppError({
        code: "MAINTENANCE_NEXT_DUE_REQUIRED",
        message: "Kies een volgende onderhoudsdatum of vul laatst uitgevoerd in.",
        fieldErrors: {
          nextDueDate: "Kies een volgende onderhoudsdatum.",
        },
      });
    }

    const result = await client.query<{ id: string }>(
      `
        insert into maintenance_rules (
          vehicle_id,
          title,
          description,
          interval_months,
          last_completed_at,
          next_due_date
        )
        values ($1, $2, $3, $4, $5, $6)
        returning id
      `,
      [
        input.vehicleId,
        input.title,
        input.description,
        input.intervalMonths,
        input.lastCompletedAt,
        nextDueDate,
      ],
    );

    return result.rows[0]!.id;
  });
}

export async function updateMaintenanceRuleForUser(
  userId: string,
  ruleId: string,
  input: MaintenanceRuleWriteInput,
) {
  return withDbClient(async (client) => {
    const existingRule = await client.query<{ id: string; active: boolean }>(
      `
        select mr.id, mr.active
        from maintenance_rules mr
        inner join vehicles v on v.id = mr.vehicle_id
        where mr.id = $1
          and v.user_id = $2
        limit 1
      `,
      [ruleId, userId],
    );

    if (!existingRule.rows[0]) {
      throw new AppError({
        code: "MAINTENANCE_RULE_NOT_FOUND",
        message: "Dit onderhoudsplan bestaat niet meer.",
      });
    }

    await assertVehicleAccess(client, userId, input.vehicleId);

    const nextDueDate = input.lastCompletedAt
      ? calculateNextDueDate(input.lastCompletedAt, input.intervalMonths)
      : input.nextDueDate;

    if (!nextDueDate) {
      throw new AppError({
        code: "MAINTENANCE_NEXT_DUE_REQUIRED",
        message: "Kies een volgende onderhoudsdatum of vul laatst uitgevoerd in.",
        fieldErrors: {
          nextDueDate: "Kies een volgende onderhoudsdatum.",
        },
      });
    }

    await client.query(
      `
        update maintenance_rules
        set
          vehicle_id = $2,
          title = $3,
          description = $4,
          interval_months = $5,
          last_completed_at = $6,
          next_due_date = $7
        where id = $1
      `,
      [
        ruleId,
        input.vehicleId,
        input.title,
        input.description,
        input.intervalMonths,
        input.lastCompletedAt,
        nextDueDate,
      ],
    );

    return ruleId;
  });
}

export async function setMaintenanceRuleActiveForUser(userId: string, ruleId: string, active: boolean) {
  return withDbClient(async (client) => {
    const result = await client.query<{ vehicle_id: string; active: boolean }>(
      `
        update maintenance_rules mr
        set active = $3
        from vehicles v
        where mr.id = $1
          and mr.vehicle_id = v.id
          and v.user_id = $2
        returning mr.vehicle_id, mr.active
      `,
      [ruleId, userId, active],
    );

    const row = result.rows[0];

    if (!row) {
      throw new AppError({
        code: "MAINTENANCE_RULE_NOT_FOUND",
        message: "Dit onderhoudsplan bestaat niet meer.",
      });
    }

    return {
      vehicleId: row.vehicle_id,
      active: row.active,
    };
  });
}

export async function createMaintenanceEventForUser(userId: string, input: MaintenanceEventWriteInput) {
  return withDbTransaction(async (client) => {
    await assertVehicleAccess(client, userId, input.vehicleId);

    let linkedRule: { id: string; interval_months: number } | null = null;

    if (input.maintenanceRuleId) {
      const ruleResult = await client.query<{ id: string; interval_months: number }>(
        `
          select mr.id, mr.interval_months
          from maintenance_rules mr
          inner join vehicles v on v.id = mr.vehicle_id
          where mr.id = $1
            and mr.vehicle_id = $2
            and v.user_id = $3
            and mr.active = true
          limit 1
        `,
        [input.maintenanceRuleId, input.vehicleId, userId],
      );

      linkedRule = ruleResult.rows[0] ?? null;

      if (!linkedRule) {
        throw new AppError({
          code: "MAINTENANCE_RULE_VEHICLE_MISMATCH",
          message: "Kies een onderhoudsplan dat bij deze brommer hoort.",
          fieldErrors: {
            maintenanceRuleId: "Kies een onderhoudsplan van dezelfde brommer.",
          },
        });
      }
    }

    const eventResult = await client.query<{ id: string }>(
      `
        insert into maintenance_events (
          vehicle_id,
          maintenance_rule_id,
          title,
          performed_at,
          workshop_name,
          notes,
          cost_amount_eur
        )
        values ($1, $2, $3, $4, $5, $6, $7)
        returning id
      `,
      [
        input.vehicleId,
        input.maintenanceRuleId,
        input.title,
        input.performedAt,
        input.workshopName,
        input.notes,
        input.costAmountEur,
      ],
    );

    const maintenanceEventId = eventResult.rows[0]!.id;

    if (input.costAmountEur !== null) {
      await client.query(
        `
          insert into cost_entries (
            vehicle_id,
            category,
            title,
            amount_eur,
            entry_date,
            vendor_name,
            payment_method,
            notes,
            linked_maintenance_event_id
          )
          values ($1, 'maintenance', $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          input.vehicleId,
          input.title,
          input.costAmountEur,
          input.performedAt,
          input.costVendorName ?? input.workshopName,
          input.costPaymentMethod,
          input.notes,
          maintenanceEventId,
        ],
      );
    }

    if (linkedRule) {
      await syncMaintenanceRuleSchedule(client, linkedRule.id);
    }

    return maintenanceEventId;
  });
}

export async function updateMaintenanceEventForUser(
  userId: string,
  eventId: string,
  input: Omit<MaintenanceEventWriteInput, "vehicleId" | "maintenanceRuleId">,
) {
  return withDbTransaction(async (client) => {
    const eventResult = await client.query<{
      id: string;
      vehicle_id: string;
      maintenance_rule_id: string | null;
    }>(
      `
        select
          me.id,
          me.vehicle_id,
          me.maintenance_rule_id
        from maintenance_events me
        inner join vehicles v on v.id = me.vehicle_id
        where me.id = $1
          and v.user_id = $2
        limit 1
      `,
      [eventId, userId],
    );

    const existingEvent = eventResult.rows[0];

    if (!existingEvent) {
      throw new AppError({
        code: "MAINTENANCE_EVENT_NOT_FOUND",
        message: "Deze onderhoudsbeurt bestaat niet meer.",
      });
    }

    await client.query(
      `
        update maintenance_events
        set
          title = $2,
          performed_at = $3,
          workshop_name = $4,
          notes = $5,
          cost_amount_eur = $6
        where id = $1
      `,
      [
        eventId,
        input.title,
        input.performedAt,
        input.workshopName,
        input.notes,
        input.costAmountEur,
      ],
    );

    const linkedCostResult = await client.query<{ id: string }>(
      `
        select id
        from cost_entries
        where linked_maintenance_event_id = $1
        limit 1
      `,
      [eventId],
    );

    const linkedCostId = linkedCostResult.rows[0]?.id ?? null;

    if (input.costAmountEur !== null) {
      if (linkedCostId) {
        await client.query(
          `
            update cost_entries
            set
              title = $2,
              amount_eur = $3,
              entry_date = $4,
              vendor_name = $5,
              payment_method = $6,
              notes = $7
            where id = $1
          `,
          [
            linkedCostId,
            input.title,
            input.costAmountEur,
            input.performedAt,
            input.costVendorName ?? input.workshopName,
            input.costPaymentMethod,
            input.notes,
          ],
        );
      } else {
        await client.query(
          `
            insert into cost_entries (
              vehicle_id,
              category,
              title,
              amount_eur,
              entry_date,
              vendor_name,
              payment_method,
              notes,
              linked_maintenance_event_id
            )
            values ($1, 'maintenance', $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            existingEvent.vehicle_id,
            input.title,
            input.costAmountEur,
            input.performedAt,
            input.costVendorName ?? input.workshopName,
            input.costPaymentMethod,
            input.notes,
            eventId,
          ],
        );
      }
    } else if (linkedCostId) {
      await client.query("delete from cost_entries where id = $1", [linkedCostId]);
    }

    if (existingEvent.maintenance_rule_id) {
      await syncMaintenanceRuleSchedule(client, existingEvent.maintenance_rule_id);
    }

    return {
      id: eventId,
      vehicleId: existingEvent.vehicle_id,
      maintenanceRuleId: existingEvent.maintenance_rule_id,
    };
  });
}

export async function deleteMaintenanceEventForUser(userId: string, eventId: string) {
  return withDbTransaction(async (client) => {
    const eventResult = await client.query<{
      id: string;
      vehicle_id: string;
      maintenance_rule_id: string | null;
    }>(
      `
        select
          me.id,
          me.vehicle_id,
          me.maintenance_rule_id
        from maintenance_events me
        inner join vehicles v on v.id = me.vehicle_id
        where me.id = $1
          and v.user_id = $2
        limit 1
      `,
      [eventId, userId],
    );

    const existingEvent = eventResult.rows[0];

    if (!existingEvent) {
      throw new AppError({
        code: "MAINTENANCE_EVENT_NOT_FOUND",
        message: "Deze onderhoudsbeurt bestaat niet meer.",
      });
    }

    await client.query(
      "delete from cost_entries where linked_maintenance_event_id = $1",
      [eventId],
    );
    await client.query("delete from maintenance_events where id = $1", [eventId]);

    if (existingEvent.maintenance_rule_id) {
      await syncMaintenanceRuleSchedule(client, existingEvent.maintenance_rule_id);
    }

    return {
      id: eventId,
      vehicleId: existingEvent.vehicle_id,
      maintenanceRuleId: existingEvent.maintenance_rule_id,
    };
  });
}
