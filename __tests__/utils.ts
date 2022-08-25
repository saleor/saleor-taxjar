import { TaxBaseSubscriptionFragment } from "@/generated/graphql";
import { createMocks, RequestMethod } from "node-mocks-http";
import { TaxForOrderRes } from "taxjar/dist/types/returnTypes";
import { TaxJarConfig } from "../backend/types";

type RequestConfiguration = {
  method: RequestMethod;
  event?: string;
  domain?: string;
  signature?: string;
};
export const mockRequest = (configuration: RequestConfiguration) => {
  const method = configuration.method;
  const { req, res } = createMocks({ method });
  req.headers = {
    "content-type": "application/json",
  };
  if (configuration.domain !== undefined) {
    req.headers["saleor-domain"] = configuration.domain;
  }
  if (configuration.event !== undefined) {
    req.headers["saleor-event"] = configuration.event;
  }
  if (configuration.signature !== undefined) {
    req.headers["saleor-signature"] = configuration.signature;
  }

  return { req, res };
};

export const dummyOrderPayload: TaxBaseSubscriptionFragment = {
  currency: "USD",
  channel: { slug: "default-channel" },
  discounts: [],
  address: {
    streetAddress1: "8559 Lakes Avenue",
    streetAddress2: "",
    city: "POOLE",
    country: { code: "GB" },
    countryArea: "",
    postalCode: "BH15 1AB",
  },
  shippingPrice: { amount: 10.0 },
  lines: [
    {
      chargeTaxes: true,
      sourceLine: {
        __typename: "OrderLine",
        id: "T3JkZXJMaW5lOjhjNDBlOTJiLWYzNzEtNDRhNS05NTYwLWM2YzQ3ODU1YTI4Ng==",
        variant: {
          id: "UHJvZHVjdFZhcmlhbnQ6Mzg0",
          product: { metafield: null, productType: { metafield: null } },
        },
      },
      quantity: 1,
      unitPrice: { amount: 28.0 },
      totalPrice: { amount: 28.0 },
    },
  ],
};

export const dummyFetchTaxesPayload: TaxBaseSubscriptionFragment = {
  currency: "USD",
  channel: { slug: "default-channel" },
  discounts: [],
  address: {
    streetAddress1: "8559 Lakes Avenue",
    streetAddress2: "",
    city: "POOLE",
    country: { code: "GB" },
    countryArea: "",
    postalCode: "BH15 1AB",
  },
  shippingPrice: { amount: 10.0 },
  lines: [
    {
      chargeTaxes: true,
      sourceLine: {
        __typename: "CheckoutLine",
        id: "Q2hlY2tvdXRMaW5lOjU=",
        productVariant: {
          id: "UHJvZHVjdFZhcmlhbnQ6Mzg0",
          product: { metafield: null, productType: { metafield: null } },
        },
      },
      quantity: 1,
      unitPrice: { amount: 28.0 },
      totalPrice: { amount: 28.0 },
    },
  ],
};

export const dummyFetchTaxesResponse: TaxForOrderRes = {
  tax: {
    exemption_type: null,
    order_total_amount: 38.0,
    shipping: 10.0,
    taxable_amount: 38.0,
    amount_to_collect: 8.74,
    rate: 0.23,
    has_nexus: true,
    freight_taxable: true,
    tax_source: "destination",
    jurisdictions: {
      country: "PL",
      city: "MARSEILLE",
    },
    breakdown: {
      taxable_amount: 38.0,
      tax_collectable: 8.74,
      combined_tax_rate: 0.23,
      country_taxable_amount: 38.0,
      country_tax_rate: 0.23,
      country_tax_collectable: 8.74,
      shipping: {
        taxable_amount: 10.0,
        tax_collectable: 2.3,
        combined_tax_rate: 0.23,
        state_taxable_amount: 1.5,
        state_sales_tax_rate: 0.23,
        state_amount: 0,
        special_taxable_amount: 0,
        special_tax_rate: 0,
        special_district_amount: 0,
        county_taxable_amount: 0,
        county_tax_rate: 0,
        county_amount: 0,
        city_taxable_amount: 0,
        city_tax_rate: 0,
        city_amount: 0,
      },
      line_items: [
        {
          id: "Q2hlY2tvdXRMaW5lOjU=",
          taxable_amount: 28.0,
          tax_collectable: 6.44,
          combined_tax_rate: 0.23,
          country_taxable_amount: 28.0,
          country_tax_rate: 0.23,
          country_tax_collectable: 6.44,
        },
      ],
    },
  },
};

export const dummyOrderCreatedPayload = {
  __typename: "OrderCreated",
  order: {
    id: "T3JkZXI6ZThkYWJjMDItYmM3Zi00ZWZjLWFlODgtYWJjMTUwMmE2Zjdm",
    userEmail: "test1@test.com",
    created: "2022-05-27T08:30:44.890527+00:00",
    channel: {
      id: "Q2hhbm5lbDoy",
      slug: "channel-pln",
    },
    shippingAddress: {
      id: "QWRkcmVzczo4Mw==",
      firstName: "Ann22a",
      lastName: "Joa22nna",
      streetAddress1: "8559 Lakes Avenue",
      streetAddress2: "",
      city: "Washington",
      countryArea: "DC",
      postalCode: "20500",
      country: {
        code: "US",
      },
    },
    billingAddress: {
      id: "QWRkcmVzczo4NQ==",
      firstName: "Ann22a",
      lastName: "Joa22nna",
      streetAddress1: "8559 Lakes Avenue",
      streetAddress2: "",
      city: "POOLE",
      countryArea: "",
      postalCode: "BH15 1AB",
      country: {
        code: "US",
      },
    },
    total: {
      net: {
        amount: 99.22,
      },
      tax: {
        amount: 0,
      },
    },
    shippingPrice: {
      net: {
        amount: 82.42,
      },
    },
    lines: [
      {
        productSku: "21438542",
        productName: "Bean Juice",
        quantity: 1,
        unitPrice: {
          net: {
            amount: 16.8,
          },
        },
        totalPrice: {
          tax: {
            amount: 0,
          },
        },
      },
    ],
  },
};

export const dummyTaxesResponseForCreatedOrder = {
  order: {
    transaction_id: "T3JkZXI6ZjIxNGE1MzgtZTJmMS00NGQ1LTljNGQtMDgwODFlZTNiYTI1",
    user_id: 189995,
    provider: "api",
    transaction_date: "2022-05-24T12:10:06.084Z",
    transaction_reference_id: null,
    customer_id: null,
    exemption_type: null,
    from_country: "US",
    from_zip: null,
    from_state: null,
    from_city: null,
    from_street: null,
    to_country: "US",
    to_zip: "90002",
    to_state: "CA",
    to_city: "LOS ANGELES",
    to_street: "123 Palm Grove Ln",
    amount: "46.5",
    shipping: "1.5",
    sales_tax: "3.8",
    line_items: [
      {
        id: 0,
        quantity: 3,
        product_identifier: "12-34234-9",
        product_tax_code: null,
        description: "Fuzzy Widget",
        unit_price: "15.0",
        discount: "0.0",
        sales_tax: "3.45",
      },
    ],
  },
};

export const dummyTaxJarConfig: TaxJarConfig = {
  shipFrom: {
    fromCountry: "PL",
    fromZip: "50-601",
    fromState: "",
    fromCity: "Wroclaw",
    fromStreet: "Teczowa 7",
  },
  apiKey: "dummyKey",
  active: true,
  sandbox: true,
};
