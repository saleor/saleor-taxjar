/** @jest-environment setup-polly-jest/jest-environment-node */

// import { createOrderTransaction } from "../../../backend/taxjarApi";
import { PollyServer } from "@pollyjs/core";
import { getTaxJarConfig } from "../../../backend/utils";
// import handler from "../../../pages/api/webhooks/order-created";
import { setupPollyMiddleware, setupRecording } from "../../pollySetup";
import {
  dummyOrderCreatedPayload,
  dummyTaxesResponseForCreatedOrder,
  mockRequest,
} from "../../utils";

describe("api/webhooks/order-created", () => {
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
      dummyTaxesResponseForCreatedOrder,
    }));
    jest.doMock("taxjar/dist/util/request", () => ({
      __esModule: true,
      default: jest.fn((_) => ({ post: post })),
    }));
    const orderCreated = require("../../../pages/api/webhooks/order-created");

    const domain = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_created",
      domain,
    });

    const orderPayload = dummyOrderCreatedPayload;
    req.body = orderPayload;

    await orderCreated.default(req, res);

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();
  });

  it("rejects when saleor event is missing", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyTaxesResponseForCreatedOrder,
    }));
    jest.doMock("taxjar/dist/util/request", () => ({
      __esModule: true,
      default: jest.fn((_) => ({ post: post })),
    }));
    const orderCreated = require("../../../pages/api/webhooks/order-created");

    const event = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event,
      domain: "example.com",
    });

    const orderPayload = dummyOrderCreatedPayload;
    req.body = orderPayload;

    await orderCreated.default(req, res);

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();
  });

  it.skip("rejects when saleor signature is empty", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyTaxesResponseForCreatedOrder,
    }));
    jest.doMock("taxjar/dist/util/request", () => ({
      __esModule: true,
      default: jest.fn((_) => ({ post: post })),
    }));
    const orderCreated = require("../../../pages/api/webhooks/order-created");

    const signature = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_created",
      domain: "example.com",
      signature,
    });

    const orderPayload = dummyOrderCreatedPayload;
    req.body = orderPayload;

    await orderCreated.default(req, res);

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();
  });

  it.skip("rejects when saleor signature is incorrect", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyTaxesResponseForCreatedOrder,
    }));
    jest.doMock("taxjar/dist/util/request", () => ({
      __esModule: true,
      default: jest.fn((_) => ({ post: post })),
    }));
    const orderCreated = require("../../../pages/api/webhooks/order-created");

    const signature = "incorrect-sig";
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_created",
      domain: "example.com",
      signature,
    });

    const orderPayload = dummyOrderCreatedPayload;
    req.body = orderPayload;

    await orderCreated.default(req, res);

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();
  });

  it("creates transaction on TaxJar side for new order", async () => {
    const orderCreated = require("../../../pages/api/webhooks/order-created");

    const { req, res } = mockRequest({
      method: "POST",
      event: "order_created",
      domain: "example.com",
    });

    const orderPayload = dummyOrderCreatedPayload;
    req.body = orderPayload;

    await orderCreated.default(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("skips when order has different address than US", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyTaxesResponseForCreatedOrder,
    }));
    jest.doMock("taxjar/dist/util/request", () => ({
      __esModule: true,
      default: jest.fn((_) => ({ post: post })),
    }));
    const orderCreated = require("../../../pages/api/webhooks/order-created");

    const { req, res } = mockRequest({
      method: "POST",
      event: "order_created",
      domain: "example.com",
    });

    const orderPayload = dummyOrderCreatedPayload;

    orderPayload.order.shippingAddress.country.code = "PL";
    req.body = orderPayload;

    await orderCreated.default(req, res);

    expect(post).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
