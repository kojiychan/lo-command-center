import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/server/services/email";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const to = String(body?.to ?? user.email ?? "").trim();
  if (!to) {
    return NextResponse.json({ error: "Missing `to` email address." }, { status: 400 });
  }

  const result = await sendEmail({
    userId: user.id,
    to,
    subject: "RealEstateWebinar test email",
    html: "<p>This is a test email from RealEstateWebinar.io.</p>",
    text: "This is a test email from RealEstateWebinar.io.",
    replyTo: user.email,
  });

  if ("error" in result) {
    console.error("Test email failed:", result.error);
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: result.id ?? null });
}
