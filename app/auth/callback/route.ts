import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOwner, safeNextPath } from "@/lib/auth";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Password recovery may land on update before role checks matter.
      if (next === "/reset-password/update") {
        return NextResponse.redirect(`${origin}${next}`);
      }

      if (!user || !isOwner(user)) {
        await supabase.auth.signOut();
        return NextResponse.redirect(`${origin}/login?error=owner_required`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback`);
}
