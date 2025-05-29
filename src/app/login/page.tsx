"use client";

import { LoginForm } from "@/components/LoginForm";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <div>
      <h1 className="text-2xl font-bold mt-6 mb-4 text-center">
        Welcome to Chanjo Chonjo!
      </h1>
      <h3 className="text-2xl font-semibold mt-6 mb-4 text-center">
        Track your babies&apos; vaccinations with ease
      </h3>
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
