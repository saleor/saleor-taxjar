/** @jest-environment setup-polly-jest/jest-environment-node */

import * as appConstants from "@/constants";
import { PollyServer } from "@pollyjs/core";
import { NextApiRequest, NextApiResponse } from "next";
import * as taxJarRequest from "taxjar/dist/util/request";
import { Request } from "taxjar/dist/util/types";
import * as orderCreated from "../../../pages/api/webhooks/order-created";
import { setupPollyMiddleware, setupRecording } from "../../pollySetup";
import {
  dummyOrderCreatedPayload,
  dummyTaxesResponseForCreatedOrder,
  mockRequest,
} from "../../utils";

describe("api/webhooks/order-created", () => {
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
      dummyTaxesResponseForCreatedOrder,
    }));
    const mockTaxJarRequest = jest
      .spyOn(taxJarRequest, "default")
      .mockImplementation((_) => ({ post: post } as unknown as Request));

    const domain = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_created",
      domain,
    });

    const orderPayload = dummyOrderCreatedPayload;
    req.body = orderPayload;

    await orderCreated.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();

    mockTaxJarRequest.mockRestore();
  });

  it("rejects when saleor event is missing", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyTaxesResponseForCreatedOrder,
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

    const orderPayload = dummyOrderCreatedPayload;
    req.body = orderPayload;

    await orderCreated.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();

    mockTaxJarRequest.mockRestore();
  });

  it.skip("rejects when saleor signature is empty", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyTaxesResponseForCreatedOrder,
    }));
    const mockTaxJarRequest = jest
      .spyOn(taxJarRequest, "default")
      .mockImplementation((_) => ({ post: post } as unknown as Request));

    const signature = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_created",
      domain: "example.com",
      signature,
    });

    const orderPayload = dummyOrderCreatedPayload;
    req.body = orderPayload;

    await orderCreated.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();

    mockTaxJarRequest.mockRestore();
  });

  it.skip("rejects when saleor signature is incorrect", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyTaxesResponseForCreatedOrder,
    }));
    const mockTaxJarRequest = jest
      .spyOn(taxJarRequest, "default")
      .mockImplementation((_) => ({ post: post } as unknown as Request));

    const signature = "incorrect-sig";
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_created",
      domain: "example.com",
      signature,
    });

    const orderPayload = dummyOrderCreatedPayload;
    req.body = orderPayload;

    await orderCreated.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();

    mockTaxJarRequest.mockRestore();
  });

  it("creates transaction on TaxJar side for new order", async () => {
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_created",
      domain: "localhost:8000",
    });

    const orderPayload = dummyOrderCreatedPayload;
    req.body = orderPayload;

    await orderCreated.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(200);
  });

  it("skips when order has different address than US", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyTaxesResponseForCreatedOrder,
    }));
    const mockTaxJarRequest = jest
      .spyOn(taxJarRequest, "default")
      .mockImplementation((_) => ({ post: post } as unknown as Request));

    const { req, res } = mockRequest({
      method: "POST",
      event: "order_created",
      domain: "localhost:8000",
    });

    const orderPayload = dummyOrderCreatedPayload;

    orderPayload.order.shippingAddress.country.code = "PL";
    req.body = orderPayload;

    await orderCreated.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(post).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);

    mockTaxJarRequest.mockRestore();
  });
});
