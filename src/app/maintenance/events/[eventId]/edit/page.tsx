import { notFound } from "next/navigation";
import { Paper, Stack, Text } from "@mantine/core";

import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { MaintenanceEventForm } from "@/features/maintenance/maintenance-event-form";
import { isNotFoundAppError } from "@/server/app-errors";
import { requireAppUser } from "@/server/auth";
import {
  deleteMaintenanceEventAction,
  updateMaintenanceEventAction,
} from "@/server/maintenance-actions";
import { getMaintenanceEventDetailForUser, getMaintenanceRuleDetailForUser } from "@/server/maintenance";

export default async function EditMaintenanceEventPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const user = await requireAppUser();
  const { eventId } = await params;

  try {
    const event = await getMaintenanceEventDetailForUser(user.id, eventId);
    const rule = event.maintenanceRuleId
      ? await getMaintenanceRuleDetailForUser(user.id, event.maintenanceRuleId)
      : null;

    return (
      <Stack gap="xl">
        <MaintenanceEventForm
          action={updateMaintenanceEventAction}
          mode="edit"
          title="Onderhoud bewerken"
          description="Pas datum, notities en gekoppelde kost aan zonder de historiek te verliezen."
          submitLabel="Wijzigingen bewaren"
          initialValues={{
            eventId: event.id,
            vehicleId: event.vehicleId,
            vehicleLabel: event.vehicleName,
            maintenanceRuleId: event.maintenanceRuleId,
            maintenanceRuleLabel: rule ? `${rule.title} (${rule.intervalMonths} mnd)` : "Geen gekoppeld plan",
            title: event.title,
            performedAt: event.performedAt,
            workshopName: event.workshopName,
            notes: event.notes,
            costAmountEur: event.costAmountEur,
            costVendorName: event.costVendorName,
            costPaymentMethod: event.costPaymentMethod,
          }}
        />

        <Paper className="surface-card" withBorder>
          <Stack gap="sm">
            <Text fw={700}>Onderhoud verwijderen</Text>
            <Text size="sm" c="dimmed">
              Deze onderhoudsbeurt en de eventueel gekoppelde onderhoudskost verdwijnen uit je historiek.
            </Text>
            <form action={deleteMaintenanceEventAction}>
              <input type="hidden" name="eventId" value={event.id} />
              <ConfirmSubmitButton
                confirmMessage="Wil je deze onderhoudsbeurt echt verwijderen? Deze actie kan niet ongedaan worden gemaakt."
                variant="light"
                color="rose"
              >
                Onderhoud verwijderen
              </ConfirmSubmitButton>
            </form>
          </Stack>
        </Paper>
      </Stack>
    );
  } catch (error) {
    if (isNotFoundAppError(error)) {
      notFound();
    }

    throw error;
  }
}
