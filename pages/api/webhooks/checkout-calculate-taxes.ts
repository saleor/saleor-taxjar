import { NextApiHandler } from "next";
import { calculateCheckoutTaxes } from "../../../backend/taxHandlers";
import { CheckoutPayload, TaxJarConfig } from "../../../backend/types";
import { getTaxJarConfig } from "../../../backend/utils";
import { buffer, json } from "micro";
import { webhookMiddleware } from "../../../lib/middlewares";
import MiddlewareError from "../../../utils/MiddlewareError";

const expectedEvent = "checkout_calculate_taxes";

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
    console.log(error);
    response
      .status(error.statusCode)
      .json({ success: false, message: error.message });
    return;
  }
  
  const body = await json(request)

  const checkoutPayload: CheckoutPayload = body[0];

  // FIXME: this part of settings will be fetched from App.metadata and defined based
  // on channnel used in checkout.
  const taxJarConfig = getTaxJarConfig();
  const calculatedTaxes = await calculateCheckoutTaxes(
    checkoutPayload,
    taxJarConfig
  );
  response.json(calculatedTaxes.data);
};

export default handler;
