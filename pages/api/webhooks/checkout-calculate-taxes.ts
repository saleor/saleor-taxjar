import { NextApiHandler } from "next";
import { calculateCheckoutTaxes } from "../../../backend/taxHandlers";
import { CheckoutPayload } from "../../../backend/types";
import { getTaxJarConfig } from "../../../backend/utils";

import { webhookMiddleware } from "../../../lib/middlewares";
import MiddlewareError from "../../../utils/MiddlewareError";
import { SALEOR_DOMAIN_HEADER } from "@/constants";

const expectedEvent = "checkout_calculate_taxes";

const handler: NextApiHandler = async (request, response) => {
  // FIXME: the validation of webhook should take into account webhook.secretKey,
  // the domain should also be validated
  try {
    webhookMiddleware(request, expectedEvent);
  } catch (e: unknown) {
    const error = e as MiddlewareError;
    console.log(error);
    response
      .status(error.statusCode)
      .json({ success: false, message: error.message });
    return;
  }
  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER];

  const body: CheckoutPayload[] =
    typeof request.body === "string" ? JSON.parse(request.body) : request.body;

  const checkoutPayload: CheckoutPayload = body[0];

  const taxJarConfig = await getTaxJarConfig(
    saleorDomain as string,
    checkoutPayload.channel.slug
  );
  if (!taxJarConfig) {
    response
      .status(404)
      .json({ success: false, message: "TaxJar is not configured." });
    console.log("TaxJar is not configured.");
    return;
  }
  const calculatedTaxes = await calculateCheckoutTaxes(
    checkoutPayload,
    taxJarConfig
  );
  response.json(calculatedTaxes.data);
};

export default handler;
