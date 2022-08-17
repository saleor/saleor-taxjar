import { fetchChannelsSettings } from "./metaHandlers";
import { TaxJarConfig } from "./types";

export const getTaxJarConfig = async (
  saleorDomain: string,
  channelSlug: string
) => {
  const settings = await fetchChannelsSettings(saleorDomain, [channelSlug]);

  type ConfigurationPayloadKey = keyof typeof settings;
  const channelKey = channelSlug as ConfigurationPayloadKey;
  const channelSettings = settings?.[channelKey];

  if (!channelSettings?.apiKey) {
    return null;
  }

  const taxJarConfig: TaxJarConfig = {
    shipFrom: {
      fromCountry: channelSettings?.shipFromCountry || "",
      fromZip: channelSettings?.shipFromZip || "",
      fromState: channelSettings?.shipFromState || "",
      fromCity: channelSettings?.shipFromCity || "",
      fromStreet: channelSettings?.shipFromStreet || "",
    },
    apiKey: channelSettings.apiKey,
    sandbox: channelSettings?.sandbox || true,
  };
  return taxJarConfig;
};
