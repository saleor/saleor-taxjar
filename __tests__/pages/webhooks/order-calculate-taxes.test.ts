/** @jest-environment setup-polly-jest/jest-environment-node */

import { PollyServer } from "@pollyjs/core";
import { ResponseTaxPayload } from "../../../backend/types";
import { getTaxJarConfig } from "../../../backend/utils";
import { setupPollyMiddleware, setupRecording } from "../../pollySetup";
import {
  dummyFetchTaxesPayload,
  dummyFetchTaxesResponse,
  dummyOrderPayload,
  mockRequest,
} from "../../utils";

describe("api/webhooks/order-calculate-taxes", () => {
  const context = setupRecording();
  beforeAll(() => {
    process.env.TAXJAR_FROM_COUNTRY = "PL";
    process.env.TAXJAR_FROM_ZIP = "50-601";
    process.env.TAXJAR_FROM_STATE = "";
    process.env.TAXJAR_FROM_CITY = "Wroclaw";
    process.env.TAXJAR_FROM_STREET = "Teczowa 7";
    process.env.TAXJAR_SANDBOX = "true";
    process.env.TAXJAR_API_KEY = "dummy";
  });
  beforeEach(() => {
    const server = context.polly.server;
    setupPollyMiddleware(server as unknown as PollyServer);
    jest.unmock("taxjar/dist/util/request");
    jest.resetModules();
  });

  it("rejects when saleor domain is missing", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyFetchTaxesResponse,
    }));
    jest.doMock("taxjar/dist/util/request", () => ({
      __esModule: true,
      default: jest.fn((_) => ({ post: post })),
    }));
    const calculateTaxes = require("../../../pages/api/webhooks/order-calculate-taxes");

    const domain = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain,
    });

    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

    await calculateTaxes.default(req, res);

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();
  });

  it("rejects when saleor event is missing", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyFetchTaxesResponse,
    }));
    jest.doMock("taxjar/dist/util/request", () => ({
      __esModule: true,
      default: jest.fn((_) => ({ post: post })),
    }));
    const calculateTaxes = require("../../../pages/api/webhooks/order-calculate-taxes");

    const event = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event,
      domain: "example.com",
    });

    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

    await calculateTaxes.default(req, res);

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();
  });

  it.skip("rejects when saleor signature is empty", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyFetchTaxesResponse,
    }));
    jest.doMock("taxjar/dist/util/request", () => ({
      __esModule: true,
      default: jest.fn((_) => ({ post: post })),
    }));
    const calculateTaxes = require("../../../pages/api/webhooks/order-calculate-taxes");

    const signature = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: "example.com",
      signature,
    });

    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

    await calculateTaxes.default(req, res);

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();
  });

  it.skip("rejects when saleor signature is incorrect", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyFetchTaxesResponse,
    }));
    jest.doMock("taxjar/dist/util/request", () => ({
      __esModule: true,
      default: jest.fn((_) => ({ post: post })),
    }));
    const calculateTaxes = require("../../../pages/api/webhooks/order-calculate-taxes");

    const signature = "incorrect-sig";
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: "example.com",
      signature,
    });

    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

    await calculateTaxes.default(req, res);

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();
  });

  it("fetches taxes for order", async () => {
    const calculateTaxes = require("../../../pages/api/webhooks/order-calculate-taxes");

    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: "example.com",
    });

    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

    await calculateTaxes.default(req, res);

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
    const calculateTaxes = require("../../../pages/api/webhooks/order-calculate-taxes");

    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: "example.com",
    });

    const orderPayload = dummyOrderPayload;
    orderPayload.discounts = [{ amount: "2" }, { amount: "1" }];
    const linePayload = orderPayload.lines[0];
    orderPayload.lines = [linePayload, linePayload];

    req.body = [orderPayload];

    await calculateTaxes.default(req, res);

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
