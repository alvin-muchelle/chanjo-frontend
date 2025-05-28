// src/app/reset/page.tsx
"use client";

import { ResetPasswordForm } from "@/components/ResetPasswordForm";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ResetPage() {
  const router = useRouter();
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    // Grab the temp token from localStorage (or fallback to authToken)
    const t = localStorage.getItem("tempToken") || localStorage.getItem("authToken");
    if (t) setToken(t);
    else router.replace("/login");
  }, [router]);

  return (
    <div>
      {token && (
        <ResetPasswordForm
          token={token}
          onResetComplete={() => {
            localStorage.removeItem("tempToken");
            router.push("/login");
          }}
        />
      )}
    </div>
  );
}
