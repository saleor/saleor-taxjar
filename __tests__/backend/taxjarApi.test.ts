import _default from "taxjar/dist/util/request";
import { createOrderTransaction, fetchTaxes } from "../../backend/taxjarApi";
import { TaxJarConfig } from "../../backend/types";
import { getTaxJarConfig } from "../../backend/utils";
import {
  dummyFetchTaxesPayload,
  dummyFetchTaxesResponse,
  dummyOrderCreatedPayload,
  dummyTaxJarConfig,
} from "../utils";
import { TaxForOrderRes } from "taxjar/dist/util/types";

jest.mock("taxjar/dist/util/request");

const mockedTaxJarRequest = <jest.Mock>_default;

describe("TaxJar API handlers", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetches taxes from taxjar", async () => {
    const mockedTaxJarResponseData = dummyFetchTaxesResponse;
    const post = jest.fn((url: any, params: any) => ({
      mockedTaxJarResponseData,
    }));
    const mockedTaxJarResponse = mockedTaxJarRequest.mockImplementationOnce(
      () => ({
        post: post,
      })
    );

    const payload = dummyFetchTaxesPayload;
    const config: TaxJarConfig = dummyTaxJarConfig;

    const response = await fetchTaxes(payload, config);

    expect(post).toHaveBeenCalledWith({
      params: {
        from_city: "Wroclaw",
        from_country: "PL",
        from_state: "",
        from_street: "Teczowa 7",
        from_zip: "50-601",
        line_items: [
          {
            discount: 0,
            id: "Q2hlY2tvdXRMaW5lOjU=",
            product_tax_code: undefined,
            quantity: 1,
            unit_price: 28,
          },
        ],
        shipping: 10,
        to_city: "POOLE",
        to_country: "GB",
        to_state: "",
        to_street: "8559 Lakes Avenue ",
        to_zip: "BH15 1AB",
      },
      url: "taxes",
    });
  });

  it("takes into account discounts", async () => {
    const mockedTaxJarResponseData = dummyFetchTaxesResponse;
    const post = jest.fn((url: any, params: any) => ({
      mockedTaxJarResponseData,
    }));
    const mockedTaxJarResponse = mockedTaxJarRequest.mockImplementationOnce(
      () => ({
        post: post,
      })
    );

    const payload = dummyFetchTaxesPayload;
    payload.lines[0].discount = 3.33;

    const config: TaxJarConfig = dummyTaxJarConfig;

    const response = await fetchTaxes(payload, config);

    expect(post).toHaveBeenCalledWith({
      params: {
        from_city: "Wroclaw",
        from_country: "PL",
        from_state: "",
        from_street: "Teczowa 7",
        from_zip: "50-601",
        line_items: [
          {
            discount: 3.33,
            id: "Q2hlY2tvdXRMaW5lOjU=",
            product_tax_code: undefined,
            quantity: 1,
            unit_price: 28,
          },
        ],
        shipping: 10,
        to_city: "POOLE",
        to_country: "GB",
        to_state: "",
        to_street: "8559 Lakes Avenue ",
        to_zip: "BH15 1AB",
      },
      url: "taxes",
    });
  });

  it("creates transaction on TaxJar side", () => {
    dummyOrderCreatedPayload;
    const post = jest.fn((url: any, params: any) => ({}));
    const mockedTaxJarResponse = mockedTaxJarRequest.mockImplementationOnce(
      () => ({
        post: post,
      })
    );

    const config = dummyTaxJarConfig

    createOrderTransaction(dummyOrderCreatedPayload.order, config);

    expect(post).toHaveBeenCalledWith({
      params: {
        amount: 99.22,
        from_city: "Wroclaw",
        from_country: "PL",
        from_state: "",
        from_street: "Teczowa 7",
        from_zip: "50-601",
        line_items: [
          {
            description: "Bean Juice",
            product_identifier: "21438542",
            quantity: 1,
            sales_tax: 0,
            unit_price: 16.8,
          },
        ],
        sales_tax: 0,
        shipping: 82.42,
        to_city: "POOLE",
        to_country: "US",
        to_state: "",
        to_street: "8559 Lakes Avenue ",
        to_zip: "BH15 1AB",
        transaction_date: "2022-05-27T08:30:44.890527+00:00",
        transaction_id:
          "T3JkZXI6ZThkYWJjMDItYmM3Zi00ZWZjLWFlODgtYWJjMTUwMmE2Zjdm",
      },
      url: "transactions/orders",
    });
  });
});
