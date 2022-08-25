import { appName } from "@/constants";

import type { Handler } from "retes";

import { toNextHandler } from "retes/adapter";
import { Response } from "retes/response";
import { inferWebhooks } from "@saleor/app-sdk";
import { withBaseURL } from "@saleor/app-sdk/middleware";

import { version } from "../../package.json";
import * as GeneratedGraphQL from "../../generated/graphql";

const handler: Handler = async (request) => {
  const { baseURL } = request.context;
  const webhooks = await inferWebhooks(
    baseURL,
    `${__dirname}/webhooks`,
    GeneratedGraphQL
  );

  const manifest = {
    id: "saleor.taxjar.app",
    version: version,
    name: appName,
    about: "Saleor TaxJar app to provide sales tax compliance for your store.",
    permissions: ["MANAGE_ORDERS", "HANDLE_TAXES"],
    appUrl: baseURL,
    dataPrivacyUrl: `${baseURL}/data-privacy`,
    supportUrl: `${baseURL}/support`,
    tokenTargetUrl: `${baseURL}/api/register`,
    webhooks,
  };

  return Response.OK(manifest);
};

export default toNextHandler([withBaseURL, handler]);
