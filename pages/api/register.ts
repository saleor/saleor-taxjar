import { NextApiHandler } from "next";
import { WebhookCreateError } from "../../backend/errors";
import { install } from "../../backend/installApp";

import { setAuthToken } from "../../lib/environment";
import { getBaseURL } from "../../lib/middlewares";

const handler: NextApiHandler = async (request, response) => {
  const saleorDomain = request.headers["saleor-domain"];
  if (!saleorDomain) {
    response.status(400).json({ success: false, message: "Missing saleor domain token." });
    return;
  }

  const authToken = request.body?.auth_token as string;
  if (!authToken) {
    response.status(400).json({ success: false, message: "Missing auth token." });
    return;
  }

  try {
    await install(authToken, String(saleorDomain), getBaseURL(request))  
  } catch (e: unknown) {
    const error = e as WebhookCreateError;
    response.status(404).json({success: false, message: (error.message + error.codes.join(" "))})
    return;
  }
  
  response.json({ success: true });
};

export default handler;
