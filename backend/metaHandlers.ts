import { graphQLUrl } from "@saleor/app-sdk/urls";
import {
  FetchAppMetafieldsDocument,
  FetchAppMetafieldsQuery,
  FetchAppMetafieldsQueryVariables,
} from "../generated/graphql";
import { getAuthToken } from "../lib/environment";
import { createClient } from "../lib/graphql";

import { MetadataInput } from "@/generated/graphql";
import { ConfigurationMetadata, ConfigurationPayload } from "@/types/api";
import {
  decryptConfiguration,
  encryptConfiguration,
  PLACEHOLDER,
} from "./encryption";

export const prepareMetadataFromRequest = (
  input: ConfigurationPayload,
  currentChannelsConfigurations: ConfigurationPayload | null
): MetadataInput[] => {
  return Object.entries(input).map(([channelID, configuration]) => {
    let currentConfiguration;
    if (currentChannelsConfigurations) {
      currentConfiguration = currentChannelsConfigurations[channelID];
    }
    if (
      currentConfiguration?.apiKey &&
      configuration.apiKey.startsWith(PLACEHOLDER)
    ) {
      configuration.apiKey = currentConfiguration.apiKey;
    }
    const encryptedConfiguration = encryptConfiguration(configuration);

    return { key: channelID, value: JSON.stringify(encryptedConfiguration) };
  });
};
export const prepareResponseFromMetadata = (
  input: ConfigurationMetadata,
  channelsIds: string[],
  obfuscateEncryptedData: boolean
): ConfigurationPayload => {
  if (!channelsIds) {
    return {};
  }

  return channelsIds.reduce((config, channelId) => {
    const item = input[channelId];
    const parsedConfiguration = item ? JSON.parse(item) : {};
    const {
      active,
      apiKey,
      sandbox,
      shipFromCity,
      shipFromCountry,
      shipFromState,
      shipFromStreet,
      shipFromZip,
    } = decryptConfiguration(parsedConfiguration, obfuscateEncryptedData);
    return {
      ...config,
      [channelId]: {
        active: active || false,
        apiKey: apiKey || "",
        sandbox: sandbox || true,
        shipFromCity: shipFromCity || "",
        shipFromCountry: shipFromCountry || "",
        shipFromState: shipFromState || "",
        shipFromStreet: shipFromStreet || "",
        shipFromZip: shipFromZip || "",
      },
    };
  }, {} as ConfigurationPayload);
};

export const fetchChannelsSettings = async (
  saleorDomain: string,
  channelIds: string[]
) => {
  const saleorUrl = graphQLUrl(saleorDomain);
  const client = createClient(saleorUrl, async () =>
    Promise.resolve({ token: getAuthToken() })
  );

  const privateMetadata = (
    await client
      .query<FetchAppMetafieldsQuery, FetchAppMetafieldsQueryVariables>(
        FetchAppMetafieldsDocument,
        {
          keys: channelIds,
        }
      )
      .toPromise()
  ).data?.app?.privateMetafields;

  let data = null;
  if (privateMetadata) {
    data = prepareResponseFromMetadata(privateMetadata, channelIds, false);
  }
  return data;
};
