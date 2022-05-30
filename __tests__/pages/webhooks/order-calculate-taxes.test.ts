import { fetchTaxes } from "../../../backend/taxjarApi";
import { ResponseTaxPayload } from "../../../backend/types";
import { getTaxJarConfig } from "../../../backend/utils";
import handler from "../../../pages/api/webhooks/order-calculate-taxes";
import {
  getDummyFetchTaxesPayload,
  getDummyFetchTaxesResponse,
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
    const { req, res } = mockRequest("POST", "order_calculate_taxes", domain);

    const orderPayload = getDummyFetchTaxesPayload();
    req.body = [orderPayload];

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedFetchTaxes).not.toHaveBeenCalled();
  });

  it("rejects when saleor event is missing", async () => {
    const event = undefined;
    const { req, res } = mockRequest("POST", event, "example.com");

    const orderPayload = getDummyFetchTaxesPayload();
    req.body = [orderPayload];

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedFetchTaxes).not.toHaveBeenCalled();
  });

  it("rejects when saleor signature is empty", async () => {
    const signature = undefined;
    const { req, res } = mockRequest(
      "POST",
      "order_calculate_taxes",
      "example.com",
      signature
    );

    const mockedTaxJarResponseData = getDummyFetchTaxesResponse();
    const mockedTaxJarResponse = mockedFetchTaxes.mockImplementationOnce(() => {
      return mockedTaxJarResponseData;
    });
    const orderPayload = getDummyFetchTaxesPayload();
    req.body = [orderPayload];

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedFetchTaxes).not.toHaveBeenCalled();
  });

  it("rejects when saleor signature is incorrect", async () => {
    const signature = "incorrect-sig";
    const { req, res } = mockRequest(
      "POST",
      "order_calculate_taxes",
      "example.com",
      signature
    );

    const mockedTaxJarResponseData = getDummyFetchTaxesResponse();
    const mockedTaxJarResponse = mockedFetchTaxes.mockImplementationOnce(() => {
      return mockedTaxJarResponseData;
    });
    const orderPayload = getDummyFetchTaxesPayload();
    req.body = [orderPayload];

    // @ts-ignore
    await handler(req, res);

    expect(res.statusCode).toBe(400);
    expect(mockedFetchTaxes).not.toHaveBeenCalled();
  });

  it("fetches taxes for order", async () => {
    const mockedTaxJarResponseData = getDummyFetchTaxesResponse();
    const mockedTaxJarResponse = mockedFetchTaxes.mockImplementationOnce(() => {
      return mockedTaxJarResponseData;
    });
    const { req, res } = mockRequest(
      "POST",
      "order_calculate_taxes",
      "example.com"
    );

    const orderPayload = getDummyFetchTaxesPayload();
    req.body = [orderPayload];

    // @ts-ignore
    await handler(req, res);

    expect(mockedFetchTaxes).toHaveBeenCalledWith(
      orderPayload,
      getTaxJarConfig()
    );
    const data: ResponseTaxPayload = res._getJSONData();

    expect(data.shipping_price_gross_amount).toBe("12.3");
    expect(data.shipping_price_net_amount).toBe("10");
    expect(data.shipping_tax_rate).toBe("0.23");
    expect(data.lines.length).toBe(1);
    expect(data.lines[0].total_gross_amount).toBe("34.44");
    expect(data.lines[0].total_net_amount).toBe("28");
    expect(data.lines[0].tax_rate).toBe("0.23");
    expect(res.statusCode).toBe(200);
  });
});
