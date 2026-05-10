import { NextResponse } from "next/server";
import { logInboundSms } from "@/server/services/sms";

export async function POST(request: Request) {
  const formData = await request.formData();
  const from = String(formData.get("From") ?? "");
  const to = String(formData.get("To") ?? "");
  const body = String(formData.get("Body") ?? "");
  const sid = String(formData.get("MessageSid") ?? "");

  const result = await logInboundSms({
    from,
    to,
    body,
    twilioMessageSid: sid || null,
  });

  if ("error" in result) {
    console.error("Inbound SMS log failed:", result.error);
  }

  return new NextResponse("<Response></Response>", {
    headers: { "Content-Type": "text/xml" },
  });
}
