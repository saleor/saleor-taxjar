import { createOrderTransaction } from "../../../backend/taxjarApi";
import { getTaxJarConfig } from "../../../backend/utils";
import handler from "../../../pages/api/webhooks/order-created";
import {
  getDummyOrderCreatedPayload,
  getDummyTaxesResponseForCreatedOrder,
  mockRequest,
} from "../../utils";

jest.mock("../../../backend/taxjarApi");

const mockedCreateOrderTransaction = <jest.Mock>createOrderTransaction;

describe("api/webhooks/order-created", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("rejects when saleor domain is missing", async () => {
    const domain = undefined;
    const { req, res } = mockRequest("POST", "order_created", domain);

    const orderPayload = getDummyOrderCreatedPayload();
    req.body = orderPayload;

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedCreateOrderTransaction).not.toHaveBeenCalled();
  });

  it("rejects when saleor event is missing", async () => {
    const event = undefined;
    const { req, res } = mockRequest("POST", event, "example.com");

    const orderPayload = getDummyOrderCreatedPayload();
    req.body = orderPayload;

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedCreateOrderTransaction).not.toHaveBeenCalled();
  });

  it("rejects when saleor signature is empty", async () => {
    const signature = undefined;
    const { req, res } = mockRequest(
      "POST",
      "order_created",
      "example.com",
      signature
    );

    const mockedTaxJarResponseData = getDummyTaxesResponseForCreatedOrder();
    const mockedTaxJarResponse =
      mockedCreateOrderTransaction.mockImplementationOnce(() => {
        return mockedTaxJarResponseData;
      });

    const orderPayload = getDummyOrderCreatedPayload();
    req.body = orderPayload;

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedCreateOrderTransaction).not.toHaveBeenCalled();
  });

  it("rejects when saleor signature is incorrect", async () => {
    const signature = "incorrect-sig";
    const { req, res } = mockRequest(
      "POST",
      "order_created",
      "example.com",
      signature
    );

    const mockedTaxJarResponseData = getDummyTaxesResponseForCreatedOrder();
    const mockedTaxJarResponse =
      mockedCreateOrderTransaction.mockImplementationOnce(() => {
        return mockedTaxJarResponseData;
      });

    const orderPayload = getDummyOrderCreatedPayload();
    req.body = orderPayload;

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedCreateOrderTransaction).not.toHaveBeenCalled();
  });

  it("creates transaction on TaxJar side for new order", async () => {
    const mockedTaxJarResponseData = getDummyTaxesResponseForCreatedOrder();
    const mockedTaxJarResponse =
      mockedCreateOrderTransaction.mockImplementationOnce(() => {
        return mockedTaxJarResponseData;
      });
    const { req, res } = mockRequest("POST", "order_created", "example.com");

    const orderPayload = getDummyOrderCreatedPayload();
    req.body = orderPayload;

    // @ts-ignore
    await handler(req, res);

    expect(mockedCreateOrderTransaction).toHaveBeenCalledWith(
      orderPayload.order,
      getTaxJarConfig()
    );
    expect(res.statusCode).toBe(200);
  });

  it("skips when order has different address than US", async () => {
    const mockedTaxJarResponseData = getDummyTaxesResponseForCreatedOrder();
    const mockedTaxJarResponse =
      mockedCreateOrderTransaction.mockImplementationOnce(() => {
        return mockedTaxJarResponseData;
      });
    const { req, res } = mockRequest("POST", "order_created", "example.com");

    const orderPayload = getDummyOrderCreatedPayload();

    orderPayload.order.shippingAddress.country.code = "PL";
    req.body = orderPayload;

    // @ts-ignore
    await handler(req, res);

    expect(mockedCreateOrderTransaction).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });
});
