/**
 * HTTP adapter — talks to a real backend.
 * Driven by NEXT_PUBLIC_API_URL; activated by NEXT_PUBLIC_API_ADAPTER=http.
 */

import type { ApiClient } from "./client";
import { env } from "@/lib/env";
import type { DiscoverCircle } from "@/data/circles";
import type { ContributionRecord } from "@/types/contribution";
import type { PayoutRecord } from "@/data/payouts";
import type { Notification } from "@/types/notification";

const BASE_URL = env.NEXT_PUBLIC_API_URL;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status} for ${path}`);
  }
  return res.json() as Promise<T>;
}

export const httpAdapter: ApiClient = {
  getCircles() {
    return get<DiscoverCircle[]>("/api/circles");
  },

  getCircle(id: string) {
    return get<DiscoverCircle | null>(`/api/circles/${id}`);
  },

  getContributions() {
    return get<ContributionRecord[]>("/api/contributions");
  },

  getPayouts() {
    return get<PayoutRecord[]>("/api/payouts");
  },

  getNotifications() {
    return get<Notification[]>("/api/notifications");
  },
};
