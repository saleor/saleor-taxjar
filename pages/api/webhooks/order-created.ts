import { NextApiHandler } from "next";
import { TaxJarConfig } from "../../../backend/types";
import { createTaxJarOrder } from "../../../backend/taxHandlers";
import { OrderCreatedEventSubscriptionFragment } from "../../../generated/graphql";

import { webhookMiddleware } from "../../../lib/middlewares";
import MiddlewareError from "../../../utils/MiddlewareError";

const expectedEvent = "order_created";

const handler: NextApiHandler = async (request, response) => {
  if (request.method !== "POST") {
    response.status(405).send({ message: "Only POST requests allowed" });
    return;
  }

  // FIXME: the validation of webhook should take into account webhook.secretKey,
  // the domain should also be validated
  try {
    webhookMiddleware(request, expectedEvent);
  } catch (e: unknown) {
    const error = e as MiddlewareError;

    console.error(error);
    response
      .status(error.statusCode)
      .json({ success: false, message: error.message });
    return;
  }

  const body: OrderCreatedEventSubscriptionFragment = request.body;

  // FIXME: this part of settings will be fetched from App.metadata and defined based
  // on channnel used in order.
  const taxJarConfig: TaxJarConfig = {
    shipFrom: {
      fromCountry: process.env.TAXJAR_FROM_COUNTRY!,
      fromZip: process.env.TAXJAR_FROM_ZIP!,
      fromState: process.env.TAXJAR_FROM_STATE!,
      fromCity: process.env.TAXJAR_FROM_CITY!,
      fromStreet: process.env.TAXJAR_FROM_STREET!,
    },
    apiKey: process.env.TAXJAR_API_KEY!,
    sandbox: process.env.TAXJAR_SANDBOX === "false" ? false : true,
  };

  if (body?.__typename === "OrderCreated") {
    const order = body.order!;
    createTaxJarOrder(order, taxJarConfig);
    response.json({ success: true });
    return;
  }

  response.json({ success: false });
};

export default handler;
