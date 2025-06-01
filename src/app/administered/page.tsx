// /app/administered/page.tsx
"use client";

import { Suspense } from "react";
import AdministeredPageContent from "./AdministeredPageContent";

export const dynamic = "force-dynamic";

export default function AdministeredPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <AdministeredPageContent />
    </Suspense>
  );
}
