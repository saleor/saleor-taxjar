import { NextApiHandler } from "next";

import { appName } from "@/constants";
import { getBaseURL } from "../../lib/middlewares";
import { version } from "../../package.json";

const handler: NextApiHandler = (request, response) => {
  const baseURL = getBaseURL(request);

  // FIXME: Temporary turn off the usage of webhooks as Saleor doesn't have an implementation of subscription
  //for tax sync webhooks
  //const webhooks = await inferWebhooks(baseURL, "pages/api/webhooks", GeneratedGraphQL);

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
    // webhooks,
  };

  response.json(manifest);
};

export default handler;
