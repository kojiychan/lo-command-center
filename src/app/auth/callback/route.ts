import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");

  if (errorCode || errorDescription) {
    const resetErrorUrl = new URL("/forgot-password", origin);
    resetErrorUrl.searchParams.set("error", errorCode === "otp_expired" ? "expired" : "auth");
    return NextResponse.redirect(resetErrorUrl);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
