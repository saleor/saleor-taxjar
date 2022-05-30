import { OrderSubscriptionFragment } from "../generated/graphql";
import { createOrderTransaction, fetchTaxesForCheckout } from "./taxjarApi";
import {
  CheckoutPayload,
  CheckoutResponsePayload,
  TaxJarConfig,
} from "./types";

export const calculateCheckoutTaxes = async (
  checkoutPayload: CheckoutPayload,
  taxJarConfig: TaxJarConfig
): Promise<{ data: CheckoutResponsePayload }> => {
  const taxResposne = await fetchTaxesForCheckout(
    checkoutPayload,
    taxJarConfig
  );
  const taxDetails = taxResposne.tax.breakdown;
  const shippingDetails = taxDetails?.shipping;
  let shippingPriceGross = Number(checkoutPayload.shipping_amount);
  let shippingPriceNet = Number(checkoutPayload.shipping_amount);
  let shippingTaxRate = 0;

  if (taxDetails !== undefined) {
    if (shippingDetails !== undefined) {
      shippingPriceGross =
        shippingDetails.taxable_amount + shippingDetails.tax_collectable;
      shippingPriceNet = shippingDetails.taxable_amount;
      shippingTaxRate = shippingDetails.combined_tax_rate;
    }
  }

  return {
    data: {
      shipping_price_gross_amount: String(shippingPriceGross),
      shipping_price_net_amount: String(shippingPriceNet),
      shipping_tax_rate: String(shippingTaxRate),
      // lines order needs to be the same as for recieved payload.
      lines: checkoutPayload.lines.map((line) => {
        let totalGrossAmount = line.total_amount;
        let totalNetAmount = line.total_amount;
        let taxRate = "0";
        if (taxDetails !== undefined && taxDetails.line_items !== undefined) {
          const lineTax = taxDetails.line_items.find((l) => l.id === line.id);
          if (lineTax !== undefined) {
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

export const createTaxJarOrder = async (
  order: OrderSubscriptionFragment,
  taxJarConfig: TaxJarConfig
) => {
  const countryCode =
    order.shippingAddress?.country.code || order.billingAddress!.country.code;
  // TaxJar currently supports reporting and filing ONLY in the United States.
  // https://developers.taxjar.com/api/reference/?javascript#transactions
  if (countryCode === "US") {
    await createOrderTransaction(order, taxJarConfig);
  }
};
