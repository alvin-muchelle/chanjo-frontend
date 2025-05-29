// src/app/layout.tsx
import "@/app/globals.css";
import React from "react";
import { ReactNode } from "react";

// 1) Keep this as a server component so that `metadata` can be exported
export const metadata = {
  title: "Chanjo Chonjo",
  description: "Vaccination tracker",
};

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProvider as CustomThemeProvider } from "@/components/ThemeProvider";

// 2) Import the client‐only wrapper
import { ModeTogglePositioner } from "@/components/ModeTogglePositioner";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <NextThemesProvider attribute="class" defaultTheme="system">
          <CustomThemeProvider defaultTheme="dark" storageKey="next-ui-theme">
            {/* 3) Render the toggle positioner (client side) */}
            <ModeTogglePositioner />

            {/* 4) Push page contents down by at least “pt-5” so that on non-dashboard pages
                  the toggle (top-5) doesn’t overlap. On /dashboard or /administered, the toggle
                  is top-20, so this padding still works. */}
            <div className="pt-6 px-6 max-w-5xl mx-auto">{children}</div>
          </CustomThemeProvider>
        </NextThemesProvider>
      </body>
    </html>
  );
}
