import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { sendSms } from "@/server/services/sms";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { to?: string; body?: string }
    | null;

  if (!body?.to) {
    return NextResponse.json({ error: "Provide `to` in the JSON body." }, { status: 400 });
  }

  const result = await sendSms({
    userId: user.id,
    to: body.to,
    body: body.body ?? "LO Command Center test SMS.",
  });

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ ok: true, sid: result.sid ?? null });
}
