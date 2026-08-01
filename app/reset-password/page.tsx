"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthShell } from "@/components/auth-shell";
import { Button, FieldError, FormMessage, Input, Label } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    const supabase = createClient();
    const origin = window.location.origin;

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${origin}/login`,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    setSent(true);
  }

  return (
    <AuthShell
      title="Reset password"
      subtitle="We'll email you a link to choose a new password."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-court hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sent ? (
        <FormMessage tone="info">
          If an account exists for that email, a reset link is on its way.
        </FormMessage>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>

          {formError ? <FormMessage>{formError}</FormMessage> : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>

          <p className="text-center text-xs text-muted">
            Password update confirmation UI is a stub — wire the recovery session next.
          </p>
        </form>
      )}
    </AuthShell>
  );
}
