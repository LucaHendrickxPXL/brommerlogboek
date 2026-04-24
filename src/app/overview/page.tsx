import { requireAppUser } from "@/server/auth";
import { getOverviewPageData } from "@/server/overview";
import { OverviewScreen } from "@/features/overview/overview-screen";

export default async function OverviewPage() {
  const user = await requireAppUser();
  const data = await getOverviewPageData(user.id);

  return <OverviewScreen data={data} />;
}
