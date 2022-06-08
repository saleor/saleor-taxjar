export const appName = "Saleor TaxJar";

export const SALEOR_DOMAIN_HEADER = "saleor-domain";
export const SALEOR_EVENT_HEADER = "saleor-event";

export const isSsr = typeof window === "undefined";

export type EnvVar = "appDomain" | "appUrl";

export type EnvVars = Record<EnvVar, string>;

export const envVars: EnvVars = {
  appDomain: process.env.NEXT_PUBLIC_VERCEL_URL!,
  appUrl: `https://${process.env.NEXT_PUBLIC_VERCEL_URL!}`,
};
