import { requireAppUser } from "@/server/auth";
import { getMaintenancePageData } from "@/server/maintenance";
import { MaintenanceScreen } from "@/features/maintenance/maintenance-screen";

export default async function MaintenancePage() {
  const user = await requireAppUser();
  const data = await getMaintenancePageData(user.id);

  return <MaintenanceScreen data={data} />;
}
