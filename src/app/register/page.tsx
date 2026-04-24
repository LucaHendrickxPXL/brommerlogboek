import { PublicAuthShell } from "@/features/auth/public-auth-shell";
import { RegisterForm } from "@/features/auth/register-form";
import { redirectIfAuthenticated } from "@/server/auth";

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return (
    <PublicAuthShell
      title="Account aanmaken"
      subtitle="Maak je eigen account aan en houd alleen je eigen brommers, ritten en kosten bij."
    >
      <RegisterForm />
    </PublicAuthShell>
  );
}
