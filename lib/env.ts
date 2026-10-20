/**
 * Typed, validated access to the application's environment variables.
 *
 * This module is the single source of truth for every variable the app reads.
 * Application code must import `env` (public) or `serverEnv` (server-only)
 * instead of touching `process.env` directly:
 *
 *  - `env` holds the `NEXT_PUBLIC_*` values. Next.js inlines those into both
 *    the server and the client bundle at build time, so they are safe to read
 *    from Client Components.
 *  - `serverEnv` holds values that are only read on the server. They are
 *    never inlined into the client bundle.
 *
 * The schemas below decide what a valid value looks like, what the fallback
 * is when a variable is unset, and which combinations of values are
 * contradictory. Validation runs once at module load, so a misconfigured
 * deployment fails while the app is being built or started — with a message
 * that names every problem at once — instead of failing later with
 * `undefined` somewhere in the UI.
 */

import { z } from "zod";

/** Networks the app can talk to. */
const STELLAR_NETWORKS = ["testnet", "mainnet", "standalone", "futurenet"] as const;

/** Which API implementation serves the data. */
const API_ADAPTERS = ["mock", "http"] as const;

const NETWORK_PASSPHRASES: Record<(typeof STELLAR_NETWORKS)[number], string> = {
  testnet: "Test SDF Network ; September 2015",
  mainnet: "Public Global Stellar Network ; September 2015",
  standalone: "Standalone Network ; September 2015",
  futurenet: "Test SDF Future Network ; October 2022",
};

const NETWORK_LABELS: Record<(typeof STELLAR_NETWORKS)[number], string> = {
  testnet: "Testnet",
  mainnet: "Mainnet",
  standalone: "Standalone",
  futurenet: "Futurenet",
};

/** Absolute http(s) URL, or the empty string when the variable is unset. */
const optionalUrl = z
  .string()
  .default("")
  .refine(
    (value) => {
      if (value === "") return true;
      try {
        const { protocol } = new URL(value);
        return protocol === "http:" || protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "must be an absolute http(s) URL" },
  );

const clientSchema = z
  .object({
    NEXT_PUBLIC_API_URL: optionalUrl,
    NEXT_PUBLIC_API_ADAPTER: z.enum(API_ADAPTERS).optional(),
    NEXT_PUBLIC_HEARTBEAT_URL: z.string().default("/"),
    NEXT_PUBLIC_STELLAR_NETWORK: z.enum(STELLAR_NETWORKS).default("testnet"),
    NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: z.string().optional(),
    NEXT_PUBLIC_STELLAR_NETWORK_LABEL: z.string().optional(),
    NEXT_PUBLIC_STARKNET_RPC_URL: optionalUrl,
    NEXT_PUBLIC_OFFRAMP_ENABLED: z.enum(["true", "false"]).default("true"),
    NEXT_PUBLIC_OFFRAMP_PARTNER: z.string().default("Bank transfer partner"),
  })
  .transform((values) => {
    const network = values.NEXT_PUBLIC_STELLAR_NETWORK;
    return {
      ...values,
      NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE:
        values.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? NETWORK_PASSPHRASES[network],
      NEXT_PUBLIC_STELLAR_NETWORK_LABEL:
        values.NEXT_PUBLIC_STELLAR_NETWORK_LABEL ?? NETWORK_LABELS[network],
    };
  });

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  ANALYZE: z.enum(["true", "false"]).optional(),
});

type ClientEnv = z.infer<typeof clientSchema>;
type ServerEnv = z.infer<typeof serverSchema>;


/**
 * The adapter is derived from the variables instead of being read at each
 * call site, so the two API layers in `lib/api` can never disagree about
 * which backend is in use.
 *
 *  - `NEXT_PUBLIC_API_ADAPTER` wins when it is set.
 *  - Otherwise a configured `NEXT_PUBLIC_API_URL` implies the HTTP adapter,
 *    which is what the README documents.
 */
function resolveApiAdapter(
  adapter: ClientEnv["NEXT_PUBLIC_API_ADAPTER"],
  apiUrl: string,
): "http" | "mock" {
  return adapter ?? (apiUrl ? "http" : "mock");
}

/**
 * Checks that hold across variables. Each one describes a combination that
 * cannot work at runtime, so it is reported as a configuration error rather
 * than being silently corrected.
 */
function checkConsistency(values: ClientEnv): string[] {
  const problems: string[] = [];
  const adapter = resolveApiAdapter(
    values.NEXT_PUBLIC_API_ADAPTER,
    values.NEXT_PUBLIC_API_URL,
  );

  if (adapter === "http" && values.NEXT_PUBLIC_API_URL === "") {
    problems.push(
      'NEXT_PUBLIC_API_URL is required when NEXT_PUBLIC_API_ADAPTER is "http"',
    );
  }

  if (adapter === "mock" && values.NEXT_PUBLIC_API_URL !== "") {
    problems.push(
      'NEXT_PUBLIC_API_URL is set but NEXT_PUBLIC_API_ADAPTER is "mock" — ' +
        'set NEXT_PUBLIC_API_ADAPTER to "http" or remove NEXT_PUBLIC_API_URL',
    );
  }

  return problems;
}

function formatProblems(problems: string[]): string {
  return [
    "Invalid environment configuration:",
    ...problems.map((problem) => `  • ${problem}`),
    "",
    "Copy .env.example to .env.local and fill in the missing values.",
  ].join("\n");
}

/** Turns a zod issue into "VARIABLE: what is wrong with it". */
function formatIssues(issues: readonly z.core.$ZodIssue[]): string[] {
  return issues.map((issue) => {
    const name = issue.path.length > 0 ? issue.path.join(".") : "environment";
    return `${name}: ${issue.message}`;
  });
}

function parseClientEnv(): ClientEnv {
  const parsed = clientSchema.safeParse({
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_ADAPTER: process.env.NEXT_PUBLIC_API_ADAPTER,
    NEXT_PUBLIC_HEARTBEAT_URL: process.env.NEXT_PUBLIC_HEARTBEAT_URL,
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
    NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
    NEXT_PUBLIC_STELLAR_NETWORK_LABEL: process.env.NEXT_PUBLIC_STELLAR_NETWORK_LABEL,
    NEXT_PUBLIC_STARKNET_RPC_URL: process.env.NEXT_PUBLIC_STARKNET_RPC_URL,
    NEXT_PUBLIC_OFFRAMP_ENABLED: process.env.NEXT_PUBLIC_OFFRAMP_ENABLED,
    NEXT_PUBLIC_OFFRAMP_PARTNER: process.env.NEXT_PUBLIC_OFFRAMP_PARTNER,
  });

  if (!parsed.success) {
    throw new Error(formatProblems(formatIssues(parsed.error.issues)));
  }

  const problems = checkConsistency(parsed.data);
  if (problems.length > 0) {
    throw new Error(formatProblems(problems));
  }

  return parsed.data;
}

function parseServerEnv(): ServerEnv {
  const parsed = serverSchema.safeParse({
    NODE_ENV: process.env.NODE_ENV,
    ANALYZE: process.env.ANALYZE,
  });

  if (!parsed.success) {
    throw new Error(formatProblems(formatIssues(parsed.error.issues)));
  }

  return parsed.data;
}

const clientEnv = parseClientEnv();
const parsedServerEnv = parseServerEnv();

/**
 * Public environment. Every value here is a `NEXT_PUBLIC_*` variable (plus
 * `NODE_ENV`, which Next.js inlines into both bundles), so this object is
 * safe to use in Client Components.
 */
export const env = {
  ...clientEnv,
  NODE_ENV: parsedServerEnv.NODE_ENV,
  /** Which API implementation serves the data. */
  apiAdapter: resolveApiAdapter(
    clientEnv.NEXT_PUBLIC_API_ADAPTER,
    clientEnv.NEXT_PUBLIC_API_URL,
  ),
  /** Whether the off-ramp (crypto → bank) payout method is offered. */
  offRampEnabled: clientEnv.NEXT_PUBLIC_OFFRAMP_ENABLED === "true",
} as const;

/**
 * Server-only environment. These values are not inlined into the client
 * bundle, so this object must never be imported from a Client Component.
 */
export const serverEnv = {
  /** Set to "true" to have `next build` emit a bundle report. */
  ANALYZE: parsedServerEnv.ANALYZE === "true",
} as const;

export type Env = typeof env;
export type ServerEnvType = typeof serverEnv;
