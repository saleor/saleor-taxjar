import { MetadataInput } from "@/generated/graphql";
import { ConfigurationMetadata, ConfigurationPayload } from "@/types/api";
import { decryptConfiguration, encryptConfiguration } from "./encryption";

export const prepareMetadataFromRequest = (
  input: ConfigurationPayload
): MetadataInput[] =>
  Object.entries(input).map(([channelID, configuration]) => {
    const encryptedConfiguration = encryptConfiguration(configuration);

    return { key: channelID, value: JSON.stringify(encryptedConfiguration) };
  });

export const prepareResponseFromMetadata = (
  input: ConfigurationMetadata,
  channelsIds: string[],
  obfuscateEncryptedData: boolean
): ConfigurationPayload => {
  let config: ConfigurationPayload = {};
  if (!channelsIds) {
    return config;
  }
  for (const channelId of channelsIds) {
    const item = input[channelId];
    const parsedConfiguration = item ? JSON.parse(item) : {};
    const decryptedConfiguration = decryptConfiguration(
      parsedConfiguration,
      obfuscateEncryptedData
    );
    config[channelId] = {
      active: decryptedConfiguration.active || false,
      apiKey: decryptedConfiguration.apiKey || "",
      sandbox: decryptedConfiguration.sandbox || true,
      shipFromCity: decryptedConfiguration.shipFromCity || "",
      shipFromCountry: decryptedConfiguration.shipFromCountry || "",
      shipFromState: decryptedConfiguration.shipFromState || "",
      shipFromStreet: decryptedConfiguration.shipFromStreet || "",
      shipFromZip: decryptedConfiguration.shipFromZip || "",
    };
  }
  return config;
};
