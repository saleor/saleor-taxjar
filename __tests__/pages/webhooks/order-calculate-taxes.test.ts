/** @jest-environment setup-polly-jest/jest-environment-node */

import * as appConstants from "@/constants";
import { PollyServer } from "@pollyjs/core";
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

describe("api/webhooks/order-calculate-taxes", () => {
  const context = setupRecording();
  beforeAll(() => {
    appConstants.serverEnvVars.settingsEncryptionSecret = "";
  });
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
      event: "order_calculate_taxes",
      domain,
    });

    const orderPayload = dummyOrderPayload;
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
      domain: "example.com",
    });

    const orderPayload = dummyOrderPayload;
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
      domain: "example.com",
      signature,
    });

    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

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
      event: "order_calculate_taxes",
      domain: "example.com",
      signature,
    });

    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

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
      domain: "localhost:8000",
    });

    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

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
      event: "order_calculate_taxes",
      domain: "localhost:8000",
    });

    const orderPayload = dummyOrderPayload;
    orderPayload.discounts = [{ amount: "2" }, { amount: "1" }];
    const linePayload = orderPayload.lines[0];
    orderPayload.lines = [linePayload, linePayload];

    req.body = [orderPayload];

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
