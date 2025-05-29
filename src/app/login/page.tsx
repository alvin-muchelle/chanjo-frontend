// src/app/login/page.tsx
"use client";

import { LoginForm } from "@/components/LoginForm";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = useCallback(
    async (token: string, mustReset: boolean) => {
      // 1) Store the token immediately
      localStorage.setItem("authToken", token);

      if (mustReset) {
        // 2) If they must reset their password, send them to /reset
        router.push("/reset");
        return;
      }

      // 3) Otherwise, check if their profile is already complete
      try {
        const profileRes = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/profile`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!profileRes.ok) {
          console.error("GET /api/profile failed", await profileRes.text());
          // Optionally show an error or log out the user here.
          return;
        }

        const profileJson = await profileRes.json();
        if (profileJson.profileComplete) {
          router.push("/dashboard");
        } else {
          router.push("/profile");
        }
      } catch (err) {
        console.error("Network error loading profile", err);
      }
    },
    [router]
  );

  return (
    <div>
      <LoginForm
        onLoginSuccess={handleLoginSuccess}
        onSwitchToSignup={() => router.push("/signup")}
      />
    </div>
  );
}
