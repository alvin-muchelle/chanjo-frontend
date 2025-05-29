// src/components/Navbar.tsx
"use client";

import React, { useState, useEffect } from "react";
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
import { MobileMenu } from "@/components/MobileMenu";

interface Baby {
  id: string;
  baby_name: string;
  date_of_birth: string;
}

interface NavbarProps {
  userName: string;
  babies: Baby[];
  selectedBabyId: string | null;
  onSelectBaby: (babyId: string) => void;
  initialDob: string | null;
  onAddBaby: () => void;
  isAdding: boolean;
  babyId: string | null;
  authToken: string | null;
  onBirthDateChange: (newDob: string) => void;
}

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL
export const Navbar: React.FC<NavbarProps> = ({
  userName,
  babies,
  selectedBabyId,
  onSelectBaby,
  initialDob,
  onAddBaby,
  babyId,
  authToken,
  onBirthDateChange,
}) => {
  const [birthDate, setBirthDate] = useState<string | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
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

  const isDobInFuture = (() => {
    if (!initialDob) return false;
    const dobDate = new Date(initialDob);
    const today = new Date();
    dobDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return dobDate > today;
  })();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today);
  maxDate.setDate(today.getDate() + 7);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-5xl mx-auto flex items-center h-16 px-4">
        {/* Left: “Hello, {userName}!” */}
        <div className="flex-shrink-0">
          <h1 className="text-lg font-semibold">Hello, {userName}!</h1>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Hamburger (small screens only) */}
        <div
          className="w-7 h-5 relative cursor-pointer z-40 md:hidden text-foreground"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          &#9776;
        </div>

        {/* Desktop‐only controls */}

        <div className="px-4 hidden md:flex items-center space-x-4">
          {/* Select a Baby */}
          {babies.length > 0 && (
            <Select
              onValueChange={(val) => onSelectBaby(val)}
              value={selectedBabyId || ""}
            >
              <SelectTrigger className="w-[150px] border-2">
                <div className="flex w-full items-center justify-between">
                  {/* Static placeholder (always shown) */}
                  <span className="font-bold bg-transparent border-none cursor-pointer text-current border-0 p-0">
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

          {/* Add a Baby */}
          <Link
            href="/add-baby"
            className="font-bold p-0 bg-transparent border-none cursor-pointer text-current hover:text-gray-600"
          >
            Add a Baby
          </Link>

          {/* Pick a new birth date */}
          {isDobInFuture && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <span
                  className="max-w-xs w-[220px] flex items-center justify-start text-left font-bold cursor-pointer hover:bg-accent/90 px-3 py-2 rounded-md transition-colors"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
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

          {/* Administered */}
          {selectedBabyId && (
            <Link
              className="font-bold p-0 bg-transparent border-none cursor-pointer text-current hover:text-gray-600"
              href={`/administered?babyId=${selectedBabyId}`}>
              Administered
            </Link>
          )}
        </div>
      </div>

      {/* MobileMenu (small screens only) */}
      <MobileMenu
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        babies={babies.map((b) => ({ id: b.id, baby_name: b.baby_name }))}
        selectedBabyId={selectedBabyId}
        onSelectBaby={(id) => {
          onSelectBaby(id);
          setMenuOpen(false);
        }}
        initialDob={initialDob}
        onBirthDateChange={(d) => {
          onBirthDateChange(d);
          setMenuOpen(false);
        }}
        onAddBaby={() => {
          onAddBaby();
          setMenuOpen(false);
        }}
        babyId={babyId}
        authToken={authToken}
      />
    </nav>
  );
};
