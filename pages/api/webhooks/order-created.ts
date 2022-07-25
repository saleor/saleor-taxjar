import { NextApiHandler } from "next";
import { createTaxJarOrder } from "../../../backend/taxHandlers";
import { OrderCreatedEventSubscriptionFragment } from "../../../generated/graphql";

import { webhookMiddleware } from "../../../lib/middlewares";
import MiddlewareError from "../../../utils/MiddlewareError";
import { getTaxJarConfig } from "../../../backend/utils";
import { SALEOR_DOMAIN_HEADER } from "@/constants";

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

  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER];

  const body: OrderCreatedEventSubscriptionFragment = request.body;

  if (body?.__typename === "OrderCreated") {
    const order = body.order!;

    const taxJarConfig = await getTaxJarConfig(
      saleorDomain as string,
      order.channel.slug
    );
    if (!taxJarConfig) {
      response
        .status(404)
        .json({ success: false, message: "TaxJar is not configured." });
      console.log("TaxJar is not configured.");
      return;
    }

    const orderFromTaxJar = await createTaxJarOrder(order, taxJarConfig);
    if (orderFromTaxJar) {
      response.json({ success: true });
      return;
    }
  }

  response.json({ success: false });
};

export default handler;
