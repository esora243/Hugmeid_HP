import { AuthBoundary } from "@/components/AuthBoundary";
import { ProfilePageClient } from "@/app/profile/ProfilePageClient";

export default function ProfilePage() {
  return (
    <AuthBoundary>
      <ProfilePageClient />
    </AuthBoundary>
  );
}
