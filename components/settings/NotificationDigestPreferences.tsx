"use client";

import { useState } from "react";
import { Clock } from "lucide-react";

type DigestFrequency = "instant" | "daily" | "weekly";

const FREQUENCIES: DigestFrequency[] = ["instant", "daily", "weekly"];

export default function NotificationDigestPreferences() {
  const [frequency, setFrequency] = useState<DigestFrequency>("daily");

  return (
    <section className="p-6 rounded-2xl bg-[var(--content)] border border-[var(--ov-10)] space-y-4">
      <h2 className="text-base font-bold font-sora text-[var(--text)] flex items-center gap-2">
        <Clock size={18} className="text-[#4B6B76]" aria-hidden="true" />
        <span>Notification Digest</span>
      </h2>
      <p className="text-xs text-[var(--muted)]">
        Choose how frequently you would like to receive summary digests of your activity.
      </p>
      <div className="flex gap-3" role="group" aria-label="Notification digest frequency">
        {FREQUENCIES.map((freq) => (
          <button
            key={freq}
            onClick={() => setFrequency(freq)}
            aria-pressed={frequency === freq}
            className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
              frequency === freq
                ? "bg-[#4B6B76] text-white"
                : "border border-[var(--ov-10)] text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {freq}
          </button>
        ))}
      </div>
    </section>
  );
}
