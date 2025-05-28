// src/app/profile/page.tsx
"use client";

import { ProfileForm } from "@/components/ProfileForm";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Baby } from "@/types";

interface ProfileResponse {
  mustResetPassword: boolean;
  profileComplete: boolean;
  mother: { id: string; full_name: string; phone_number: string } | null;
  babies: Baby[]; 
}

export default function ProfilePage() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("authToken");
    if (t) setAuthToken(t);
    else router.replace("/login");
  }, [router]);

  const handleProfileComplete = async () => {
    if (!authToken) return;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      if (!res.ok) throw new Error();
      const json: ProfileResponse = await res.json();
      // If there's at least one baby, send them to the dashboard
      if (json.babies.length > 0) {
        router.push("/dashboard");
      }
    } catch (e) {
      console.error("Failed to fetch updated profile", e);
      toast.error("Failed to load baby data");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4 text-center">
        Complete Your Profile
      </h1>
      {authToken && (
        <ProfileForm token={authToken} onProfileComplete={handleProfileComplete} />
      )}
    </div>
  );
}
