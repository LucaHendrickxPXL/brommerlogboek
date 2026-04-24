import { redirect } from "next/navigation";

import { redirectIfAuthenticated } from "@/server/auth";

export default async function SetupPage() {
  await redirectIfAuthenticated();
  redirect("/register");
}
