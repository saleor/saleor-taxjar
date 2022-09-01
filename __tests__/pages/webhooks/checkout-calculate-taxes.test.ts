/** @jest-environment setup-polly-jest/jest-environment-node */
import { PollyServer } from "@pollyjs/core";
import { ResponseTaxPayload } from "../../../backend/types";
import { setupPollyMiddleware, setupRecording } from "../../pollySetup";
import {
  dummyFetchTaxesPayload,
  dummyFetchTaxesResponse,
  mockRequest,
} from "../../utils";

import * as joseModule from "jose";
import { NextApiRequest, NextApiResponse } from "next";
import * as taxJarRequest from "taxjar/dist/util/request";
import { Request } from "taxjar/dist/util/types";
import toNextHandler from "../../../pages/api/webhooks/checkout-calculate-taxes";

jest.mock("next/dist/compiled/raw-body/index.js", () => ({
  __esModule: true,
  default: jest.fn((_) => ({
    toString: () => '{"dummy":12}',
  })),
}));

const testDomain = "localhost:8000";
describe("api/webhooks/checkout-calculate-taxes", () => {
  const context = setupRecording();
  beforeEach(() => {
    process.env.SALEOR_DOMAIN = testDomain;
    const server = context.polly.server;
    setupPollyMiddleware(server as unknown as PollyServer);
  });

  it("rejects when saleor domain is missing", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyFetchTaxesResponse,
    }));
    const mockTaxJarRequest = jest
      .spyOn(taxJarRequest, "default")
      .mockImplementation((_) => ({ post: post } as unknown as Request));

    const domain = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event: "checkout_calculate_taxes",
      domain,
    });

    const checkoutPayload = {
      taxBase: { ...dummyFetchTaxesPayload },
      __typename: "CalculateTaxes",
    };
    req.body = checkoutPayload;

    await toNextHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();

    mockTaxJarRequest.mockRestore();
  });

  it("rejects when saleor event is missing", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyFetchTaxesResponse,
    }));
    const mockTaxJarRequest = jest
      .spyOn(taxJarRequest, "default")
      .mockImplementation((_) => ({ post: post } as unknown as Request));

    const event = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event: event,
      domain: testDomain,
    });

    const checkoutPayload = {
      taxBase: { ...dummyFetchTaxesPayload },
      __typename: "CalculateTaxes",
    };
    req.body = [checkoutPayload];

    await toNextHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();

    mockTaxJarRequest.mockRestore();
  });

  it.skip("rejects when saleor signature is empty", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyFetchTaxesResponse,
    }));
    const mockTaxJarRequest = jest
      .spyOn(taxJarRequest, "default")
      .mockImplementation((_) => ({ post: post } as unknown as Request));

    const signature = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event: "checkout_calculate_taxes",
      domain: testDomain,
      signature,
    });

    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await toNextHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();

    mockTaxJarRequest.mockRestore();
  });

  it("rejects when saleor signature is incorrect", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyFetchTaxesResponse,
    }));
    const mockTaxJarRequest = jest
      .spyOn(taxJarRequest, "default")
      .mockImplementation((_) => ({ post: post } as unknown as Request));

    const checkoutPayload = {
      taxBase: { ...dummyFetchTaxesPayload },
      __typename: "CalculateTaxes",
    };
    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify(checkoutPayload),
    });

    const signature = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6.ABCD";
    const { req, res } = mockRequest({
      method: "POST",
      event: "checkout_calculate_taxes",
      domain: testDomain,
      signature,
    });

    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await toNextHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();

    mockTaxJarRequest.mockRestore();
  });

  it("fetches taxes for checkout", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "checkout_calculate_taxes",
      domain: testDomain,
      signature:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6..-Y1p0YWNAuX0kOPIhfjoNoyWAkvRl6iMxWQ",
    });

    const mockJose = jest
      .spyOn(joseModule, "flattenedVerify")
      .mockResolvedValue(
        {} as unknown as joseModule.FlattenedVerifyResult &
          joseModule.ResolvedKey
      );

    const checkoutPayload = {
      taxBase: { ...dummyFetchTaxesPayload },
      __typename: "CalculateTaxes",
    };

    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify(checkoutPayload),
    });

    await toNextHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getData();
    expect(data.shipping_price_gross_amount).toBe("12.30");
    expect(data.shipping_price_net_amount).toBe("10.00");
    expect(data.shipping_tax_rate).toBe("23.00");
    expect(data.lines.length).toBe(1);
    expect(data.lines[0].total_gross_amount).toBe("34.44");
    expect(data.lines[0].total_net_amount).toBe("28.00");
    expect(data.lines[0].tax_rate).toBe("23.00");
    expect(res.statusCode).toBe(200);

    mockJose.mockRestore();
  });

  it("propagates discounts over lines", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "checkout_calculate_taxes",
      domain: testDomain,
      signature:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6..-Y1p0YWNAuX0kOPIhfjoNoyWAkvRl6iMxWQ",
    });

    const mockJose = jest
      .spyOn(joseModule, "flattenedVerify")
      .mockResolvedValue(
        {} as unknown as joseModule.FlattenedVerifyResult &
          joseModule.ResolvedKey
      );
    const checkoutPayload = {
      taxBase: { ...dummyFetchTaxesPayload },
      __typename: "CalculateTaxes",
    };

    checkoutPayload.taxBase.discounts = [
      { amount: { amount: 2 } },
      { amount: { amount: 1 } },
    ];
    const linePayload = { ...checkoutPayload.taxBase.lines[0] };
    const secondLinePayload = {
      ...linePayload,
      sourceLine: {
        ...linePayload.sourceLine,
        id: "Q2hlY2tvdXRMaW5lOjc=",
      },
    };
    checkoutPayload.taxBase.lines = [linePayload, secondLinePayload];

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify(checkoutPayload),
    });

    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await toNextHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getData();

    // amounts already include propagated discount
    expect(data.lines[0].total_gross_amount).toBe("32.60");
    expect(data.lines[0].total_net_amount).toBe("26.50");
    expect(data.lines[0].tax_rate).toBe("23.00");

    expect(data.lines[1].total_gross_amount).toBe("32.60");
    expect(data.lines[1].total_net_amount).toBe("26.50");
    expect(data.lines[1].tax_rate).toBe("23.00");
    expect(res.statusCode).toBe(200);

    mockJose.mockRestore();
  });

  it("with line that should not have calculated taxes", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "checkout_calculate_taxes",
      domain: testDomain,
      signature:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6..-Y1p0YWNAuX0kOPIhfjoNoyWAkvRl6iMxWQ",
    });

    const mockJose = jest
      .spyOn(joseModule, "flattenedVerify")
      .mockResolvedValue(
        {} as unknown as joseModule.FlattenedVerifyResult &
          joseModule.ResolvedKey
      );
    const checkoutPayload = {
      taxBase: { ...dummyFetchTaxesPayload },
      __typename: "CalculateTaxes",
    };

    const linePayload = { ...checkoutPayload.taxBase.lines[0] };
    const secondLinePayload = {
      ...linePayload,
      sourceLine: {
        ...linePayload.sourceLine,
        id: "Q2hlY2tvdXRMaW5lOjc=",
      },
      chargeTaxes: false,
    };

    checkoutPayload.taxBase.lines = [linePayload, secondLinePayload];

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify(checkoutPayload),
    });

    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await toNextHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getData();

    expect(data.lines[0].total_gross_amount).toBe("34.44");
    expect(data.lines[0].total_net_amount).toBe("28.00");
    expect(data.lines[0].tax_rate).toBe("23.00");

    expect(data.lines[1].total_gross_amount).toBe("28.00");
    expect(data.lines[1].total_net_amount).toBe("28.00");
    expect(data.lines[1].tax_rate).toBe("0.00");

    expect(res.statusCode).toBe(200);

    mockJose.mockRestore();
  });

  it("with discounts and line that should not have calculated taxes", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "checkout_calculate_taxes",
      domain: testDomain,
      signature:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6..-Y1p0YWNAuX0kOPIhfjoNoyWAkvRl6iMxWQ",
    });

    const mockJose = jest
      .spyOn(joseModule, "flattenedVerify")
      .mockResolvedValue(
        {} as unknown as joseModule.FlattenedVerifyResult &
          joseModule.ResolvedKey
      );
    const checkoutPayload = {
      taxBase: { ...dummyFetchTaxesPayload },
      __typename: "CalculateTaxes",
    };
    checkoutPayload.taxBase.discounts = [
      { amount: { amount: 2 } },
      { amount: { amount: 1 } },
    ];
    const linePayload = { ...checkoutPayload.taxBase.lines[0] };
    const secondLinePayload = {
      ...linePayload,
      sourceLine: {
        ...linePayload.sourceLine,
        id: "Q2hlY2tvdXRMaW5lOjc=",
      },
      chargeTaxes: false,
    };

    checkoutPayload.taxBase.lines = [linePayload, secondLinePayload];

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify(checkoutPayload),
    });

    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await toNextHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getData();

    // amounts already include propagated discount
    expect(data.lines[0].total_gross_amount).toBe("32.60");
    expect(data.lines[0].total_net_amount).toBe("26.50");
    expect(data.lines[0].tax_rate).toBe("23.00");

    expect(data.lines[1].total_gross_amount).toBe("26.50");
    expect(data.lines[1].total_net_amount).toBe("26.50");
    expect(data.lines[1].tax_rate).toBe("0.00");

    expect(res.statusCode).toBe(200);

    mockJose.mockRestore();
  });

  it("all lines with charge taxes set to false", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "checkout_calculate_taxes",
      domain: testDomain,
      signature:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6..-Y1p0YWNAuX0kOPIhfjoNoyWAkvRl6iMxWQ",
    });

    const mockJose = jest
      .spyOn(joseModule, "flattenedVerify")
      .mockResolvedValue(
        {} as unknown as joseModule.FlattenedVerifyResult &
          joseModule.ResolvedKey
      );
    const checkoutPayload = {
      taxBase: { ...dummyFetchTaxesPayload },
      __typename: "CalculateTaxes",
    };

    const linePayload = {
      ...checkoutPayload.taxBase.lines[0],
      chargeTaxes: false,
    };
    const secondLinePayload = {
      ...linePayload,
      sourceLine: {
        ...linePayload.sourceLine,
        id: "Q2hlY2tvdXRMaW5lOjc=",
      },
    };

    checkoutPayload.taxBase.lines = [linePayload, secondLinePayload];

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify(checkoutPayload),
    });

    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await toNextHandler(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getData();

    expect(data.lines[0].total_gross_amount).toBe("28.00");
    expect(data.lines[0].total_net_amount).toBe("28.00");
    expect(data.lines[0].tax_rate).toBe("0.00");

    expect(data.lines[1].total_gross_amount).toBe("28.00");
    expect(data.lines[1].total_net_amount).toBe("28.00");
    expect(data.lines[1].tax_rate).toBe("0.00");

    expect(res.statusCode).toBe(200);

    mockJose.mockRestore();
  });
});
