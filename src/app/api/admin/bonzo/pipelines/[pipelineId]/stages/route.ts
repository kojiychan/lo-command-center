import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth/current-user";
import { getBonzoPipelineStages } from "@/server/services/bonzo";

export async function GET(
  _request: Request,
  { params }: { params: { pipelineId: string } },
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await getBonzoPipelineStages(params.pipelineId);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({
    pipeline: result.pipeline,
    stages: result.stages,
  });
}
