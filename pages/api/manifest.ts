import { NextApiHandler } from "next";
import { print } from "graphql/language/printer";
import fg from 'fast-glob';
import path from 'path';

import { version, name } from "../../package.json";
import * as GeneratedGraphQL from "../../generated/graphql";
import {PermissionEnum} from "../../generated/graphql"
import { eventSignatureMiddleware, getBaseURL } from "../../lib/middlewares";

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
const dropFileExtension = (filename: string) => path.parse(filename).name;

const inferWebhooks = async (baseURL: string) => {
  const entries = await fg(['*.ts'], { cwd: 'pages/api/webhooks' });

  return entries.map(dropFileExtension).map((name: string) => {
    const camelcaseName = name.split('-').map(capitalize).join('');
    const statement = `${camelcaseName}SubscriptionDocument`;
    const query = statement in  GeneratedGraphQL ? print((GeneratedGraphQL as any)[statement]) : null;

    return {
      name,
      asyncEvents: [name.toUpperCase().replace("-", "_")],
      query, 
      targetUrl: `${baseURL}/api/webhooks/${name}`,
    };
  });
};

const handler: NextApiHandler = async (request, response) => {
  const baseURL = getBaseURL(request);

  const webhooks = await inferWebhooks(baseURL);
  eventSignatureMiddleware(request, "abc");
  const manifest = {
    id: "saleor.app.taxjar",
    version: version,
    name: name,
    permissions: [PermissionEnum.ManageOrders, PermissionEnum.HandleTaxes],
    appUrl: baseURL,
    configurationUrl: `${baseURL}/configuration`,
    tokenTargetUrl: `${baseURL}/api/register`,
  };

  response.json(manifest);
}

export default handler;
