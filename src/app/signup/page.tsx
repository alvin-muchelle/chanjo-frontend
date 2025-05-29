// src/app/signup/page.tsx
"use client";

import { SignUpForm } from "@/components/SignUpForm";
import { useRouter } from "next/navigation";

export default function SignUpPage() {
  const router = useRouter();

  return (
    <div>
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
