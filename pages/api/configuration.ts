import { NextApiHandler } from "next";

import { createClient } from "../../lib/graphql";
import { domainMiddleware, jwtVerifyMiddleware } from "../../lib/middlewares";
import MiddlewareError from "../../utils/MiddlewareError";
import { getAuthToken } from "../../lib/environment";
import {
  UpdateAppMetadataDocument,
  UpdateAppMetadataMutation,
  MetadataItem,
  MetadataInput,
  ChannelsQuery,
  ChannelsDocument,
  ChannelDataFragment,
  FetchAppMetafieldsQuery,
  FetchAppMetafieldsDocument,
  FetchAppMetafieldsQueryVariables,
  UpdateAppMetadataMutationVariables,
} from "../../generated/graphql";

type ConfigurationField = {
  key: string;
  value: string | boolean;
  label: string;
  type: "TEXT" | "BOOLEAN";
};

type ConfigurationPayloadShipFrom = {
  fromCountry: string;
  fromZip: string;
  fromCity: string;
  fromStreet: string;
  fromState: string;
};

type ChannelConfigurationPayload = {
  apiKey: string;
  active: boolean;
  sandbox: boolean;
  shipFrom: ConfigurationPayloadShipFrom;
};

type ConfigurationPayload = {
  [channelID in string]: ChannelConfigurationPayload;
};

type ConfigurationMetadata = {
  [channelID in string]: string;
};

const prepareMetadataFromRequest = (
  input: ConfigurationPayload
): MetadataInput[] => {
  let response: MetadataInput[] = [];
  Object.entries(input).forEach(([channelID, settings]) => {
    response.push({ key: channelID, value: JSON.stringify(settings) });
  });
  return response;
};

const prepareResponseFromMetadata = (
  input: ConfigurationMetadata,
  channelsIds: string[]
): ConfigurationPayload => {
  let config: ConfigurationPayload = {};
  if (!channelsIds) {
    return config;
  }
  for (const channelId of channelsIds) {
    const item = input[channelId];
    const parsedConfiguration = item ? JSON.parse(item) : {};
    const shipFrom = parsedConfiguration.shipFrom;
    config[channelId] = {
      active: parsedConfiguration.active || false,
      apiKey: parsedConfiguration.apiKey || "",
      sandbox: parsedConfiguration.sandbox || true,
      shipFrom: {
        fromCity: shipFrom?.fromCity || "",
        fromCountry: shipFrom?.fromCountry || "",
        fromState: shipFrom?.fromState || "",
        fromStreet: shipFrom?.fromStreet || "",
        fromZip: shipFrom?.fromZip || "",
      },
    };
  }
  return config;
};

const handler: NextApiHandler = async (request, response) => {
  let saleorDomain: string;

  try {
    saleorDomain = domainMiddleware(request) as string;
    await jwtVerifyMiddleware(request);
  } catch (e: unknown) {
    const error = e as MiddlewareError;

    console.error(error);
    response.status(error.statusCode).json({
      success: false,
      error,
    });
    return;
  }
  const client = createClient(`https://${saleorDomain}/graphql/`, async () =>
    Promise.resolve({ token: getAuthToken() })
  );

  let privateMetadata;
  const channelQuery = request.query.channel;
  const channels =
    typeof channelQuery === "string" ? [channelQuery] : channelQuery;
  switch (request.method!) {
    case "GET":
      if (!channels?.length) {
        response.json({
          success: false,
          error: { message: "Query param 'channel' is required" },
        });
        return;
      }
      privateMetadata = (
        await client
          .query<FetchAppMetafieldsQuery, FetchAppMetafieldsQueryVariables>(
            FetchAppMetafieldsDocument,
            {
              keys: channels,
            }
          )
          .toPromise()
      ).data?.app?.privateMetafields;
      console.log("privateMetadata", privateMetadata);
      if (privateMetadata) {
        response.json({
          success: true,
          data: prepareResponseFromMetadata(privateMetadata, channels),
        });
      } else {
        response.json({
          success: false,
          error: { message: "Unable to fetch app configuration." },
        });
      }
      break;
    case "POST":
      if (!channels?.length) {
        response.json({
          success: false,
          error: { message: "Query param 'channel' is required" },
        });
        return;
      }

      const appId = (
        await client
          .query<FetchAppMetafieldsQuery>(FetchAppMetafieldsDocument)
          .toPromise()
      ).data?.app?.id;

      if (!appId) {
        response.json({
          success: false,
          error: { message: "Unable to fetch app id." },
        });
        return;
      }

      privateMetadata = (
        await client
          .mutation<
            UpdateAppMetadataMutation,
            UpdateAppMetadataMutationVariables
          >(UpdateAppMetadataDocument, {
            id: appId,
            input: prepareMetadataFromRequest(JSON.parse(request.body).data),
            keys: channels,
          })
          .toPromise()
      ).data?.updatePrivateMetadata?.item?.privateMetafields!;

      if (privateMetadata) {
        response.json({
          success: true,
          data: prepareResponseFromMetadata(privateMetadata, channels),
        });
      } else {
        response.json({
          success: false,
          error: { message: "Unable to fetch app configuration." },
        });
      }
      break;
    default:
      response.status(405).json({
        success: false,
        error: { message: "Method not allowed." },
      });
  }
};

export default handler;
