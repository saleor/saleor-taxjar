import { check } from "prettier";
import { TaxForOrderRes } from "taxjar/dist/util/types";
import { OrderSubscriptionFragment } from "../generated/graphql";
import { createOrderTransaction, fetchTaxes } from "./taxjarApi";
import {
  CheckoutPayload,
  ResponseTaxPayload,
  FetchTaxesPayload,
  TaxJarConfig,
  OrderPayload,
} from "./types";

const calculateTaxes = async (
  taxData: FetchTaxesPayload,
  taxJarConfig: TaxJarConfig
): Promise<{ data: ResponseTaxPayload }> => {
  const taxResposne = await fetchTaxes(taxData, taxJarConfig);
  const taxDetails = taxResposne.tax.breakdown;
  const shippingDetails = taxDetails?.shipping;

  let shippingPriceGross = taxData.shipping_amount;
  let shippingPriceNet = taxData.shipping_amount;
  let shippingTaxRate = "0";

  if (shippingDetails) {
    shippingPriceGross = String(
      shippingDetails.taxable_amount + shippingDetails.tax_collectable
    );
    shippingPriceNet = String(shippingDetails.taxable_amount);
    shippingTaxRate = String(shippingDetails.combined_tax_rate);
  }

  return {
    data: {
      shipping_price_gross_amount: shippingPriceGross,
      shipping_price_net_amount: shippingPriceNet,
      shipping_tax_rate: shippingTaxRate,
      // lines order needs to be the same as for recieved payload.
      lines: taxData.lines.map((line) => {
        let totalGrossAmount = line.total_amount;
        let totalNetAmount = line.total_amount;
        let taxRate = "0";

        if (taxDetails?.line_items) {
          const lineTax = taxDetails.line_items.find((l) => l.id === line.id);
          if (lineTax) {
            totalGrossAmount = String(
              lineTax.taxable_amount + lineTax.tax_collectable
            );
            totalNetAmount = String(lineTax.taxable_amount);
            taxRate = String(lineTax.combined_tax_rate);
          }
        }
        return {
          total_gross_amount: totalGrossAmount,
          total_net_amount: totalNetAmount,
          tax_rate: taxRate,
        };
      }),
    },
  };
};

export const calculateCheckoutTaxes = async (
  checkoutPayload: CheckoutPayload,
  taxJarConfig: TaxJarConfig
): Promise<{ data: ResponseTaxPayload }> => {
  const taxData: FetchTaxesPayload = {
    address: checkoutPayload.address,
    lines: checkoutPayload.lines,
    channel: checkoutPayload.channel,
    shipping_amount: checkoutPayload.shipping_amount,
    shipping_name: checkoutPayload.shipping_name,
  };
  return await calculateTaxes(taxData, taxJarConfig);
};

export const calculateOrderTaxes = async (
  orderPayload: OrderPayload,
  taxJarConfig: TaxJarConfig
): Promise<{ data: ResponseTaxPayload }> => {
  const taxData: FetchTaxesPayload = {
    address: orderPayload.address,
    lines: orderPayload.lines,
    channel: orderPayload.channel,
    shipping_amount: orderPayload.shipping_amount,
    shipping_name: orderPayload.shipping_name,
  };
  return await calculateTaxes(taxData, taxJarConfig);
};

export const createTaxJarOrder = (
  order: OrderSubscriptionFragment,
  taxJarConfig: TaxJarConfig
) => {
  const countryCode =
    order.shippingAddress?.country.code || order.billingAddress!.country.code;
  // TaxJar currently supports reporting and filing ONLY in the United States.
  // https://developers.taxjar.com/api/reference/?javascript#transactions
  if (countryCode === "US") {
    createOrderTransaction(order, taxJarConfig);
  }
};
