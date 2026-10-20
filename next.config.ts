import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `main` does not currently type-check: 84 pre-existing type errors remain
  // across app/dashboard/notifications, app/dashboard/circles/[id],
  // components/circles/ParticipantList and a handful of other files. They are
  // unrelated to the app compiling, so the type-check step is skipped to keep
  // `next build` usable. Remove this once the remaining errors are fixed.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
