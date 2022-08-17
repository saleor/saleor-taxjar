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

  const taxJarConfig: TaxJarConfig = {
    shipFrom: {
      fromCountry: channelSettings?.shipFromCountry || "",
      fromZip: channelSettings?.shipFromZip || "",
      fromState: channelSettings?.shipFromState || "",
      fromCity: channelSettings?.shipFromCity || "",
      fromStreet: channelSettings?.shipFromStreet || "",
    },
    apiKey: channelSettings?.apiKey || "",
    sandbox: channelSettings?.sandbox || true,
    active: channelSettings?.active || false,
  };
  return taxJarConfig;
};

export const taxJarConfigIsValidToUse = (taxJarConfig: TaxJarConfig) => {
    const defaultResponse = {
      isValid: true,
      status: 200,
      message: ""
    };
  
    if (!taxJarConfig.active) {
      console.log("TaxJar is not active.");
      return {
        ...defaultResponse,
        message: "TaxJar is not active.",
        isValid: false,
      };
    } else if (!taxJarConfig.apiKey) {
      console.log("TaxJar apiKey was not provided.");
  
      return {
        message: "TaxJar apiKey was not provided.",
        status: 404,
        isValid: false,
      };
    }
  
    return {
      ...defaultResponse,
      message: "",
    };
  };