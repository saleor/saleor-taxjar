import { NextApiHandler } from "next";
import { TaxJarConfig } from "../../../backend/types";
import { createTaxJarOrder } from "../../../backend/taxHandlers";
import { OrderCreatedEventSubscriptionFragment } from "../../../generated/graphql";

import { webhookMiddleware } from "../../../lib/middlewares";
import MiddlewareError from "../../../utils/MiddlewareError";
import { getTaxJarConfig } from "../../../backend/utils";

const expectedEvent = "order_created";

const handler: NextApiHandler = async (request, response) => {
  // FIXME: the validation of webhook should take into account webhook.secretKey,
  // the domain should also be validated
  try {
    webhookMiddleware(request, expectedEvent);
  } catch (e: unknown) {
    const error = e as MiddlewareError;

    console.error(error); // For deployment debug purpose
    response
      .status(error.statusCode)
      .json({ success: false, message: error.message });
    return;
  }

  const body: OrderCreatedEventSubscriptionFragment = request.body;

  // FIXME: this part of settings will be fetched from App.metadata and defined based
  // on channnel used in order.
  const taxJarConfig = getTaxJarConfig();

  if (body?.__typename === "OrderCreated") {
    const order = body.order!;
    createTaxJarOrder(order, taxJarConfig);
    response.json({ success: true });
    return;
  }

  response.json({ success: false });
};

export default handler;
