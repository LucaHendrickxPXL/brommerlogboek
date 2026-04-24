import { requireAppUser } from "@/server/auth";
import { SettingsScreen } from "@/features/settings/settings-screen";

export default async function SettingsPage() {
  const user = await requireAppUser();

  return <SettingsScreen user={user} />;
}
