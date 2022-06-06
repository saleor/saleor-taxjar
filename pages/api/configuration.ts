import { NextApiHandler } from "next";

import { createClient } from "../../lib/graphql";
import { domainMiddleware, jwtVerifyMiddleware } from "../../lib/middlewares";
import MiddlewareError from "../../utils/MiddlewareError";
import { getAuthToken } from "../../lib/environment";
import {
  FetchAppMetadataDocument,
  FetchAppMetadataQuery,
  UpdateAppMetadataDocument,
  UpdateAppMetadataMutation,
  MetadataItem,
  MetadataInput,
  ChannelsQuery,
  ChannelsDocument,
  ChannelDataFragment
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
  input: MetadataItem[],
  channels?: ChannelDataFragment[]
): ConfigurationPayload => {
  let config: ConfigurationPayload = {};
  if (!channels){
    return config;
  }
  for (const channel of channels) {
    const item = input.find((item)=> item.key == channel.id)
    const parsedConfiguration = item? JSON.parse(item.value): {}
    const shipFrom = parsedConfiguration.shipFrom;
    config[channel.id] = {
      active: parsedConfiguration.active || false,
      apiKey: parsedConfiguration.apiKey || "",
      sandbox: parsedConfiguration.sandbox || true,
      shipFrom: {
        fromCity: shipFrom?.fromCity || "",
        fromCountry: shipFrom?.fromCountry|| "",
        fromState: shipFrom?.fromState|| "",
        fromStreet: shipFrom?.fromStreet|| "",
        fromZip: shipFrom?.fromZip|| "",
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
    response
      .status(error.statusCode)
      .json({ success: false, message: error.message });
    return;
  }
  const client = createClient(
    `https://${saleorDomain}/graphql/`,
    async () => Promise.resolve({ token: getAuthToken() })
  );

  let privateMetadata;
  let channels;
  switch (request.method!) {
    case "GET":
      privateMetadata = (
        await client
          .query<FetchAppMetadataQuery>(FetchAppMetadataDocument)
          .toPromise()
      ).data?.app?.privateMetadata;
      channels = await (
        await client.query<ChannelsQuery>(ChannelsDocument).toPromise()
      ).data?.channels;
      if (privateMetadata && channels) {
        response.json({
          success: true,
          data: prepareResponseFromMetadata(privateMetadata, channels),
        });
      } else {
        response.json({
          success: false,
          message: "Unable to fetch app configuration.",
        });
      }
      break;
    case "POST":
      const appId = (
        await client
          .query<FetchAppMetadataQuery>(FetchAppMetadataDocument)
          .toPromise()
      ).data?.app?.id;

      privateMetadata = (
        await client
          .mutation<UpdateAppMetadataMutation>(UpdateAppMetadataDocument, {
            id: appId,
            input: prepareMetadataFromRequest(request.body.data),
          })
          .toPromise()
      ).data?.updatePrivateMetadata?.item?.privateMetadata!;

      channels = await (
        await client.query<ChannelsQuery>(ChannelsDocument).toPromise()
      ).data?.channels;
      
      if (privateMetadata && channels) {
        response.json({
          success: true,
          data: prepareResponseFromMetadata(privateMetadata, channels),
        });
      } else {
        response.json({
          success: false,
          message: "Unable to fetch app configuration.",
        });
      }
      break;
    default:
      response
        .status(405)
        .json({ success: false, message: "Method not allowed." });
  }
};

export default handler;
