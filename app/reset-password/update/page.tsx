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
import { isOwner } from "@/lib/auth";
import { toUserMessage } from "@/lib/errors";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm_password: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type FormValues = z.infer<typeof schema>;

export default function ResetPasswordUpdatePage() {
  const router = useRouter();
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
    const { error } = await supabase.auth.updateUser({ password: values.password });
    if (error) {
      setFormError(toUserMessage(error, "Could not update password. Request a new reset link."));
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user && isOwner(user)) {
      router.replace("/app");
    } else {
      await supabase.auth.signOut();
      router.replace("/login");
    }
    router.refresh();
  }

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Enter a new password for your Sportiv owner account."
      footer={
        <>
          <Link href="/login" className="font-medium text-court hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="password">New password</Label>
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
          {isSubmitting ? "Saving…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}
