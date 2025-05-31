// src/components/SignUpForm.tsx
"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

const emailSchema = z.object({
  email: z.string().email("Invalid. Please enter a valid email"),
});

interface Props {
  onSignupSuccess: (token: string) => void;
  onSwitchToLogin: () => void;
}

export function SignUpForm({ onSignupSuccess, onSwitchToLogin }: Props) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" },
  });

  const handleSendEmail = async (values: z.infer<typeof emailSchema>) => {
    setSending(true);
    setMessage("");
    console.log("API_BASE is:", API_BASE);
    try {
      const res = await fetch(`${API_BASE}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: values.email }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessageType("success");
        setMessage("Temporary password sent. Check your email.");
        onSignupSuccess(data.token);
      } else {
        setMessageType("error");
        // your API sometimes returns data.message or data.error
        setMessage(data.message || data.error || "Signup failed.");
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Error sending email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10">
      <h1 className="text-xl font-bold text-center mb-4">Sign Up</h1>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSendEmail)}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="you@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  We&apos;ll send you a temporary password to get started.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={sending}>
            {sending ? "Sending..." : "Send Temporary Password"}
          </Button>
        </form>
      </Form>

      {message && (
        <p
          className={
            `mt-4 text-center text-sm ` +
            (messageType === "error" ? "text-red-600" : "text-green-600")
          }
        >
          {message}
        </p>
      )}

      <p className="mt-4 text-center text-sm">
        Already have an account?{" "}
        <button
          onClick={onSwitchToLogin}
          className="underline text-blue-500 hover:text-blue-700"
        >
          Log in
        </button>
      </p>
    </div>
  );
}
