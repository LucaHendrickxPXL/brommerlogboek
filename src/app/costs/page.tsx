import { requireAppUser } from "@/server/auth";
import { getCostsPageData } from "@/server/costs";
import { CostsScreen } from "@/features/costs/costs-screen";

export default async function CostsPage() {
  const user = await requireAppUser();
  const data = await getCostsPageData(user.id);

  return <CostsScreen data={data} />;
}
