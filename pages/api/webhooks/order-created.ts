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
import {
  getTaxJarConfig,
  taxJarConfigIsValidToUse,
} from "../../../backend/utils";

const handler: Handler = async (request) => {
  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER];

  const body: OrderCreatedEventSubscriptionFragment =
    typeof request.body === "string" ? JSON.parse(request.body) : request.body;

  if (body?.__typename === "OrderCreated") {
    const order = body.order!;

    const taxJarConfig = await getTaxJarConfig(
      saleorDomain as string,
      order.channel.slug
    );
    const validData = taxJarConfigIsValidToUse(taxJarConfig);

    if (!validData.isValid) {
      return { body: validData.message, status: validData.status };
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
