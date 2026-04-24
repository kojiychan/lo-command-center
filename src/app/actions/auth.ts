"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ensureDefaultReminderTemplates } from "@/app/actions/reminders";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function signInWithPassword(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message } as { error: string };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await ensureDefaultReminderTemplates(user.id);
  }

  revalidatePath("/", "layout");

  const next = nextRaw.startsWith("/") ? nextRaw : "/dashboard";
  redirect(next);
}

export async function signUp(_prev: unknown, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: siteUrl ? `${siteUrl.replace(/\/$/, "")}/auth/callback` : undefined,
    },
  });

  if (error) {
    return { error: error.message, message: null };
  }

  revalidatePath("/", "layout");
  return {
    error: null,
    message:
      "Check your email to confirm your account, then sign in. If email confirmation is disabled in Supabase, you can sign in immediately.",
  };
}
