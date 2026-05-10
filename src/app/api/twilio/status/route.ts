import { NextResponse } from "next/server";
import { updateSmsStatusByTwilioSid } from "@/server/services/sms";

export async function POST(request: Request) {
  const formData = await request.formData();
  const sid = String(formData.get("MessageSid") ?? "");
  const status = String(formData.get("MessageStatus") ?? formData.get("SmsStatus") ?? "");
  const errorCode = String(formData.get("ErrorCode") ?? "") || null;
  const errorMessage = String(formData.get("ErrorMessage") ?? "") || null;

  if (sid && status) {
    await updateSmsStatusByTwilioSid({ sid, status, errorCode, errorMessage });
  }

  return NextResponse.json({ ok: true });
}
