import "server-only";

export type BonzoPipeline = {
  id: string;
  name: string;
};

export type BonzoStage = {
  id: string;
  pipeline_id: string;
  name: string;
  order?: string | number | null;
  prospect_count?: string | number | null;
};

export type BonzoProspectInput = {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
};

type BonzoProspect = {
  id: string;
  email?: string | null;
  contact_information?: Array<{
    type?: string | null;
    content?: string | null;
  }> | null;
};

type BonzoFetchResult = { data: unknown } | { error: string; status?: number };

function bonzoConfig(): { token: string; baseUrl: string } | { error: string } {
  const token = process.env.BONZO_API_TOKEN;
  const baseUrl = process.env.BONZO_BASE_URL?.replace(/\/$/, "");

  if (!token || !baseUrl) {
    return { error: "Bonzo is not configured. Set BONZO_API_TOKEN and BONZO_BASE_URL." };
  }

  return { token, baseUrl };
}

function formBody(values: Record<string, string | null | undefined>) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    const text = value?.trim();
    if (text) body.append(key, text);
  }
  return body;
}

function dataArray(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "data" in value &&
    Array.isArray((value as { data?: unknown }).data)
  ) {
    return (value as { data: unknown[] }).data;
  }

  return [];
}

function dataObject(value: unknown) {
  if (value && typeof value === "object" && "data" in value) {
    const data = (value as { data?: unknown }).data;
    return data && typeof data === "object" && !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : null;
  }

  return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? String(value) : "";
}

function pipelineFromRecord(value: unknown): BonzoPipeline | null {
  const row = asRecord(value);
  if (!row) return null;

  const id = stringValue(row.id);
  const name = stringValue(row.name);
  return id && name ? { id, name } : null;
}

function stageFromRecord(value: unknown): BonzoStage | null {
  const row = asRecord(value);
  if (!row) return null;

  const id = stringValue(row.id);
  const name = stringValue(row.name);
  const pipelineId = stringValue(row.pipeline_id);

  return id && name
    ? {
        id,
        name,
        pipeline_id: pipelineId,
        order: stringValue(row.order) || null,
        prospect_count: stringValue(row.prospect_count) || null,
      }
    : null;
}

function prospectFromRecord(value: unknown): BonzoProspect | null {
  const row = asRecord(value);
  if (!row) return null;

  const id = stringValue(row.id);
  if (!id) return null;

  const contactInformation = Array.isArray(row.contact_information)
    ? row.contact_information
        .map((item) => asRecord(item))
        .filter(Boolean)
        .map((item) => ({
          type: stringValue(item?.type) || null,
          content: stringValue(item?.content) || null,
        }))
    : null;

  return {
    id,
    email: stringValue(row.email) || null,
    contact_information: contactInformation,
  };
}

async function bonzoFetch(path: string, init: RequestInit = {}): Promise<BonzoFetchResult> {
  const config = bonzoConfig();
  if ("error" in config) return { error: config.error };

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.token}`,
      ...init.headers,
    },
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "message" in payload
        ? String((payload as { message?: unknown }).message)
        : `Bonzo request failed with status ${response.status}.`;
    return { error: message, status: response.status };
  }

  return { data: payload };
}

export async function getBonzoPipelines() {
  const result = await bonzoFetch("/pipelines?no_paginate=true");
  if ("error" in result) return result;

  return {
    pipelines: dataArray(result.data)
      .map(pipelineFromRecord)
      .filter((pipeline): pipeline is BonzoPipeline => Boolean(pipeline)),
  };
}

export async function getBonzoPipeline(pipelineId: string) {
  const result = await bonzoFetch(`/pipelines/fetch/${encodeURIComponent(pipelineId)}`);
  if ("error" in result) return result;

  const pipeline = dataObject(result.data);
  const parsedPipeline = pipelineFromRecord(pipeline);
  const stages = Array.isArray(pipeline?.stages)
    ? pipeline.stages
        .map(stageFromRecord)
        .filter((stage): stage is BonzoStage => Boolean(stage))
        .sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0))
    : [];

  return {
    pipeline: parsedPipeline,
    stages,
  };
}

export async function getBonzoPipelineStages(pipelineId: string) {
  const result = await getBonzoPipeline(pipelineId);
  if ("error" in result) return result;

  return {
    pipeline: result.pipeline,
    stages: result.stages,
  };
}

export async function findBonzoProspectByEmail(email: string) {
  const query = email.trim().toLowerCase();
  if (!query) return { prospect: null };

  const result = await bonzoFetch(`/prospects?search=${encodeURIComponent(query)}&per_page=10&page=1`);
  if ("error" in result) return result;

  const prospect =
    dataArray(result.data)
      .map(prospectFromRecord)
      .find((item) => {
        const directEmail = item?.email?.trim().toLowerCase();
        const contactEmail = item?.contact_information?.some(
          (contact) =>
            contact.type?.toLowerCase() === "email" &&
            contact.content?.trim().toLowerCase() === query,
        );
        return directEmail === query || contactEmail;
      }) ?? null;

  return { prospect };
}

export async function createBonzoProspectInStage(
  stageId: string,
  prospect: BonzoProspectInput,
) {
  const body = formBody({
    first_name: prospect.firstName,
    last_name: prospect.lastName,
    email: prospect.email,
    phone: prospect.phone,
  });

  const result = await bonzoFetch(`/prospects/pipeline/${encodeURIComponent(stageId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if ("error" in result) return result;

  return {
    prospect: prospectFromRecord(dataObject(result.data)),
  };
}

export async function assignBonzoProspectToStage(stageId: string, prospectId: string) {
  const body = new URLSearchParams();
  body.append("prospects[]", prospectId);
  body.append("is_all", "false");

  const result = await bonzoFetch(`/pipeline-stages/${encodeURIComponent(stageId)}/assign`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if ("error" in result) return result;

  return { ok: true as const };
}

export async function syncRegistrantToBonzoStage(input: {
  webinarId: string;
  leadId: string;
  stageId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}) {
  if (!input.stageId) return { skipped: true as const };

  const existing = await findBonzoProspectByEmail(input.email);
  if ("error" in existing) return { error: existing.error };

  if (existing.prospect) {
    const assigned = await assignBonzoProspectToStage(input.stageId, existing.prospect.id);
    if ("error" in assigned) return assigned;
    return {
      ok: true as const,
      action: "assigned_existing" as const,
      prospectId: existing.prospect.id,
    };
  }

  const created = await createBonzoProspectInStage(input.stageId, {
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone,
  });
  if ("error" in created) return created;

  return {
    ok: true as const,
    action: "created" as const,
    prospectId: created.prospect?.id ?? null,
  };
}
