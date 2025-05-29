// src/app/signup/page.tsx
"use client";

import { SignUpForm } from "@/components/SignUpForm";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-2xl font-bold mt-6 mb-4 text-center">
        Welcome to Chanjo Chonjo!
      </h1>
      <h3 className="text-2xl font-semibold mt-6 mb-4 text-center">
        Track your babies&apos; vaccinations with ease
      </h3>
      <SignUpForm
        onSignupSuccess={(t) => {
          // Store the temp token in localStorage
          localStorage.setItem("tempToken", t);
          router.push("/reset");
        }}
        onSwitchToLogin={() => router.push("/login")}
      />
    </div>
  );
}
