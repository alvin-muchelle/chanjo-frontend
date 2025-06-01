"use client";

import { Suspense } from "react";
import DashboardPageContent from "./DashboardPageContent";

export const dynamic = "force-dynamic";

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardPageContent />
    </Suspense>
  );
}
