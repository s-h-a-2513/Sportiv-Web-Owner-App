import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";
import { isOwner } from "@/lib/auth";

export default async function HomePage() {
  const env = getPublicSupabaseEnv();
  if (!env.ok) {
    redirect("/setup");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user && isOwner(user)) {
    redirect("/app");
  }

  redirect("/login");
}
