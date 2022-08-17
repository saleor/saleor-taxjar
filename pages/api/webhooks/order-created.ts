import { createTaxJarOrder } from "../../../backend/taxHandlers";
import { OrderCreatedEventSubscriptionFragment } from "../../../generated/graphql";

import { withSaleorDomainMatch } from "@/lib/middlewares";
import { SALEOR_DOMAIN_HEADER } from "@saleor/app-sdk/const";
import {
  withSaleorEventMatch,
  withWebhookSignatureVerified,
} from "@saleor/app-sdk/middleware";
import type { Handler } from "retes";
import { toNextHandler } from "retes/adapter";
import { Response } from "retes/response";
import { getTaxJarConfig } from "../../../backend/utils";

const handler: Handler = async (request) => {
  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER];

  const body: OrderCreatedEventSubscriptionFragment =
    typeof request.body === "string" ? JSON.parse(request.body) : request.body;

  if (body?.__typename === "OrderCreated") {
    const order = body.order!;

    const taxJarConfig = await getTaxJarConfig(
      saleorDomain,
      order.channel.slug
    );
    if (!taxJarConfig) {
      console.log("TaxJar is not configured.");
      return Response.BadRequest({
        success: false,
        message: "TaxJar is not configured.",
      });
    }

    const orderFromTaxJar = await createTaxJarOrder(order, taxJarConfig);
    if (orderFromTaxJar) {
      return Response.OK({ success: true });
    }
  }
  return Response.BadRequest({
    success: false,
    message: "Incorrect payload event.",
  });
};

export default toNextHandler([
  withSaleorDomainMatch,
  withSaleorEventMatch("order_created"),
  withWebhookSignatureVerified(),
  handler,
]);

export const config = {
  api: {
    bodyParser: false,
  },
};
