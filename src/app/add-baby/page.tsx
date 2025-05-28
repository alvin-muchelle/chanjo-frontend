// src/app/add-baby/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AddBabyForm } from "@/components/AddBabyForm";

export default function AddBabyPage() {
  const router = useRouter();
  const [authToken, setAuthToken] = useState<string | null>(null);

  // 1) On mount, grab token. If missing, redirect to /login.
  useEffect(() => {
    const t = localStorage.getItem("authToken");
    if (!t) {
      router.replace("/login");
    } else {
      setAuthToken(t);
    }
  }, [router]);

  // 2) Handler after successfully adding a baby.
  //    We want to re‐fetch “/api/profile” (so Dashboard knows the new baby),
  //    then navigate back to Dashboard, selecting the newly‐added baby.__
  const handleSuccess = async () => {
    if (!authToken) return;

    try {
      const res = await fetch(`${process.env.NEXT_BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error("Failed to refresh profile");
      const json = await res.json();
      // pick the LAST baby (the one we just added)
      const last = json.babies[json.babies.length - 1];
      if (last && last.id) {
        // jump to Dashboard, with babyId query
        router.replace(`/dashboard?babyId=${last.id}`, { scroll: false });
        toast.success("Baby added successfully!");
      } else {
        // fallback
        router.replace("/dashboard");
      }
    } catch (e) {
      console.error("Failed to refresh profile after adding baby:", e);
      router.replace("/dashboard");
    }
  };

  if (!authToken) {
    return <p>Loading…</p>;
  }

  return <AddBabyForm token={authToken} onSuccess={handleSuccess} />;
}
