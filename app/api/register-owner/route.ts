import { NextResponse } from "next/server";
import { z } from "zod";
import { getPublicSupabaseEnv } from "@/lib/supabase/env";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  business_name: z.string().min(1),
});

/**
 * Server proxy for owner signup.
 * Keeps OWNER_REGISTER_SECRET off the client while calling register-owner.
 */
export async function POST(request: Request) {
  const supabaseEnv = getPublicSupabaseEnv();
  if (!supabaseEnv.ok) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const registerSecret = process.env.OWNER_REGISTER_SECRET?.trim();
  if (!registerSecret) {
    return NextResponse.json(
      { error: "Owner registration is not configured" },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration details" },
      { status: 400 },
    );
  }

  const upstream = await fetch(
    `${supabaseEnv.url}/functions/v1/register-owner`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseEnv.anonKey}`,
        apikey: supabaseEnv.anonKey,
        "x-owner-register-secret": registerSecret,
      },
      body: JSON.stringify({
        email: parsed.data.email.trim().toLowerCase(),
        password: parsed.data.password,
        full_name: parsed.data.full_name.trim(),
        business_name: parsed.data.business_name.trim(),
      }),
    },
  );

  const payload = (await upstream.json().catch(() => ({}))) as {
    error?: string;
    user_id?: string;
    role?: string;
    email?: string;
  };

  if (!upstream.ok) {
    const message =
      typeof payload.error === "string" && payload.error
        ? payload.error
        : "Registration failed";
    // Never echo Unauthorized details that hint at secret config to the client
    // when the secret mismatch is our fault; map 401 from missing/wrong secret
    // only when upstream rejects — if our secret is set, upstream 401 usually
    // means Edge secret mismatch (ops). Still return a safe generic message
    // for 401 so we don't leak "Unauthorized" as the only clue in production UI.
    if (upstream.status === 401) {
      return NextResponse.json(
        { error: "Registration is temporarily unavailable" },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: message }, { status: upstream.status });
  }

  return NextResponse.json({
    user_id: payload.user_id,
    role: payload.role,
    email: payload.email,
  });
}
