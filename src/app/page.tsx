import { requireAppUser } from "@/server/auth";
import { getHomePageData } from "@/server/home";
import { HomeScreen } from "@/features/home/home-screen";

export default async function HomePage() {
  const user = await requireAppUser();
  const data = await getHomePageData(user.id);

  return <HomeScreen data={data} />;
}
