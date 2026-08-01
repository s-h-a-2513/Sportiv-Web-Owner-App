"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AuthShell } from "@/components/auth-shell";
import { Button, FieldError, FormMessage, Input, Label } from "@/components/ui/form";
import { createClient } from "@/lib/supabase/client";

const schema = z
  .object({
    full_name: z.string().min(1, "Full name is required"),
    business_name: z.string().min(1, "Business name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    setSuccess(false);

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      setFormError("Missing NEXT_PUBLIC_SUPABASE_URL");
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/register-owner`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        email: values.email,
        password: values.password,
        full_name: values.full_name,
        business_name: values.business_name,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
      user_id?: string;
    };

    if (!response.ok) {
      setFormError(payload.error ?? "Registration failed");
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (error) {
      setSuccess(true);
      setFormError(null);
      return;
    }

    router.replace("/app");
    router.refresh();
  }

  return (
    <AuthShell
      title="Create owner account"
      subtitle="Register your business and start listing courts."
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-court hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      {success ? (
        <div className="space-y-4 text-sm text-muted">
          <FormMessage tone="success">
            Account created. You can now{" "}
            <Link href="/login" className="font-medium text-court hover:underline">
              sign in
            </Link>
            .
          </FormMessage>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" autoComplete="name" {...register("full_name")} />
            <FieldError message={errors.full_name?.message} />
          </div>
          <div>
            <Label htmlFor="business_name">Business name</Label>
            <Input id="business_name" autoComplete="organization" {...register("business_name")} />
            <FieldError message={errors.business_name?.message} />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            <FieldError message={errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>
          <div>
            <Label htmlFor="confirm_password">Confirm password</Label>
            <Input
              id="confirm_password"
              type="password"
              autoComplete="new-password"
              {...register("confirm_password")}
            />
            <FieldError message={errors.confirm_password?.message} />
          </div>

          {formError ? <FormMessage>{formError}</FormMessage> : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
