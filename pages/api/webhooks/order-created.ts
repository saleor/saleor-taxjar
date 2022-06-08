import { NextApiHandler } from "next";
import { TaxJarConfig } from "../../../backend/types";
import { createTaxJarOrder } from "../../../backend/taxHandlers";
import { OrderCreatedEventSubscriptionFragment } from "../../../generated/graphql";

import { webhookMiddleware } from "../../../lib/middlewares";
import MiddlewareError from "../../../utils/MiddlewareError";
import { getTaxJarConfig } from "../../../backend/utils";
import { buffer, json } from "micro";

const expectedEvent = "order_created";

export const config = {
  api: {
    bodyParser: false,
  },
};

const handler: NextApiHandler = async (request, response) => {
  // FIXME: the validation of webhook should take into account webhook.secretKey,
  // the domain should also be validated
  try {
    const payloadBuffer = await buffer(request);
    webhookMiddleware(request, expectedEvent, payloadBuffer);
  } catch (e: unknown) {
    const error = e as MiddlewareError;

    console.error(error);
    response
      .status(error.statusCode)
      .json({ success: false, message: error.message });
    return;
  }

  const body: OrderCreatedEventSubscriptionFragment = await json(request)
  console.log(body);
  // const body: OrderCreatedEventSubscriptionFragment = request.body;

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
