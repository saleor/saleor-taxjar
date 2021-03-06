import { NextApiHandler } from "next";
import { calculateOrderTaxes } from "../../../backend/taxHandlers";
import { OrderPayload } from "../../../backend/types";
import { getTaxJarConfig } from "../../../backend/utils";

import { webhookMiddleware } from "../../../lib/middlewares";
import MiddlewareError from "../../../utils/MiddlewareError";

const expectedEvent = "order_calculate_taxes";

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

  const body: OrderPayload[] =
    typeof request.body === "string" ? JSON.parse(request.body) : request.body;

  const orderPayload: OrderPayload = body[0];

  // FIXME: this part of settings will be fetched from App.metadata and defined based
  // on channnel used in order.
  const taxJarConfig = getTaxJarConfig();
  const calculatedTaxes = await calculateOrderTaxes(orderPayload, taxJarConfig);
  response.json(calculatedTaxes.data);
};

export default handler;
