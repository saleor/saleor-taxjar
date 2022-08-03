import { FetchAppMetafieldsDocument } from "@/generated/graphql";
import { SALEOR_DOMAIN_HEADER } from "@saleor/app-sdk/const";
import { withSaleorDomainPresent } from "@saleor/app-sdk/middleware";
import { graphQLUrl, jwksUrl } from "@saleor/app-sdk/urls";
import jwt, { JwtPayload } from "jsonwebtoken";
import jwks, { CertSigningKey, RsaSigningKey } from "jwks-rsa";
import { NextApiRequest } from "next";
import type { Middleware } from "retes";
import { Response } from "retes/response";
import { getAuthToken } from "./environment";
import { createClient } from "./graphql";

interface DashboardTokenPayload extends JwtPayload {
  app: string;
}

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

export const withJWTVerified: Middleware = (handler) => async (request) => {
  const {
    [SALEOR_DOMAIN_HEADER]: saleorDomain,
    "authorization-bearer": token,
  } = request.headers;

  if (token === undefined) {
    return Response.BadRequest({
      success: false,
      message: "Missing token.",
    });
  }

  let tokenClaims;
  try {
    tokenClaims = jwt.decode(token as string);
  } catch (e) {
    console.error(e);
    return Response.BadRequest({
      success: false,
      message: "Invalid token.",
    });
  }

  if (tokenClaims === null) {
    return Response.BadRequest({
      success: false,
      message: "Invalid token.",
    });
  }

  if (
    saleorDomain !== "localhost:8000" &&
    (tokenClaims as DashboardTokenPayload).iss !== saleorDomain
  ) {
    return Response.BadRequest({
      success: false,
      message: "Invalid token.",
    });
  }

  const client = createClient(
    graphQLUrl(saleorDomain),
    async () => await Promise.resolve({ token: getAuthToken() })
  );

  const appDetails = await client.query(FetchAppMetafieldsDocument).toPromise();

  const appId = appDetails?.data?.app?.id;

  if ((tokenClaims as DashboardTokenPayload).app !== appId) {
    return Response.BadRequest({
      success: false,
      message: "Invalid token.",
    });
  }

  const jwksClient = jwks({ jwksUri: jwksUrl(saleorDomain) });
  const signingKey = await jwksClient.getSigningKey();
  const signingSecret =
    (signingKey as CertSigningKey).publicKey ||
    (signingKey as RsaSigningKey).rsaPublicKey;

  try {
    jwt.verify(token as string, signingSecret);
  } catch (e) {
    return Response.BadRequest({
      success: false,
      message: "Invalid token.",
    });
  }
  return handler(request);
};
