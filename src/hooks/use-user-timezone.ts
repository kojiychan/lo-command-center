"use client";

import { useEffect, useState } from "react";

export function useUserTimezone() {
  const [tz, setTz] = useState<string | null>(null);

  useEffect(() => {
    try {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setTz(resolved || null);
    } catch {
      setTz(null);
    }
  }, []);

  return tz;
}

