import Taxjar from "taxjar";
import { TaxForOrderRes } from "taxjar/dist/util/types";
import {
  OrderSubscriptionFragment,
  TaxBaseSubscriptionFragment,
} from "../generated/graphql";
import { FetchTaxesLinePayload, TaxJarConfig } from "./types";

const getTaxjarClient = (taxJarConfig: TaxJarConfig) =>
  new Taxjar({
    apiKey: taxJarConfig.apiKey,
    apiUrl: taxJarConfig.sandbox
      ? Taxjar.SANDBOX_API_URL
      : Taxjar.DEFAULT_API_URL,
  });

export const fetchTaxes = async (
  taxBase: TaxBaseSubscriptionFragment,
  linesWithChargeTaxes: Array<FetchTaxesLinePayload>,
  taxJarConfig: TaxJarConfig
) => {
  const client = getTaxjarClient(taxJarConfig);
  const response: TaxForOrderRes = await client.taxForOrder({
    from_country: taxJarConfig.shipFrom.fromCountry,
    from_zip: taxJarConfig.shipFrom.fromZip,
    from_state: taxJarConfig.shipFrom.fromState,
    from_city: taxJarConfig.shipFrom.fromCity,
    from_street: taxJarConfig.shipFrom.fromStreet,
    to_country: taxBase.address!.country.code,
    to_zip: taxBase.address!.postalCode,
    to_state: taxBase.address!.countryArea,
    to_city: taxBase.address!.city,
    to_street: `${taxBase.address!.streetAddress1} ${
      taxBase.address!.streetAddress2
    }`,
    shipping: taxBase.shippingPrice.amount,
    line_items: linesWithChargeTaxes.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      product_tax_code: line.taxCode || undefined,
      unit_price: line.unitAmount,
      discount: line.discount,
    })),
  });
  return response;
};

export const createOrderTransaction = async (
  order: OrderSubscriptionFragment,
  taxJarConfig: TaxJarConfig
) => {
  const client = getTaxjarClient(taxJarConfig);

  const address = order.shippingAddress || order.billingAddress!;

  const response = await client.createOrder({
    from_country: taxJarConfig.shipFrom.fromCountry,
    from_zip: taxJarConfig.shipFrom.fromZip,
    from_state: taxJarConfig.shipFrom.fromState,
    from_city: taxJarConfig.shipFrom.fromCity,
    from_street: taxJarConfig.shipFrom.fromStreet,

    to_country: address.country.code,
    to_zip: address.postalCode,
    to_state: address.countryArea,
    to_city: address.city,
    to_street: `${address.streetAddress1} ${address.streetAddress2}`,

    transaction_id: order.id,
    transaction_date: order.created,
    amount: order.total.net.amount,
    shipping: order.shippingPrice.net.amount,
    sales_tax: order.total.tax.amount,
    line_items: order.lines.map((line) => ({
      quantity: line.quantity,
      product_identifier: line.productSku || line.productName,
      description: line.productName,
      unit_price: line.unitPrice.net.amount,
      sales_tax: line.totalPrice.tax.amount,
    })),
  });
  return response;
};
