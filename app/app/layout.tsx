import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/app-sidebar";
import { requireOwnerRole } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    requireOwnerRole(user);
  } catch {
    redirect("/login?error=owner_required");
  }

  const displayName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.business_name as string | undefined) ||
    user.email ||
    "Owner";

  return (
    <div className="bg-wash-scene flex min-h-screen">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="sr-only" aria-live="polite">
          Signed in as {displayName}
        </div>
        {children}
      </div>
    </div>
  );
}
