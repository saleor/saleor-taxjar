import { fetchTaxes } from "../../../backend/taxjarApi";
import { ResponseTaxPayload } from "../../../backend/types";
import { getTaxJarConfig } from "../../../backend/utils";
import handler from "../../../pages/api/webhooks/order-calculate-taxes";
import {
  dummyFetchTaxesPayload,
  dummyFetchTaxesResponse,
  dummyOrderPayload,
  mockRequest,
} from "../../utils";

jest.mock("../../../backend/taxjarApi");

const mockedFetchTaxes = <jest.Mock>fetchTaxes;

describe("api/webhooks/order-calculate-taxes", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("rejects when saleor domain is missing", async () => {
    const domain = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain,
    });

    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedFetchTaxes).not.toHaveBeenCalled();
  });

  it("rejects when saleor event is missing", async () => {
    const event = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event,
      domain: "example.com",
    });

    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedFetchTaxes).not.toHaveBeenCalled();
  });

  it("rejects when saleor signature is empty", async () => {
    const signature = undefined;
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: "example.com",
      signature,
    });

    const mockedTaxJarResponseData = dummyFetchTaxesResponse;
    const mockedTaxJarResponse = mockedFetchTaxes.mockImplementationOnce(() => {
      return mockedTaxJarResponseData;
    });
    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedFetchTaxes).not.toHaveBeenCalled();
  });

  it("rejects when saleor signature is incorrect", async () => {
    const signature = "incorrect-sig";
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: "example.com",
      signature,
    });

    const mockedTaxJarResponseData = dummyFetchTaxesResponse;
    const mockedTaxJarResponse = mockedFetchTaxes.mockImplementationOnce(() => {
      return mockedTaxJarResponseData;
    });
    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedFetchTaxes).not.toHaveBeenCalled();
  });

  it("fetches taxes for order", async () => {
    const mockedTaxJarResponseData = dummyFetchTaxesResponse;
    const mockedTaxJarResponse = mockedFetchTaxes.mockImplementationOnce(() => {
      return mockedTaxJarResponseData;
    });
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: "example.com",
    });

    const orderPayload = dummyOrderPayload;
    req.body = [orderPayload];

    // @ts-ignore
    await handler(req, res);

    expect(mockedFetchTaxes).toHaveBeenCalledWith(
      dummyFetchTaxesPayload,
      getTaxJarConfig()
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
    const mockedTaxJarResponseData = dummyFetchTaxesResponse;
    const mockedTaxJarResponse = mockedFetchTaxes.mockImplementationOnce(() => {
      return mockedTaxJarResponseData;
    });
    const { req, res } = mockRequest({
      method: "POST",
      event: "order_calculate_taxes",
      domain: "example.com",
    });

    const orderPayload = dummyOrderPayload;
    orderPayload.discounts = [{amount: "2"}, {amount: "1"}]
    const linePayload = orderPayload.lines[0]
    orderPayload.lines = [linePayload, linePayload]

    req.body = [orderPayload];

    // @ts-ignore
    await handler(req, res);

    const fetchTaxesLine = dummyFetchTaxesPayload.lines[0]
    fetchTaxesLine.discount = 1.5;
    dummyFetchTaxesPayload.lines = [fetchTaxesLine, fetchTaxesLine]

    expect(mockedFetchTaxes).toHaveBeenCalledWith(
      dummyFetchTaxesPayload,
      getTaxJarConfig()
    );
    expect(res.statusCode).toBe(200);
  });
});
