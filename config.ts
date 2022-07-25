import { ChannelConfigurationPayload } from "./types/api";

export const configurationEncryptedFields: Array<
  keyof ChannelConfigurationPayload
> = ["apiKey"];
