"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { optionalDomainPrefixSchema } from "@/domain/profiles";
import { webinarFormSchema } from "@/domain/webinars";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/server/auth/current-user";
import {
  createWebinarForUser,
  updateWebinarContentForUser,
} from "@/server/services/webinars";

function linesFromFormValue(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

const presenterSetupSchema = z.object({
  companyName: z.string().trim().optional(),
  domainPrefix: optionalDomainPrefixSchema,
  shortBio: z.string().trim().optional(),
  yearsExperience: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), "Years experience must be a whole number.")
    .transform((value) => (value === "" ? null : Number(value))),
  familiesHelped: z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), "Families helped must be a whole number.")
    .transform((value) => (value === "" ? null : Number(value))),
  totalLoanVolume: z.string().trim().optional(),
  specialtyFocus: z.string().trim().optional(),
  licenseStates: z.string().trim().optional(),
  reviews: z
    .array(
      z.object({
        reviewerName: z.string().trim(),
        reviewerContext: z.string().trim().optional(),
        reviewText: z.string().trim(),
        rating: z.union([z.coerce.number().int().min(1).max(5), z.literal("")]),
      }),
    )
    .length(3),
}).superRefine((value, ctx) => {
  value.reviews.forEach((review, index) => {
    const hasAnyReviewInput =
      review.reviewerName.length > 0 ||
      review.reviewText.length > 0 ||
      (review.reviewerContext?.length ?? 0) > 0;

    if (!hasAnyReviewInput) return;

    if (!review.reviewerName) {
      ctx.addIssue({
        code: "custom",
        path: ["reviews", index, "reviewerName"],
        message: `Review ${index + 1} needs a reviewer name, or leave it blank for now.`,
      });
    }

    if (review.reviewText.length < 20) {
      ctx.addIssue({
        code: "custom",
        path: ["reviews", index, "reviewText"],
        message: `Review ${index + 1} needs at least 20 characters, or leave it blank for now.`,
      });
    }
  });
});

const webinarEditSchema = z.object({
  webinar_id: z.string().uuid(),
  title: z.string().trim().min(3, "Webinar title is required."),
  description: z.string().trim().min(3, "Description is required."),
  starts_at: z.string().trim().min(1, "Date and time are required."),
  timezone: z.string().trim().min(1, "Timezone is required."),
  join_url: z.string().trim().url("Join link must be a valid URL."),
  cta_text: z.string().trim().optional(),
  headline: z.string().trim().min(3, "Headline is required."),
  subheadline: z.string().trim().min(3, "Subheadline is required."),
  hero_bullets: z.array(z.string().min(1)).min(1, "Hero bullet points are required."),
  agenda_items: z.array(z.string().min(1)).min(1, "Agenda is required."),
  button_text: z.string().trim().min(2, "Button text is required."),
  meta_pixel_id: z
    .union([
      z.string().trim().regex(/^\d{5,30}$/, "Meta Pixel ID should be 5-30 digits."),
      z.literal(""),
    ])
    .optional(),
});

function optionalText(value: string | undefined) {
  const text = value?.trim() ?? "";
  return text.length > 0 ? text : null;
}

function parseReviewsFromFormData(formData: FormData) {
  return [1, 2, 3].map((idx) => ({
    reviewerName: String(formData.get(`reviewer_name_${idx}`) ?? ""),
    reviewerContext: String(formData.get(`reviewer_context_${idx}`) ?? ""),
    reviewText: String(formData.get(`review_text_${idx}`) ?? ""),
    rating: String(formData.get(`rating_${idx}`) ?? ""),
  }));
}

function completedReviews(
  reviews: Array<{
    reviewerName: string;
    reviewerContext?: string;
    reviewText: string;
    rating: number | "";
  }>,
) {
  return reviews.filter(
    (review) => review.reviewerName.trim().length > 0 && review.reviewText.trim().length >= 20,
  );
}

function imageExtension(contentType: string) {
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  return "jpg";
}

function getProfileImageFile(formData: FormData) {
  const value = formData.get("profile_image_file");
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}

async function uploadPresenterImage(userId: string, file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxSizeBytes = 5 * 1024 * 1024;

  if (!allowedTypes.includes(file.type)) {
    return { error: "Upload a JPG, PNG, WebP, or GIF profile image." };
  }

  if (file.size > maxSizeBytes) {
    return { error: "Profile image must be 5MB or smaller." };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Profile image could not be uploaded because the service role key is missing." };
  }

  const path = `${userId}/headshot-${Date.now()}.${imageExtension(file.type)}`;
  const { error } = await admin.storage
    .from("profile-images")
    .upload(path, file, { contentType: file.type, upsert: true });

  if (error) {
    return { error: error.message ?? "Could not upload profile image." };
  }

  const { data } = admin.storage.from("profile-images").getPublicUrl(path);
  return { publicUrl: data.publicUrl };
}

async function savePresenterSetup(userId: string, formData: FormData) {
  const parsed = presenterSetupSchema.safeParse({
    companyName: String(formData.get("company_name") ?? ""),
    domainPrefix: String(formData.get("domain_prefix") ?? ""),
    shortBio: String(formData.get("short_bio") ?? ""),
    yearsExperience: String(formData.get("years_experience") ?? ""),
    familiesHelped: String(formData.get("families_helped") ?? ""),
    totalLoanVolume: String(formData.get("total_loan_volume") ?? ""),
    specialtyFocus: String(formData.get("specialty_focus") ?? ""),
    licenseStates: String(formData.get("license_states") ?? ""),
    reviews: parseReviewsFromFormData(formData),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check your presenter setup." };
  }

  const imageFile = getProfileImageFile(formData);
  const imageResult = imageFile ? await uploadPresenterImage(userId, imageFile) : null;
  if (imageResult && "error" in imageResult) {
    return { error: imageResult.error };
  }

  const admin = createAdminClient();
  if (!admin) {
    return { error: "Server is missing the Supabase service role key." };
  }

  const profileUpdate: {
    id: string;
    company_name: string | null;
    domain_prefix: string | null;
    short_bio: string | null;
    years_experience: number | null;
    families_helped: number | null;
    total_loan_volume: string | null;
    specialty_focus: string | null;
    license_states: string | null;
    profile_image_url?: string;
  } = {
    id: userId,
    company_name: optionalText(parsed.data.companyName),
    domain_prefix: parsed.data.domainPrefix,
    short_bio: optionalText(parsed.data.shortBio),
    years_experience: parsed.data.yearsExperience,
    families_helped: parsed.data.familiesHelped,
    total_loan_volume: optionalText(parsed.data.totalLoanVolume),
    specialty_focus: optionalText(parsed.data.specialtyFocus),
    license_states: optionalText(parsed.data.licenseStates),
  };

  if (imageResult && "publicUrl" in imageResult) {
    profileUpdate.profile_image_url = imageResult.publicUrl;
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(profileUpdate, { onConflict: "id" });

  if (profileError) {
    return { error: profileError.message };
  }

  const reviewsToSave = completedReviews(parsed.data.reviews);
  const filledOrders = reviewsToSave.map((_, index) => index + 1);

  if (reviewsToSave.length > 0) {
    const { error: upsertError } = await admin.from("testimonials").upsert(
      reviewsToSave.map((review, index) => ({
        user_id: userId,
        reviewer_name: review.reviewerName,
        reviewer_context: optionalText(review.reviewerContext),
        review_text: review.reviewText,
        rating: review.rating === "" ? 5 : review.rating,
        display_order: index + 1,
      })),
      { onConflict: "user_id,display_order" },
    );

    if (upsertError) {
      return { error: upsertError.message };
    }
  }

  const deleteQuery = admin.from("testimonials").delete().eq("user_id", userId);
  const { error: deleteError } =
    filledOrders.length > 0
      ? await deleteQuery.not("display_order", "in", `(${filledOrders.join(",")})`)
      : await deleteQuery;

  if (deleteError) {
    return { error: deleteError.message };
  }

  return { ok: true as const };
}

export async function createWebinar(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const rawSlug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();

  const parsed = webinarFormSchema.safeParse({
    template_type: String(formData.get("template_type") ?? ""),
    title,
    description: String(formData.get("description") ?? "").trim(),
    starts_at: String(formData.get("starts_at") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
    host_name: String(formData.get("host_name") ?? "").trim(),
    cta_text: String(formData.get("cta_text") ?? "").trim() || undefined,
    join_url: String(formData.get("join_url") ?? "").trim(),
    headline: String(formData.get("headline") ?? "").trim(),
    subheadline: String(formData.get("subheadline") ?? "").trim(),
    hero_bullets: linesFromFormValue(formData.get("hero_bullets")),
    agenda_items: linesFromFormValue(formData.get("agenda_items")),
    button_text: String(formData.get("button_text") ?? "").trim(),
    meta_pixel_id: String(formData.get("meta_pixel_id") ?? "").trim(),
    hero_image_url: "",
    slug: rawSlug,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
  }

  const result = await createWebinarForUser(user.id, parsed.data);
  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/webinars");
  revalidatePath("/dashboard");
  redirect("/webinars");
}

export async function completePresenterSetup(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const result = await savePresenterSetup(user.id, formData);
  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath("/settings");
  revalidatePath("/webinars/new");
  redirect("/webinars/new?setup=done");
}

export async function updateWebinarContent(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const webinarId = String(formData.get("webinar_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const headline = String(formData.get("headline") ?? "").trim();
  const buttonText = String(formData.get("button_text") ?? "").trim();

  if (!webinarId || title.length < 3 || headline.length < 3 || buttonText.length < 2) {
    return { error: "Title, headline, and button text are required." };
  }

  const contentUpdate = {
    title,
    description: String(formData.get("description") ?? "").trim() || null,
    ctaText: String(formData.get("cta_text") ?? "").trim() || null,
    headline,
    subheadline: String(formData.get("subheadline") ?? "").trim() || null,
    heroBullets: linesFromFormValue(formData.get("hero_bullets")),
    agendaItems: linesFromFormValue(formData.get("agenda_items")),
    buttonText,
    ...(formData.has("meta_pixel_id")
      ? { metaPixelId: String(formData.get("meta_pixel_id") ?? "").trim() || null }
      : {}),
  };

  const result = await updateWebinarContentForUser(user.id, webinarId, contentUpdate);

  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath(`/webinars/${webinarId}`);
  revalidatePath("/webinars");
  return { ok: true };
}

export async function updateWebinarDetails(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const parsed = webinarEditSchema.safeParse({
    webinar_id: String(formData.get("webinar_id") ?? ""),
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    starts_at: String(formData.get("starts_at") ?? ""),
    timezone: String(formData.get("timezone") ?? ""),
    join_url: String(formData.get("join_url") ?? ""),
    cta_text: String(formData.get("cta_text") ?? ""),
    headline: String(formData.get("headline") ?? ""),
    subheadline: String(formData.get("subheadline") ?? ""),
    hero_bullets: linesFromFormValue(formData.get("hero_bullets")),
    agenda_items: linesFromFormValue(formData.get("agenda_items")),
    button_text: String(formData.get("button_text") ?? ""),
    meta_pixel_id: String(formData.get("meta_pixel_id") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the webinar details." };
  }

  const result = await updateWebinarContentForUser(user.id, parsed.data.webinar_id, {
    title: parsed.data.title,
    description: parsed.data.description,
    startsAt: parsed.data.starts_at,
    timezone: parsed.data.timezone,
    joinUrl: parsed.data.join_url,
    ctaText: parsed.data.cta_text || null,
    headline: parsed.data.headline,
    subheadline: parsed.data.subheadline,
    heroBullets: parsed.data.hero_bullets,
    agendaItems: parsed.data.agenda_items,
    buttonText: parsed.data.button_text,
    metaPixelId: parsed.data.meta_pixel_id || null,
  });

  if ("error" in result) {
    return { error: result.error };
  }

  revalidatePath(`/webinars/${parsed.data.webinar_id}`);
  revalidatePath(`/webinars/${parsed.data.webinar_id}/edit`);
  revalidatePath("/webinars");
  return { ok: true as const };
}
