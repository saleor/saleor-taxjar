import Taxjar from "taxjar";
import { TaxForOrderRes } from "taxjar/dist/util/types";
import { OrderSubscriptionFragment } from "../generated/graphql";
import { CheckoutPayload, FetchTaxesPayload, TaxJarConfig } from "./types";

export const fetchTaxes = async (
  taxParams: FetchTaxesPayload,
  taxJarConfig: TaxJarConfig
) => {
  const client = new Taxjar({
    apiKey: taxJarConfig.apiKey,
    apiUrl: taxJarConfig.sandbox
      ? Taxjar.SANDBOX_API_URL
      : Taxjar.DEFAULT_API_URL,
  });
  const response: TaxForOrderRes = await client.taxForOrder({
    from_country: taxJarConfig.shipFrom.fromCountry,
    from_zip: taxJarConfig.shipFrom.fromZip,
    from_state: taxJarConfig.shipFrom.fromState,
    from_city: taxJarConfig.shipFrom.fromCity,
    from_street: taxJarConfig.shipFrom.fromStreet,

    to_country: taxParams.address.country,
    to_zip: taxParams.address.postal_code,
    to_state: taxParams.address.country_area,
    to_city: taxParams.address.city,
    to_street: `${taxParams.address.street_address_1} ${taxParams.address.street_address_2}`,
    shipping: Number(taxParams.shipping_amount),
    line_items: taxParams.lines.map((line) => ({
      id: line.id,
      quantity: line.quantity,
      product_tax_code:
        line.product_metadata.taxjar_tax_code ||
        line.product_type_metadata.taxjar_tax_code,
      unit_price: Number(line.unit_amount),
      // FIXME: take into account a discount that we recieve in CheckoutPayload
      discount: 0,
    })),
  });
  return response;
};

export const createOrderTransaction = async (
  order: OrderSubscriptionFragment,
  taxJarConfig: TaxJarConfig
) => {
  const client = new Taxjar({
    apiKey: taxJarConfig.apiKey,
    apiUrl: taxJarConfig.sandbox
      ? Taxjar.SANDBOX_API_URL
      : Taxjar.DEFAULT_API_URL,
  });

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
};
