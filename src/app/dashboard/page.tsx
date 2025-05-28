"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";
import { Columns, Vaccination } from "@/components/Columns";
import { Pending } from "@/components/Pending";
import { ProfileResponse, Baby } from "@/types";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = "force-dynamic"; 

const API_BASE = process.env.NEXT_BACKEND_URL;

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="pt-16 px-4">Loading...</div>}>
      <DashboardPageContent />
    </Suspense>
  );
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const babyIdFromQuery = searchParams.get("babyId");

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [mustReset, setMustReset] = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [selectedBabyId, setSelectedBabyId] = useState<string | null>(
    babyIdFromQuery
  );

  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [ScheduleData, setScheduleData] = useState<Vaccination[]>([]); // Changed from any[] to Vaccination[]

  // 1) On mount: get token & fetch /api/profile
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
        setMustReset(json.mustResetPassword);
        setProfileComplete(json.profileComplete);
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

        // (c) Otherwise, pick an initial babyId for the table
        if (json.babies.length > 0) {
          const found = json.babies.some((b) => b.id === babyIdFromQuery);
          if (!babyIdFromQuery || !found) {
            const first = json.babies[0].id;
            setSelectedBabyId(first);
            router.replace(`/dashboard?babyId=${first}`, { scroll: false });
          } else {
            setSelectedBabyId(babyIdFromQuery);
          }
        }
      })
      .catch((e) => {
        console.error("Failed to load profile:", e);
        toast.error("Failed to load profile data");
      });
    // we intentionally do NOT depend on `selectedBabyId`, only on babyIdFromQuery
  }, [babyIdFromQuery, router]);

  // 2) Once profile is loaded and valid, fetch Schedule
  useEffect(() => {
    if (!authToken || mustReset || !profileComplete) return;
    setLoadingSchedule(true);

    fetch(`${API_BASE}/api/vaccination-schedule`, {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((json: Vaccination[]) => {
        setScheduleData(json);
      })
      .catch((e) => {
        console.error("Failed to fetch Schedule:", e);
        toast.error("Failed to load vaccination Schedule");
      })
      .finally(() => {
        setLoadingSchedule(false);
      });
  }, [authToken, mustReset, profileComplete]);

  // 3) Whenever a baby is selected (and Schedule loaded), POST /api/reminder/{babyId}
  useEffect(() => {
    if (!authToken || !selectedBabyId || loadingSchedule) return;
    fetch(`${API_BASE}/api/reminder/${selectedBabyId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    })
      .then((r) => {
        if (!r.ok) throw new Error();
        console.log("Reminders Scheduled");
      })
      .catch((e) => {
        console.error("Failed to Schedule reminders:", e);
        toast.warning("Failed to Schedule reminders");
      });
  }, [authToken, selectedBabyId, loadingSchedule]);

  // 4) When the Navbar fires a DOB change, update the baby's DOB in local state
  const handleDobChange = (newDob: string) => {
    if (!profile) return;
    const updatedBabies = profile.babies.map((b) =>
      b.id === selectedBabyId ? { ...b, date_of_birth: newDob } : b
    );
    setProfile({ ...profile, babies: updatedBabies });
  };

  if (!profile) return <p>Loading profile…</p>;
  if (loadingSchedule) return <p>Loading Schedule…</p>;

  // Flatten out `profile.babies`
  const babiesList: Baby[] = profile.babies;

  // Extract user's name
  const userName = profile.mother?.full_name ?? "Mom";

  // Find the selected baby object (if any babies exist)
  const selectedBaby =
    babiesList.find((b) => b.id === selectedBabyId) || null;

  return (
    <div className="pt-16">
      {authToken && (
        <Navbar
          userName={userName}
          babies={babiesList}
          selectedBabyId={selectedBabyId}
          onSelectBaby={(val) => {
            setSelectedBabyId(val);
            router.replace(`/dashboard?babyId=${val}`, { scroll: false });
          }}
          // Now "Add Baby" should simply send you to /add-baby
          onAddBaby={() => {
            router.push("/add-baby");
          }}
          isAdding={false} // we're no longer toggling an inline form
          babyId={selectedBabyId}
          authToken={authToken}
          initialDob={selectedBaby?.date_of_birth ?? null}
          onBirthDateChange={handleDobChange}
        />
      )}

      <main>
        {/** If there are no babies at all, prompt "No baby data available" + a button that goes to /add-baby */}
        {babiesList.length === 0 ? (
          <div className="mt-8 text-center py-8">
            <p className="text-lg mb-4">No baby data available</p>
            <Link href="/add-baby">
              <Button variant="outline">Add Baby Information</Button>
            </Link>
          </div>
        ) : (
          // Otherwise, show the Schedule table for the selected baby
          <div className="mt-8 w-full max-w-screen-2xl mx-auto px-4">
            <h1 className="text-2xl text-center font-semibold mb-6">
              {selectedBaby?.baby_name}&apos;s Vaccination Schedule
            </h1>
            <Pending
              columns={Columns}
              data={ScheduleData}
              initialBirthDate={selectedBaby?.date_of_birth ?? ""}
              babyId={selectedBabyId!}
              authToken={authToken!}
            />
          </div>
        )}
      </main>
    </div>
  );
}