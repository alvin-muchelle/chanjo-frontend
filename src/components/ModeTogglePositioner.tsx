// src/components/ModeTogglePositioner.tsx
"use client";

import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/ModeToggle";

export function ModeTogglePositioner() {
  const pathname = usePathname();
  // if we’re on /dashboard or anything under /administered → push toggle down
  const isDeepPage =
    pathname === "/dashboard";

  // use top-20 on deep pages; otherwise top-5
  const topClass = isDeepPage ? "top-20" : "top-3";

  return (
    <div className={`fixed ${topClass} left-6 z-50`}>
      <ModeToggle />
    </div>
  );
}
