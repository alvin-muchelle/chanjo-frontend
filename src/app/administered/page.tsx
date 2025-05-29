"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Administered } from "@/components/Administered";
import { ProfileResponse, Baby } from "@/types";

export const dynamic = "force-dynamic"; 

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL 

export default function AdministeredPage() {
  return (
    <Suspense fallback={<div className="pt-16 px-4">Loading...</div>}>
      <AdministeredPageContent />
    </Suspense>
  );
}

function AdministeredPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const babyIdFromQuery = searchParams.get("babyId");

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(
    babyIdFromQuery
  );
  const [loading, setLoading] = useState<boolean>(true);

  // 1) On mount: get token & fetch profile
  useEffect(() => {
    const t = localStorage.getItem("authToken");
    if (!t) {
      router.replace("/login");
      return;
    }
    setAuthToken(t);

    fetch(`${API_BASE}/api/profile`, {
      headers: { Authorization: `Bearer ${t}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((json: ProfileResponse) => {
        setProfile(json);

        // (a) If mother must reset → /reset
        if (json.mustResetPassword) {
          router.replace("/reset");
          return;
        }

        // (b) Only redirect to /profile if mom's name OR phone is missing:
        if (!json.mother?.full_name || !json.mother?.phone_number) {
          router.replace("/profile");
          return;
        }

        // (c) Otherwise, choose a babyId from URL or default to first baby
        if (json.babies.length > 0) {
          const found = json.babies.some((b) => b.id === babyIdFromQuery);
          if (!babyIdFromQuery || !found) {
            const first = json.babies[0].id;
            setSelectedBabyId(first);
            router.replace(`/administered?babyId=${first}`, { scroll: false });
          } else {
            setSelectedBabyId(babyIdFromQuery);
          }
        }
      })
      .catch((e) => {
        console.error("Failed to load profile:", e);
        toast.error("Failed to load profile data");
      })
      .finally(() => setLoading(false));
  }, [babyIdFromQuery, router]);

  if (loading || !profile) {
    return <p>Loading…</p>;
  }

  // Flatten babies
  const babiesList: Baby[] = profile.babies;

  // If there are no babies at all, show a "No baby data available" message
  if (!babiesList.length) {
    return (
      <div className="pt-16 px-4">
        <p className="text-lg">
          No baby data available. Add a baby in Dashboard before viewing
          administered vaccines.
        </p>
      </div>
    );
  }

  // If the query param babyIdFromQuery is invalid or missing, fall back to the first baby
  const effectiveBabyId =
    selectedBabyId && babiesList.some((b) => b.id === selectedBabyId)
      ? selectedBabyId
      : babiesList[0].id;

  const selectedBaby = babiesList.find((b) => b.id === effectiveBabyId)!;

  return (
    <div className="pt-16 px-4">
      {/* ←–– "Back to Dashboard" button */}
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => {
          router.push(`/dashboard?babyId=${effectiveBabyId}`);
        }}
      >
        ← Back to Dashboard
      </Button>

      <h1 className="text-2xl text-center font-semibold mb-6">
        {selectedBaby.baby_name}&apos;s Administered Vaccines
      </h1>

      {authToken && effectiveBabyId && (
        <Administered babyId={effectiveBabyId} authToken={authToken} />
      )}
    </div>
  );
}