import { calculateTaxesHandler } from "@/backend/taxHandlers";
import { withSaleorDomainMatch } from "@/lib/middlewares";
import { SALEOR_DOMAIN_HEADER } from "@saleor/app-sdk/const";
import {
  withSaleorEventMatch,
  withWebhookSignatureVerified,
} from "@saleor/app-sdk/middleware";
import type { Handler } from "retes";
import { toNextHandler } from "retes/adapter";
import { Response } from "retes/response";
import { CalculateTaxesEventSubscriptionFragment } from "@/generated/graphql";

const handler: Handler = async (request) => {
  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER];
  const payload: CalculateTaxesEventSubscriptionFragment =
    typeof request.body === "string" ? JSON.parse(request.body) : request.body;

  if (payload?.__typename === "CalculateTaxes") {
    const taxObject = payload.taxBase!;
    return await calculateTaxesHandler(taxObject, saleorDomain);
  }
  return Response.BadRequest({
    success: false,
    message: "Incorrect payload event.",
  });
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
