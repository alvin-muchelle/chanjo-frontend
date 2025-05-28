// src/components/AddBabyForm.tsx
"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
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

import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

const API_BASE = process.env.NEXT_BACKEND_URL;

const babySchema = z.object({
  babyName: z.string().min(1, "Baby name is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["Male", "Female"], {
    errorMap: () => ({ message: "Gender is required" }),
  }),
});

type BabyFormValues = z.infer<typeof babySchema>;

export function AddBabyForm({
  token,
  onSuccess,
}: {
  token: string;
  onSuccess: () => void;
}) {
  const router = useRouter();

  //----------------------------------------------------------------
  // 1) Set up React Hook Form with explicit generic BabyFormValues.
  //    Note: defaultValues.gender is now "Male" instead of "".
  //----------------------------------------------------------------
  const form = useForm<BabyFormValues>({
    resolver: zodResolver(babySchema),
    defaultValues: {
      babyName: "",
      dateOfBirth: "",
      gender: "Male", // must be either "Male" or "Female"
    },
  });

  //----------------------------------------------------------------
  // 2) Compute min/max for the date-picker once
  //----------------------------------------------------------------
  const { minDate, maxDate } = useMemo(() => {
    const today = new Date();

    // max = today + 7 days
    const maxDateObj = new Date();
    maxDateObj.setDate(today.getDate() + 7);
    const yyyyMax = maxDateObj.getFullYear();
    const mmMax = String(maxDateObj.getMonth() + 1).padStart(2, "0");
    const ddMax = String(maxDateObj.getDate()).padStart(2, "0");
    const max = `${yyyyMax}-${mmMax}-${ddMax}`;

    // min = two years ago
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const minY = twoYearsAgo.getFullYear();
    const minM = String(twoYearsAgo.getMonth() + 1).padStart(2, "0");
    const minD = String(twoYearsAgo.getDate()).padStart(2, "0");
    const min = `${minY}-${minM}-${minD}`;

    return { minDate: min, maxDate: max };
  }, []);

  //----------------------------------------------------------------
  // 3) Local state for the date-popover
  //----------------------------------------------------------------
  const [localDob, setLocalDob] = useState<string>("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Keep localDob in sync with form’s dateOfBirth
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

  //----------------------------------------------------------------
  // 4) onSubmit must be typed explicitly as SubmitHandler<BabyFormValues>
  //----------------------------------------------------------------
  const onSubmit: SubmitHandler<BabyFormValues> = async (values) => {
    try {
      // (A) Create the new baby record
      const res = await fetch(`${API_BASE}/api/baby`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Failed to add baby:", data);
        return;
      }

      // Expect server to return { baby: { babyId, ... } }
      const newBabyId = data.baby?.babyId;
      if (!newBabyId) {
        console.error("No babyId returned from /api/baby");
        return;
      }

      // (B) Initialize that baby’s `administered` list on the server
      await fetch(`${API_BASE}/api/baby/${newBabyId}/administered/init`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      // Notify parent that we succeeded
      onSuccess();
    } catch (err) {
      console.error("AddBabyForm error:", err);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-4 p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Add New Baby</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Baby's Name */}
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

          {/* Date of Birth */}
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
                        onSelect={(day) => {
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

          {/* Gender (now using themed <Select> so it respects light/dark mode) */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <FormControl>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    defaultValue="Male"
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2">
            {/* Cancel → go back to /dashboard */}
            <Button
              variant="outline"
              onClick={() => {
                router.push("/dashboard");
              }}
            >
              Cancel
            </Button>

            {/* Submit */}
            <Button type="submit">Add Baby</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
