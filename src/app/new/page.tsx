import { requireAppUser } from "@/server/auth";
import { NewEntryScreen } from "@/features/new-entry/new-entry-screen";

export default async function NewEntryPage() {
  await requireAppUser();
  return <NewEntryScreen />;
}
