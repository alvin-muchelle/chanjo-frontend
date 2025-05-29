// src/app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    // On first load, go to /signup
    router.replace("/signup");
  }, [router]);

  return null;
}
