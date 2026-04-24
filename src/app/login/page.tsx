import { PublicAuthShell } from "@/features/auth/public-auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import { redirectIfAuthenticated } from "@/server/auth";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <PublicAuthShell
      title="Inloggen"
      subtitle="Meld je aan om je eigen garage, ritten, kosten en onderhoud te beheren."
    >
      <LoginForm />
    </PublicAuthShell>
  );
}
