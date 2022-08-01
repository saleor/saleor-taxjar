import { SALEOR_DOMAIN_HEADER } from "@saleor/app-sdk/const";
import { withSaleorDomainPresent } from "@saleor/app-sdk/middleware";
import { jwksUrl } from "@saleor/app-sdk/urls";
import jwt, { JwtPayload } from "jsonwebtoken";
import jwks, { CertSigningKey, RsaSigningKey } from "jwks-rsa";
import { NextApiRequest } from "next";
import type { Middleware } from "retes";
import { Response } from "retes/response";
import MiddlewareError from "../utils/MiddlewareError";

export const getBaseURL = (req: NextApiRequest): string => {
  const { host, "x-forwarded-proto": protocol = "http" } = req.headers;
  return `${protocol}://${host}`;
};

export const withSaleorDomainMatch: Middleware = (handler) =>
  withSaleorDomainPresent((request) => {
    const SALEOR_DOMAIN = process.env.SALEOR_DOMAIN;

    if (SALEOR_DOMAIN === undefined) {
      console.log("Missing SALEOR_DOMAIN environment variable.");
      return Response.InternalServerError({
        success: false,
        message: "Missing SALEOR_DOMAIN environment variable.",
      });
    }

    if (SALEOR_DOMAIN !== request.headers[SALEOR_DOMAIN_HEADER]) {
      console.log(`Invalid ${SALEOR_DOMAIN_HEADER} header.`);
      return Response.BadRequest({
        success: false,
        message: `Invalid ${SALEOR_DOMAIN_HEADER} header.`,
      });
    }

    return handler(request);
  });

export const domainMiddleware = (request: NextApiRequest) => {
  const saleorDomain = request.headers[SALEOR_DOMAIN_HEADER];
  if (!saleorDomain) {
    throw new MiddlewareError("Missing saleor domain token.", 400);
  }
  return saleorDomain;
};

export const jwtVerifyMiddleware = async (request: NextApiRequest) => {
  const { [SALEOR_DOMAIN_HEADER]: domain, "authorization-bearer": token } =
    request.headers;

  let tokenClaims;
  try {
    tokenClaims = jwt.decode(token as string);
  } catch (e) {
    console.error(e);
    throw new MiddlewareError("Invalid token.", 400);
  }

  if (tokenClaims === null) {
    throw new MiddlewareError("Missing token.", 400);
  }

  if (!domain) {
    throw new MiddlewareError("Missing domain.", 400);
  }

  if (
    domain !== "localhost:8000" &&
    (tokenClaims as JwtPayload).iss !== domain
  ) {
    throw new MiddlewareError("Invalid token.", 400);
  }

  const jwksClient = jwks({ jwksUri: jwksUrl(domain) });
  const signingKey = await jwksClient.getSigningKey();
  const signingSecret =
    (signingKey as CertSigningKey).publicKey ||
    (signingKey as RsaSigningKey).rsaPublicKey;

  try {
    jwt.verify(token as string, signingSecret);
  } catch (e) {
    console.error(e);
    throw new MiddlewareError("Invalid token.", 400);
  }
};
