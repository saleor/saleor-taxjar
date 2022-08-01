import { calculateCheckoutTaxes } from "@/backend/taxHandlers";
import { CheckoutPayload } from "@/backend/types";
import { getTaxJarConfig } from "@/backend/utils";
import { withSaleorDomainMatch } from "@/lib/middlewares";
import { SALEOR_DOMAIN_HEADER } from "@saleor/app-sdk/const";
import {
  withSaleorEventMatch,
  withWebhookSignatureVerified,
} from "@saleor/app-sdk/middleware";
import type { Handler } from "retes";
import { toNextHandler } from "retes/adapter";
import { Response } from "retes/response";

const handler: Handler = async (request) => {
  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER];
  const body: CheckoutPayload[] =
    typeof request.body === "string" ? JSON.parse(request.body) : request.body;

  const checkoutPayload: CheckoutPayload = body[0];

  const taxJarConfig = await getTaxJarConfig(
    saleorDomain as string,
    checkoutPayload.channel.slug
  );
  if (!taxJarConfig) {
    console.log("TaxJar is not configured.");
    return Response.BadRequest({
      success: false,
      message: "TaxJar is not configured.",
    });
  }
  const calculatedTaxes = await calculateCheckoutTaxes(
    checkoutPayload,
    taxJarConfig
  );
  return Response.OK(calculatedTaxes.data);
};

export default toNextHandler([
  withSaleorDomainMatch,
  withSaleorEventMatch("checkout_calculate_taxes"),
  withWebhookSignatureVerified(),
  handler,
]);

export const config = {
  api: {
    bodyParser: false,
  },
};
