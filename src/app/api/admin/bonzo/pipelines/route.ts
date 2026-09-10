import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { getBonzoPipelines } from "@/server/services/bonzo";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getBonzoPipelines();
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ pipelines: result.pipelines });
}
