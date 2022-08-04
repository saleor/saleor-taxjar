/** @jest-environment setup-polly-jest/jest-environment-node */
import { PollyServer } from "@pollyjs/core";
import * as joseModule from "jose";
import { NextApiRequest, NextApiResponse } from "next";
import * as taxJarRequest from "taxjar/dist/util/request";
import { Request } from "taxjar/dist/util/types";
import { ResponseTaxPayload } from "../../../backend/types";
import * as calculateTaxes from "../../../pages/api/webhooks/order-calculate-taxes";
import { setupPollyMiddleware, setupRecording } from "../../pollySetup";
import {
  dummyFetchTaxesResponse,
  dummyOrderPayload,
  mockRequest,
} from "../../utils";

jest.mock("next/dist/compiled/raw-body/index.js", () => ({
  __esModule: true,
  default: jest.fn((_) => ({
    toString: () => '{"dummy":12}',
  })),
}));

const testDomain = "localhost:8000";

describe("api/webhooks/order-calculate-taxes", () => {
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
      event: "order_calculate_taxes",
      domain,
    });

    const orderPayload = { ...dummyOrderPayload };
    req.body = [orderPayload];

    await calculateTaxes.default(
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
      event,
      domain: testDomain,
    });

    const orderPayload = { ...dummyOrderPayload };
    req.body = [orderPayload];

    await calculateTaxes.default(
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
      event: "order_calculate_taxes",
      domain: testDomain,
      signature,
    });

    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await calculateTaxes.default(
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

    const orderPayload = { ...dummyOrderPayload };
    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify([orderPayload]),
    });

    const signature = "incorrect-sig";
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: testDomain,
      signature,
    });

    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await calculateTaxes.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();

    mockTaxJarRequest.mockRestore();
  });

  it("fetches taxes for order", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: testDomain,
      signature:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6..-Y1p0YWNAuX0kOPIhfjoNoyWAkvRl6iMxWQ",
    });

    const mockJose = jest
      .spyOn(joseModule, "flattenedVerify")
      .mockReturnValue(
        Promise.resolve(
          {} as unknown as joseModule.FlattenedVerifyResult &
            joseModule.ResolvedKey
        )
      );

    const orderPayload = { ...dummyOrderPayload };

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify([orderPayload]),
    });
    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await calculateTaxes.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getData();

    expect(data.shipping_price_gross_amount).toBe("12.3");
    expect(data.shipping_price_net_amount).toBe("10");
    expect(data.shipping_tax_rate).toBe("0.23");
    expect(data.lines.length).toBe(1);
    expect(data.lines[0].total_gross_amount).toBe("34.44");
    expect(data.lines[0].total_net_amount).toBe("28.00");
    expect(data.lines[0].tax_rate).toBe("0.23");
    expect(res.statusCode).toBe(200);

    mockJose.mockRestore();
  });

  it("propagates discounts over lines", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: testDomain,
      signature:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6..-Y1p0YWNAuX0kOPIhfjoNoyWAkvRl6iMxWQ",
    });

    const mockJose = jest
      .spyOn(joseModule, "flattenedVerify")
      .mockReturnValue(
        Promise.resolve(
          {} as unknown as joseModule.FlattenedVerifyResult &
            joseModule.ResolvedKey
        )
      );

    const orderPayload = { ...dummyOrderPayload };
    orderPayload.discounts = [{ amount: "2" }, { amount: "1" }];
    const linePayload = orderPayload.lines[0];
    orderPayload.lines = [linePayload, linePayload];

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify([orderPayload]),
    });
    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await calculateTaxes.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getData();

    // amounts already include propagated discount
    expect(data.lines[0].total_gross_amount).toBe("32.60");
    expect(data.lines[0].total_net_amount).toBe("26.50");
    expect(data.lines[0].tax_rate).toBe("0.23");

    expect(data.lines[1].total_gross_amount).toBe("32.60");
    expect(data.lines[1].total_net_amount).toBe("26.50");
    expect(data.lines[1].tax_rate).toBe("0.23");
    expect(res.statusCode).toBe(200);

    mockJose.mockRestore();
  });

  it("with line that should not have calculated taxes", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: testDomain,
      signature:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6..-Y1p0YWNAuX0kOPIhfjoNoyWAkvRl6iMxWQ",
    });

    const mockJose = jest
      .spyOn(joseModule, "flattenedVerify")
      .mockReturnValue(
        Promise.resolve(
          {} as unknown as joseModule.FlattenedVerifyResult &
            joseModule.ResolvedKey
        )
      );

    const orderPayload = { ...dummyOrderPayload };

    const linePayload = orderPayload.lines[0];
    const secondLinePayload = {
      ...linePayload,
      id: "T3JkZXJMaW5lOjc=",
      charge_taxes: false,
    };
    orderPayload.lines = [linePayload, secondLinePayload];

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify([orderPayload]),
    });
    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await calculateTaxes.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getData();

    expect(data.lines[0].total_gross_amount).toBe("34.44");
    expect(data.lines[0].total_net_amount).toBe("28.00");
    expect(data.lines[0].tax_rate).toBe("0.23");

    expect(data.lines[1].total_gross_amount).toBe("28.00");
    expect(data.lines[1].total_net_amount).toBe("28.00");
    expect(data.lines[1].tax_rate).toBe("0");

    expect(res.statusCode).toBe(200);

    mockJose.mockRestore();
  });

  it("with discounts and line that should not have calculated taxes", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: testDomain,
      signature:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6..-Y1p0YWNAuX0kOPIhfjoNoyWAkvRl6iMxWQ",
    });

    const mockJose = jest
      .spyOn(joseModule, "flattenedVerify")
      .mockReturnValue(
        Promise.resolve(
          {} as unknown as joseModule.FlattenedVerifyResult &
            joseModule.ResolvedKey
        )
      );

    const orderPayload = { ...dummyOrderPayload };
    orderPayload.discounts = [{ amount: "2" }, { amount: "1" }];
    const linePayload = orderPayload.lines[0];
    const secondLinePayload = {
      ...linePayload,
      id: "T3JkZXJMaW5lOjc=",
      charge_taxes: false,
    };

    orderPayload.lines = [linePayload, secondLinePayload];

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify([orderPayload]),
    });
    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await calculateTaxes.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getData();

    // amounts already include propagated discount
    expect(data.lines[0].total_gross_amount).toBe("32.60");
    expect(data.lines[0].total_net_amount).toBe("26.50");
    expect(data.lines[0].tax_rate).toBe("0.23");

    expect(data.lines[1].total_gross_amount).toBe("26.50");
    expect(data.lines[1].total_net_amount).toBe("26.50");
    expect(data.lines[1].tax_rate).toBe("0");

    expect(res.statusCode).toBe(200);

    mockJose.mockRestore();
  });

  it("all lines with charge taxes set to false", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: testDomain,
      signature:
        "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImtpZCI6..-Y1p0YWNAuX0kOPIhfjoNoyWAkvRl6iMxWQ",
    });

    const mockJose = jest
      .spyOn(joseModule, "flattenedVerify")
      .mockReturnValue(
        Promise.resolve(
          {} as unknown as joseModule.FlattenedVerifyResult &
            joseModule.ResolvedKey
        )
      );

    const orderPayload = { ...dummyOrderPayload };

    const linePayload = orderPayload.lines[0];
    linePayload.charge_taxes = false;
    const secondLinePayload = {
      ...linePayload,
      id: "T3JkZXJMaW5lOjc=",
      charge_taxes: false,
    };
    orderPayload.lines = [linePayload, secondLinePayload];

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify([orderPayload]),
    });
    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await calculateTaxes.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getData();

    expect(data.lines[0].total_gross_amount).toBe("28.00");
    expect(data.lines[0].total_net_amount).toBe("28.00");
    expect(data.lines[0].tax_rate).toBe("0");

    expect(data.lines[1].total_gross_amount).toBe("28.00");
    expect(data.lines[1].total_net_amount).toBe("28.00");
    expect(data.lines[1].tax_rate).toBe("0");

    expect(res.statusCode).toBe(200);

    mockJose.mockRestore();
  });
});
