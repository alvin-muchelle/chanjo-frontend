"use client";

import { LoginForm } from "@/components/LoginForm";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div>
      <LoginForm
        onLoginSuccess={(token: string, mustReset: boolean) => {
          localStorage.setItem("authToken", token);
          if (mustReset) {
            router.push("/reset");
          } else {
            router.push("/dashboard");
          }
        }}
        onSwitchToSignup={() => router.push("/signup")}
      />
    </div>
  );
}
