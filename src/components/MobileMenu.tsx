// src/components/MobileMenu.tsx
"use client";

import React from "react";
import { CalendarIcon } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

interface MobileMenuProps {
  menuOpen: boolean;
  setMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  babies: { id: string; baby_name: string }[];
  selectedBabyId: string | null;
  onSelectBaby: (babyId: string) => void;
  initialDob: string | null;
  onBirthDateChange: (newDob: string) => void;
  onAddBaby: () => void;
  babyId: string | null;
  authToken: string | null;
}

const API_BASE = process.env.NEXT_BACKEND_URL

export const MobileMenu: React.FC<MobileMenuProps> = ({
  menuOpen,
  setMenuOpen,
  babies,
  selectedBabyId,
  onSelectBaby,
  initialDob,
  onBirthDateChange,
  onAddBaby,
  babyId,
  authToken,
}) => {
  // Determine if we should show “Pick a new birth date”
  const isDobInFuture = (() => {
    if (!initialDob) return false;
    const dobDate = new Date(initialDob);
    const today = new Date();
    dobDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return dobDate > today;
  })();

  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [birthDate, setBirthDate] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Whenever the selected baby changes, clear the local birthDate
    setBirthDate(null);
  }, [selectedBabyId]);

  function formatLocalDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const handleDateSelect = async (day: Date | undefined) => {
    if (!day || !babyId || !authToken) {
      setPopoverOpen(false);
      return;
    }

    const iso = formatLocalDate(day);
    setBirthDate(iso);
    setPopoverOpen(false);

    try {
      await fetch(`${API_BASE}/api/baby/${babyId}/birth-date`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ birthDate: iso }),
      });
      onBirthDateChange(iso);
    } catch (err) {
      console.error("Failed to update birth date:", err);
    }
  };

  // Compute date‐picker range: today → today+7
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 7);

  return (
    <div
      className={`fixed top-0 left-0 w-full bg-[rgba(10,10,10,0.8)] z-40 flex flex-col items-center justify-center transition-all duration-300 ease-in-out md:hidden ${
        menuOpen
          ? "h-screen opacity-100 pointer-events-auto"
          : "h-0 opacity-0 pointer-events-none"
      }`}
    >
      {/* Close “×” button */}
      <Button
        onClick={() => setMenuOpen(false)}
        className="absolute top-6 right-6 text-white text-3xl focus:outline-none cursor-pointer"
        aria-label="Close Menu"
      >
        &times;
      </Button>

      {/* Baby selector dropdown (if any babies exist) */}
      {babies.length > 0 && (
        <Select
          onValueChange={(val) => onSelectBaby(val)}
          value={selectedBabyId || ""}
        >
          <SelectTrigger className="cursor-pointer w-[180px] border-0 shadow-none">
            <div className="flex w-full items-center justify-between">
              {/* Static placeholder (always shown) */}
              <span
                className={`text-2xl font-semibold text-white my-4 transform transition-transform duration-300 ${
                  menuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
                }`}
              >
                Select a Baby
              </span>
              {/* Dropdown arrow will automatically appear on the right */}
            </div>
          </SelectTrigger>
          <SelectContent>
            {babies.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.baby_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Add Baby link */}
      <Link
        href="/add-baby"
        onClick={() => {
          onAddBaby();
          setMenuOpen(false);
        }}
        className={`pb-0 text-2xl font-semibold text-white my-4 transform transition-transform duration-300 ${
          menuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
        }`}
      >
        Add a Baby
      </Link>

      {/* Pick a new birth date if DOB is in the future */}
      {isDobInFuture && (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <span
              className={`cursor-pointer py-0 text-2xl font-semibold text-white my-4 transform transition-transform duration-300 ${
                menuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
              } flex items-center`}
            >
              <CalendarIcon className="mr-4 h-6 w-6" />
              Pick a new birth date
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 space-y-2" align="start">
            <Calendar
              mode="single"
              selected={birthDate ? new Date(birthDate) : undefined}
              onSelect={handleDateSelect}
              disabled={{ before: today, after: maxDate }}
              fromMonth={today}
              toMonth={maxDate}
            />
          </PopoverContent>
        </Popover>
      )}

      {/* “Administered” link (include babyId as query param) */}
      {selectedBabyId && (
        <Link
          href={`/administered?babyId=${selectedBabyId}`}
          onClick={() => setMenuOpen(false)}
          className={`py-0 text-2xl font-semibold text-white my-4 transform transition-transform duration-300 ${
            menuOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"
          }`}
        >
          Administered
        </Link>
      )}
    </div>
  );
};
