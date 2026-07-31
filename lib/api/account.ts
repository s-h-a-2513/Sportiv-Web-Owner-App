import { createClient } from "@/lib/supabase/client";
import type { OwnerProfile, UserRow, VerificationStatus } from "@/lib/types";

function client() {
  return createClient();
}

export async function getOwnerAccount(): Promise<{
  user: UserRow | null;
  profile: OwnerProfile | null;
  email: string | null;
}> {
  const supabase = client();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { user: null, profile: null, email: null };

  const [{ data: user }, { data: profile }] = await Promise.all([
    supabase.from("users").select("*").eq("id", authUser.id).maybeSingle(),
    supabase.from("owner_profiles").select("*").eq("user_id", authUser.id).maybeSingle(),
  ]);

  return {
    user: user as UserRow | null,
    profile: profile as OwnerProfile | null,
    email: authUser.email ?? null,
  };
}

export async function updateOwnerAccount(input: {
  full_name?: string;
  business_name?: string | null;
}): Promise<void> {
  const supabase = client();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  if (input.full_name !== undefined) {
    const { error } = await supabase
      .from("users")
      .update({ full_name: input.full_name })
      .eq("id", user.id);
    if (error) throw error;

    await supabase.auth.updateUser({
      data: { full_name: input.full_name },
    });
  }

  if (input.business_name !== undefined) {
    const { error } = await supabase
      .from("owner_profiles")
      .update({ business_name: input.business_name })
      .eq("user_id", user.id);
    if (error) throw error;

    await supabase.auth.updateUser({
      data: { business_name: input.business_name },
    });
  }
}

export async function uploadVerificationDoc(file: File): Promise<string> {
  const supabase = client();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("owner-verification")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw error;
  return path;
}

export function verificationLabel(status: VerificationStatus | null | undefined): string {
  switch (status) {
    case "verified":
      return "Verified";
    case "rejected":
      return "Rejected";
    default:
      return "Pending";
  }
}
