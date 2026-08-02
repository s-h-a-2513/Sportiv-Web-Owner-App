"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { PageShell, SoftCard } from "@/components/ui/page";
import { Button, FormMessage, Input, Label } from "@/components/ui/form";
import { ThemeToggle } from "@/components/theme-toggle";
import { createClient } from "@/lib/supabase/client";
import {
  getOwnerAccount,
  updateOwnerAccount,
  uploadVerificationDoc,
  verificationLabel,
} from "@/lib/api/account";
import type { VerificationStatus } from "@/lib/types";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [verification, setVerification] = useState<VerificationStatus>("pending");
  const [signingOut, setSigningOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getOwnerAccount()
      .then(({ user, profile, email: authEmail }) => {
        setEmail(authEmail);
        setFullName(user?.full_name ?? "");
        setBusinessName(profile?.business_name ?? "");
        setVerification(profile?.verification_status ?? "pending");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load account"));
  }, []);

  async function onSave() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await updateOwnerAccount({
        full_name: fullName.trim(),
        business_name: businessName.trim() || null,
      });
      setMessage("Profile saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function onUpload(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadVerificationDoc(file);
      setMessage("Verification document uploaded. Status stays pending until reviewed.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <AppHeader title="Account" description="Profile, verification, theme, and session." />
      <PageShell>
        {message ? <FormMessage tone="success">{message}</FormMessage> : null}
        {error ? <FormMessage>{error}</FormMessage> : null}

        <SoftCard title="Profile" description="Updates users.full_name and owner_profiles.business_name.">
          <div className="mx-auto max-w-xl space-y-4">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="business_name">Business name</Label>
              <Input
                id="business_name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            <div className="neu-inset rounded-[20px] p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Email</p>
              <p className="mt-1 font-medium text-ink">{email || "—"}</p>
            </div>
            <div className="neu-inset rounded-[20px] p-4">
              <p className="text-xs uppercase tracking-wide text-muted">Verification</p>
              <p className="mt-1 font-medium text-ink">{verificationLabel(verification)}</p>
            </div>
            <Button type="button" onClick={() => void onSave()} disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </div>
        </SoftCard>

        <SoftCard
          title="Verification documents"
          description="Upload to the private owner-verification bucket."
        >
          <Label htmlFor="verification">Upload ID / business proof</Label>
          <Input
            id="verification"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            disabled={uploading}
            onChange={(e) => void onUpload(e.target.files)}
          />
        </SoftCard>

        <SoftCard title="Appearance" description="Switch between light and dark mode.">
          <ThemeToggle />
        </SoftCard>

        <SoftCard title="Support" description="Need help getting live?">
          <a href="mailto:support@sportiv.app" className="text-sm font-medium text-court hover:underline">
            support@sportiv.app
          </a>
        </SoftCard>

        <SoftCard title="Session" description="Sign out of the owner dashboard on this device.">
          <Button type="button" variant="secondary" onClick={signOut} disabled={signingOut}>
            {signingOut ? "Signing out…" : "Sign out"}
          </Button>
        </SoftCard>
      </PageShell>
    </>
  );
}
