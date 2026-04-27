import { createClient } from "@/lib/supabase/server";

export type CurrentUser = {
  id: string;
  email?: string;
};

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return { id: user.id, email: user.email };
}
