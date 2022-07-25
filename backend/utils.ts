import { fetchChannelsSettings } from "./metaHandlers";
import { TaxJarConfig } from "./types";

export const getTaxJarConfig = async (
  saleorDomain: string,
  channelSlug: string
) => {
  // FIXME: this should be replaced by channel query,
  // when we will add support for tax sync subscription this can be also replaced
  const channelID = "Q2hhbm5lbDoy";
  const settings = await fetchChannelsSettings(saleorDomain, [channelID]);

  let channelSettings = null;
  if (settings) {
    type ConfigurationPayloadKey = keyof typeof settings;
    const channelKey = channelID as ConfigurationPayloadKey;
    channelSettings = settings[channelKey];
  }

  if (!channelSettings?.apiKey) {
    return null;
  }

  console.log(channelSettings);
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
