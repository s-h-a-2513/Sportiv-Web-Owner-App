"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthShell } from "@/components/auth-shell";
import { Button, FieldError, FormMessage, Input, Label } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";
import { isOwner, safeNextPath } from "@/lib/auth";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));
  const urlError = searchParams.get("error");
  const [formError, setFormError] = useState<string | null>(
    urlError === "owner_required"
      ? "This account is not registered as a field owner."
      : urlError === "auth_callback"
        ? "Could not complete sign-in. Try again."
        : null,
  );

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
    const { data, error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setFormError("Sign-in failed. Check your email and password.");
      return;
    }

    if (!isOwner(data.user)) {
      await supabase.auth.signOut();
      setFormError("This account is not registered as a field owner.");
      return;
    }

    router.replace(next);
    router.refresh();
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Manage your courts, bookings, and revenue."
      footer={
        <>
          New owner?{" "}
          <Link href="/signup" className="font-medium text-court hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password" className="mb-0">
              Password
            </Label>
            <Link href="/reset-password" className="text-xs font-medium text-court hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
          <FieldError message={errors.password?.message} />
        </div>

        {formError ? <FormMessage>{formError}</FormMessage> : null}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-wash-scene flex min-h-screen items-center justify-center text-muted">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
