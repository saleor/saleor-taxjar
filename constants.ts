export const appName = "Saleor TaxJar";

export const isSsr = typeof window === "undefined";

export type ServerEnvVar = "settingsEncryptionSecret";

export type ServerEnvVars = Record<ServerEnvVar, string>;

export const serverEnvVars: ServerEnvVars = {
  settingsEncryptionSecret: process.env.SETTINGS_ENCRYPTION_SECRET!,
};
