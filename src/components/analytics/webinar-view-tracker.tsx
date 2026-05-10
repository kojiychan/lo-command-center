"use client";

import { useEffect } from "react";
import { trackWebinarPageView } from "@/app/actions/analytics";

type Props = {
  webinarId: string;
  slug: string;
};

function getVisitorId() {
  const key = "lo_webinar_visitor_id";
  const existing = window.localStorage.getItem(key);
  if (existing) return existing;

  const id = window.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  window.localStorage.setItem(key, id);
  return id;
}

export function WebinarViewTracker({ webinarId, slug }: Props) {
  useEffect(() => {
    const sessionKey = `lo_webinar_viewed_${webinarId}`;
    if (window.sessionStorage.getItem(sessionKey)) {
      return;
    }

    window.sessionStorage.setItem(sessionKey, "1");
    const params = new URLSearchParams(window.location.search);

    void trackWebinarPageView({
      webinarId,
      slug,
      visitorId: getVisitorId(),
      referrer: document.referrer,
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
    });
  }, [slug, webinarId]);

  return null;
}
