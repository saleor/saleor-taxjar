import { NextApiHandler } from "next";

import { createClient } from "../../lib/graphql";
import { domainMiddleware, jwtVerifyMiddleware } from "../../lib/middlewares";
import MiddlewareError from "../../utils/MiddlewareError";
import { getAuthToken } from "../../lib/environment";
import {
  UpdateAppMetadataDocument,
  UpdateAppMetadataMutation,
  FetchAppMetafieldsQuery,
  FetchAppMetafieldsDocument,
  FetchAppMetafieldsQueryVariables,
  UpdateAppMetadataMutationVariables,
} from "../../generated/graphql";
import {
  prepareMetadataFromRequest,
  prepareResponseFromMetadata,
} from "@/backend/metaHandlers";

import { graphQLUrl } from "@saleor/app-sdk/urls";

const handler: NextApiHandler = async (request, response) => {
  let saleorDomain: string;

  try {
    saleorDomain = domainMiddleware(request) as string;
    await jwtVerifyMiddleware(request);
  } catch (e: unknown) {
    const error = e as MiddlewareError;

    console.error(error); // For deployment debug purpose
    response.status(error.statusCode).json({
      success: false,
      error,
    });
    return;
  }

  const client = createClient(graphQLUrl(saleorDomain), async () =>
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
      if (privateMetadata) {
        response.json({
          success: true,
          data: prepareResponseFromMetadata(privateMetadata, channels, true),
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

      privateMetadata = (
        await client
          .mutation<
            UpdateAppMetadataMutation,
            UpdateAppMetadataMutationVariables
          >(UpdateAppMetadataDocument, {
            id: appId,
            input: prepareMetadataFromRequest(
              JSON.parse(request.body).data,
              currentChannelsConfigurations
            ),
            keys: channels,
          })
          .toPromise()
      ).data?.updatePrivateMetadata?.item?.privateMetafields!;

      if (privateMetadata) {
        response.json({
          success: true,
          data: prepareResponseFromMetadata(privateMetadata, channels, true),
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
