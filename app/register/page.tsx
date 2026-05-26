import { AuthBoundary } from "@/components/AuthBoundary";
import { RegisterPageClient } from "@/app/register/RegisterPageClient";

export default function RegisterPage() {
  return (
    <AuthBoundary>
      <RegisterPageClient />
    </AuthBoundary>
  );
}
