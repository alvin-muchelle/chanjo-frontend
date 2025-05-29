"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  babyName: z.string().min(1, "Baby name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female"], {
    errorMap: () => ({ message: "Gender is required" }),
  }),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm({
  token,
  onProfileComplete,
}: {
  token: string;
  onProfileComplete: () => void;
}) {
  // Compute minDate (two years ago) and maxDate (today + 7 days) once
  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();

    const maxDateObj = new Date();
    maxDateObj.setDate(today.getDate() + 7);
    const yyyyMax = maxDateObj.getFullYear();
    const mmMax = String(maxDateObj.getMonth() + 1).padStart(2, "0");
    const ddMax = String(maxDateObj.getDate()).padStart(2, "0");
    const max = `${yyyyMax}-${mmMax}-${ddMax}`;

    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const minY = twoYearsAgo.getFullYear();
    const minM = String(twoYearsAgo.getMonth() + 1).padStart(2, "0");
    const minD = String(twoYearsAgo.getDate()).padStart(2, "0");
    const min = `${minY}-${minM}-${minD}`;

    return { minDate: min, maxDate: max };
  }, []);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phoneNumber: "",
      babyName: "",
      dateOfBirth: "",
      gender: "Male",
    },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  // Local state for date‐picker popover
  const [localDob, setLocalDob] = useState<string>("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Keep localDob in sync with form’s dateOfBirth field
  useEffect(() => {
    const formDob = form.getValues("dateOfBirth");
    if (formDob !== localDob) {
      setLocalDob(formDob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch("dateOfBirth")]);

  function formatLocalDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setServerError(null);

      // (A) POST to /api/profile (this also creates a new baby under that mother)
      const res = await fetch(`${API_BASE}/api/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();

      if (!res.ok) {
        setServerError(data.error || "Something went wrong");
        return;
      }

      // We expect the server to return { message: "...", baby: { babyId, babyName, dateOfBirth, gender } }
      const newBaby = data.baby;
      if (!newBaby?.babyId) {
        console.error("No babyId returned from /api/profile");
        onProfileComplete();
        return;
      }

      const newBabyId: string = newBaby.babyId;

      // (B) Immediately initialize that baby’s administered list on the server
      await fetch(
        `${API_BASE}/api/baby/${newBabyId}/administered/init`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          // no body needed; the server will (a) set administered=[], (b) scan past vaccines
        }
      );

      // Finally, tell parent we’re done
      onProfileComplete();
    } catch (err) {
      setServerError("Network error. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h2 className="text-xl font-semibold mb-4">Complete Your Profile</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Full Name</FormLabel>
                <FormControl>
                  <input
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Jane Doe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Phone Number</FormLabel>
                <FormControl>
                  <input
                    className="border rounded px-2 py-1 w-full"
                    placeholder="0712345678"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="babyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Baby&apos;s Name</FormLabel>
                <FormControl>
                  <input
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Baby Doe"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal text-muted-foreground border-primary"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {localDob || "Select date of birth"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2 space-y-2" align="start">
                      <Calendar
                        mode="single"
                        selected={localDob ? new Date(localDob) : undefined}
                        onSelect={(day: Date | undefined) => {
                          if (!day) return;
                          const iso = formatLocalDate(day);
                          field.onChange(iso);
                          setLocalDob(iso);
                          setPopoverOpen(false);
                        }}
                        disabled={{
                          before: new Date(minDate),
                          after: new Date(maxDate),
                        }}
                        fromMonth={new Date(minDate)}
                        toMonth={new Date(maxDate)}
                      />
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <select
                    className="border rounded px-2 py-1 w-full"
                    {...field}
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {serverError && (
            <div className="text-red-600 text-sm mb-4 text-center">
              {serverError}
            </div>
          )}

          <div className="flex justify-center">
            <Button type="submit">Save Profile</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
