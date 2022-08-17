import {
  FetchAppMetafieldsDocument,
  FetchAppMetafieldsQuery,
  FetchAppMetafieldsQueryVariables,
  UpdateAppMetadataDocument,
  UpdateAppMetadataMutation,
  UpdateAppMetadataMutationVariables,
} from "../../generated/graphql";
import { getAuthToken } from "../../lib/environment";
import { createClient } from "../../lib/graphql";
import { withJWTVerified, withSaleorDomainMatch } from "../../lib/middlewares";

import {
  prepareMetadataFromRequest,
  prepareResponseFromMetadata,
  validateConfigurationBeforeSave,
} from "@/backend/metaHandlers";
import { ConfigurationPayload } from "@/types/api";
import { SALEOR_DOMAIN_HEADER } from "@saleor/app-sdk/const";
import { graphQLUrl } from "@saleor/app-sdk/urls";
import { Handler } from "retes";
import { toNextHandler } from "retes/adapter";
import { Response } from "retes/response";

const handler: Handler = async (request) => {
  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER];

  const client = createClient(
    graphQLUrl(saleorDomain),
    async () => await Promise.resolve({ token: getAuthToken() })
  );

  let privateMetadata;
  const channelQuery = request.params.channel;
  const channels =
    typeof channelQuery === "string" ? [channelQuery] : channelQuery;
  switch (request.method!) {
    case "GET":
      if (!channels?.length) {
        return Response.BadRequest({
          success: false,
          error: { message: "Query param 'channel' is required" },
        });
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
      if (privateMetadata) {
        return Response.OK({
          success: true,
          data: prepareResponseFromMetadata(privateMetadata, channels, true),
        });
      } else {
        return Response.BadRequest({
          success: false,
          error: { message: "Unable to fetch app configuration." },
        });
      }
    case "POST":
      if (!channels?.length) {
        return Response.BadRequest({
          success: false,
          error: { message: "Query param 'channel' is required" },
        });
      }

      const appId = (
        await client
          .query<FetchAppMetafieldsQuery>(FetchAppMetafieldsDocument)
          .toPromise()
      ).data?.app?.id;

      if (!appId) {
        return Response.BadRequest({
          success: false,
          error: { message: "Unable to fetch app id." },
        });
      }
      const currentPrivateMetadata = (
        await client
          .query<FetchAppMetafieldsQuery, FetchAppMetafieldsQueryVariables>(
            FetchAppMetafieldsDocument,
            {
              keys: channels,
            }
          )
          .toPromise()
      ).data?.app?.privateMetafields;
      const currentChannelsConfigurations = currentPrivateMetadata
        ? prepareResponseFromMetadata(currentPrivateMetadata, channels, false)
        : null;

      const updatedChannelsConfiguration: ConfigurationPayload = JSON.parse(
        request.body as unknown as string
      ).data;
      const validConfigData = validateConfigurationBeforeSave(
        updatedChannelsConfiguration
      );
      if (!validConfigData.isValid) {
        return Response.BadRequest({
          success: false,
          error: { message: validConfigData.message },
        });
      }

      privateMetadata = (
        await client
          .mutation<
            UpdateAppMetadataMutation,
            UpdateAppMetadataMutationVariables
          >(UpdateAppMetadataDocument, {
            id: appId,
            input: prepareMetadataFromRequest(
              updatedChannelsConfiguration,
              currentChannelsConfigurations
            ),
            keys: channels,
          })
          .toPromise()
      ).data?.updatePrivateMetadata?.item?.privateMetafields!;

      if (privateMetadata) {
        return Response.OK({
          success: true,
          data: prepareResponseFromMetadata(privateMetadata, channels, true),
        });
      } else {
        return Response.BadRequest({
          success: false,
          error: { message: "Unable to fetch app configuration." },
        });
      }
    default:
      return Response.MethodNotAllowed();
  }
};

export default toNextHandler([withSaleorDomainMatch, withJWTVerified, handler]);
