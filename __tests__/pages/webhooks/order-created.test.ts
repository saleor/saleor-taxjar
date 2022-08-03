/** @jest-environment setup-polly-jest/jest-environment-node */

import { PollyServer } from "@pollyjs/core";
import * as joseModule from "jose";
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

jest.mock("next/dist/compiled/raw-body/index.js", () => ({
  __esModule: true,
  default: jest.fn((_) => ({
    toString: () => '{"dummy":12}',
  })),
}));

const testDomain = "localhost:8000";
describe("api/webhooks/order-created", () => {
  const context = setupRecording();
  beforeEach(() => {
    process.env.SALEOR_DOMAIN = testDomain;
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
      domain: testDomain,
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
      domain: testDomain,
      signature,
    });

    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await orderCreated.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(400);
    expect(post).not.toHaveBeenCalled();

    mockTaxJarRequest.mockRestore();
  });

  it("rejects when saleor signature is incorrect", async () => {
    const post = jest.fn((url: any, params: any) => ({
      dummyTaxesResponseForCreatedOrder,
    }));
    const mockTaxJarRequest = jest
      .spyOn(taxJarRequest, "default")
      .mockImplementation((_) => ({ post: post } as unknown as Request));

    const orderPayload = dummyOrderCreatedPayload;
    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify(orderPayload),
    });

    const signature = "incorrect-sig";
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_created",
      domain: testDomain,
      signature,
    });

    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

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

    const orderPayload = dummyOrderCreatedPayload;

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify(orderPayload),
    });
    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await orderCreated.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(res.statusCode).toBe(200);

    mockJose.mockRestore();
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

    const orderPayload = dummyOrderCreatedPayload;

    orderPayload.order.shippingAddress.country.code = "PL";

    // set mock on next built-in library that build the payload from stream.
    const rawBodyModule = require("next/dist/compiled/raw-body/index.js");
    rawBodyModule.default.mockReturnValue({
      toString: () => JSON.stringify(orderPayload),
    });
    // set body to undefined as the webhook handler expects that
    // the processed body doesn't exist.
    req.body = undefined;

    await orderCreated.default(
      req as unknown as NextApiRequest,
      res as unknown as NextApiResponse
    );

    expect(post).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);

    mockTaxJarRequest.mockRestore();

    mockJose.mockRestore();
  });
});
