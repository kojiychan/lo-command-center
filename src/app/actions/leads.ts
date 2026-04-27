"use server";

import { revalidatePath } from "next/cache";
import {
  followUpStatusSchema,
  leadStatusSchema,
  postWebinarSequenceSchema,
} from "@/domain/leads";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  addLeadNoteForUser,
  mockSendFollowUpForUser,
  runPostWebinarSequenceForUser,
  updateLeadFollowUpForUser,
  updateLeadStatusForUser,
} from "@/server/services/leads";
import type { FollowUpStatus, LeadStatus } from "@/types/database";

function revalidateLeadViews(webinarId: string) {
  revalidatePath(`/webinars/${webinarId}`);
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
}

export async function updateLeadStatus(leadId: string, status: LeadStatus) {
  const parsed = leadStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { error: "Invalid status" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const result = await updateLeadStatusForUser(leadId, parsed.data, user.id);
  if ("ok" in result && result.ok) {
    revalidateLeadViews(result.webinarId);
  }
  return "ok" in result && result.ok ? { ok: true } : result;
}

export async function updateLeadFollowUp(
  leadId: string,
  followUpStatus: FollowUpStatus,
) {
  const parsed = followUpStatusSchema.safeParse(followUpStatus);
  if (!parsed.success) {
    return { error: "Invalid follow-up status" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const result = await updateLeadFollowUpForUser(leadId, parsed.data, user.id);
  if ("ok" in result && result.ok) {
    revalidateLeadViews(result.webinarId);
  }
  return "ok" in result && result.ok ? { ok: true } : result;
}

export async function addLeadNote(leadId: string, body: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const result = await addLeadNoteForUser(leadId, body, user.id);
  if ("ok" in result && result.ok) {
    revalidatePath(`/webinars/${result.webinarId}`);
  }
  return "ok" in result && result.ok ? { ok: true } : result;
}

export async function mockSendFollowUp(leadId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const result = await mockSendFollowUpForUser(leadId, user.id);
  if ("ok" in result && result.ok) {
    revalidateLeadViews(result.webinarId);
  }
  return "ok" in result && result.ok ? { ok: true } : result;
}

export async function runPostWebinarSequence(
  leadId: string,
  sequence: unknown,
) {
  const parsed = postWebinarSequenceSchema.safeParse(sequence);
  if (!parsed.success) {
    return { error: "Invalid sequence" };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { error: "Unauthorized" };
  }

  const result = await runPostWebinarSequenceForUser(leadId, parsed.data, user.id);
  if ("ok" in result && result.ok) {
    revalidateLeadViews(result.webinarId);
  }
  return "ok" in result && result.ok ? { ok: true, sequence: result.sequence } : result;
}
