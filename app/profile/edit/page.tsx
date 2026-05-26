import { AuthBoundary } from "@/components/AuthBoundary";
import { ProfileEditPageClient } from "@/app/profile/edit/ProfileEditPageClient";

export default function ProfileEditPage() {
  return (
    <AuthBoundary>
      <ProfileEditPageClient />
    </AuthBoundary>
  );
}
