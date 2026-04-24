import { notFound } from "next/navigation";

import { LinkButton } from "@/components/ui/app-link";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { MaintenanceRuleForm } from "@/features/maintenance/maintenance-rule-form";
import { isNotFoundAppError } from "@/server/app-errors";
import { requireAppUser } from "@/server/auth";
import { updateMaintenanceRuleAction } from "@/server/maintenance-actions";
import { getMaintenanceRuleDetailForUser } from "@/server/maintenance";
import { listVehicleOptionsForUser } from "@/server/vehicles";

export default async function EditMaintenanceRulePage({
  params,
}: {
  params: Promise<{ ruleId: string }>;
}) {
  const user = await requireAppUser();
  const { ruleId } = await params;

  try {
    const rule = await getMaintenanceRuleDetailForUser(user.id, ruleId);
    const vehicles = await listVehicleOptionsForUser(user.id, {
      includeVehicleId: rule.vehicleId,
    });

    if (vehicles.length === 0) {
      return (
        <EmptyStateCard
          title="Geen brommers beschikbaar"
          description="Voeg eerst opnieuw een actieve brommer toe voor je dit onderhoudsplan wijzigt."
          action={
            <LinkButton href="/garage/new" variant="light" color="dark">
              Brommer toevoegen
            </LinkButton>
          }
        />
      );
    }

    return (
      <MaintenanceRuleForm
        action={updateMaintenanceRuleAction}
        vehicles={vehicles}
        mode="edit"
        title="Onderhoudsplan bewerken"
        description="Pas interval, timing en notities aan zonder je historiek te verliezen."
        submitLabel="Wijzigingen bewaren"
        initialValues={{
          ruleId: rule.id,
          vehicleId: rule.vehicleId,
          title: rule.title,
          intervalMonths: rule.intervalMonths,
          lastCompletedAt: rule.lastCompletedAt,
          nextDueDate: rule.nextDueDate,
          description: rule.description,
        }}
      />
    );
  } catch (error) {
    if (isNotFoundAppError(error)) {
      notFound();
    }

    throw error;
  }
}
