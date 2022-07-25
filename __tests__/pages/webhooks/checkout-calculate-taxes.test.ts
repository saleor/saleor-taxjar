/** @jest-environment setup-polly-jest/jest-environment-node */

import { PollyServer } from "@pollyjs/core";
import { ResponseTaxPayload } from "../../../backend/types";
import { setupPollyMiddleware, setupRecording } from "../../pollySetup";
import {
  dummyCheckoutPayload,
  dummyFetchTaxesPayload,
  dummyFetchTaxesResponse,
  mockRequest,
} from "../../utils";

import { NextApiRequest, NextApiResponse } from "next";
import * as taxJarRequest from "taxjar/dist/util/request";
import { Request } from "taxjar/dist/util/types";
import * as calculateTaxes from "../../../pages/api/webhooks/checkout-calculate-taxes";

describe("api/webhooks/checkout-calculate-taxes", () => {
  beforeAll(() => {
    process.env.TAXJAR_FROM_COUNTRY = "PL";
    process.env.TAXJAR_FROM_ZIP = "50-601";
    process.env.TAXJAR_FROM_STATE = "";
    process.env.TAXJAR_FROM_CITY = "Wroclaw";
    process.env.TAXJAR_FROM_STREET = "Teczowa 7";
    process.env.TAXJAR_SANDBOX = "true";
    process.env.TAXJAR_API_KEY = "dummy";
  });
  const context = setupRecording();
  beforeEach(() => {
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

    const checkoutPayload = dummyFetchTaxesPayload;
    req.body = [checkoutPayload];

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
      event: event,
      domain: "example.com",
    });

    const checkoutPayload = dummyFetchTaxesPayload;
    req.body = [checkoutPayload];

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
      event: "checkout_calculate_taxes",
      domain: "example.com",
      signature,
    });

    const checkoutPayload = dummyFetchTaxesPayload;
    req.body = [checkoutPayload];

    await calculateTaxes.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();

    mockTaxJarRequest.mockRestore();
  });

  it.skip("rejects when saleor signature is incorrect", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyFetchTaxesResponse,
    }));
    const mockTaxJarRequest = jest
      .spyOn(taxJarRequest, "default")
      .mockImplementation((_) => ({ post: post } as unknown as Request));

    const signature = "incorrect-sig";
    const { req, res } = mockRequest({
      method: "POST",
      event: "checkout_calculate_taxes",
      domain: "example.com",
      signature,
    });

    const checkoutPayload = dummyFetchTaxesPayload;
    req.body = [checkoutPayload];

    await calculateTaxes.default(
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
      domain: "example.com",
    });

    const checkoutPayload = dummyCheckoutPayload;
    req.body = [checkoutPayload];

    await calculateTaxes.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getJSONData();

    expect(data.shipping_price_gross_amount).toBe("12.3");
    expect(data.shipping_price_net_amount).toBe("10");
    expect(data.shipping_tax_rate).toBe("0.23");
    expect(data.lines.length).toBe(1);
    expect(data.lines[0].total_gross_amount).toBe("34.44");
    expect(data.lines[0].total_net_amount).toBe("28.00");
    expect(data.lines[0].tax_rate).toBe("0.23");
    expect(res.statusCode).toBe(200);
  });

  it("propagates discounts over lines", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "checkout_calculate_taxes",
      domain: "example.com",
    });

    const checkoutPayload = dummyCheckoutPayload;

    checkoutPayload.discounts = [{ amount: "2" }, { amount: "1" }];
    const linePayload = checkoutPayload.lines[0];
    const lineTotalAmountWithoutDiscount = Number(linePayload.total_amount);
    checkoutPayload.lines = [linePayload, linePayload];
    req.body = [checkoutPayload];

    await calculateTaxes.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    const data: ResponseTaxPayload = res._getJSONData();

    // amounts already include propagated discount
    expect(data.lines[0].total_gross_amount).toBe("32.60");
    expect(data.lines[0].total_net_amount).toBe("26.50");
    expect(data.lines[0].tax_rate).toBe("0.23");

    expect(data.lines[1].total_gross_amount).toBe("32.60");
    expect(data.lines[1].total_net_amount).toBe("26.50");
    expect(data.lines[1].tax_rate).toBe("0.23");
    expect(res.statusCode).toBe(200);
  });
});
