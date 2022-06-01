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
  LinePayload,
  DiscountPayload,
  FetchTaxesLinePayload,
} from "./types";

const getDiscountForLine = (
  line: LinePayload,
  totalDiscount: number,
  allLinesTotal: number
) => {
  if (totalDiscount === 0 || allLinesTotal == 0) {
    return 0;
  }
  const lineTotalAmount = Number(line.total_amount);
  const discountAmount = (lineTotalAmount / allLinesTotal) * totalDiscount;
  if (discountAmount > lineTotalAmount) {
    return lineTotalAmount;
  }
  return discountAmount;
};

const prepareLinesPayload = (
  lines: Array<LinePayload>,
  discounts: Array<DiscountPayload>
): Array<FetchTaxesLinePayload> => {
  const allLinesTotal = lines.reduce(
    (total, current) => total + +current.total_amount,
    0
  );
  const discountsSum = discounts?.reduce(
    (total, current) => total + +current.amount,
    0
  ) || 0;

  // Make sure that totalDiscount doesn't exceed a sum of all lines
  const totalDiscount =
    discountsSum <= allLinesTotal ? discountsSum : allLinesTotal;

  return lines.map((line) => {
    const discountAmount = getDiscountForLine(
      line,
      totalDiscount,
      allLinesTotal
    );

    return {
      id: line.id,
      chargeTaxes: line.charge_taxes,
      productMetadata: line.product_metadata,
      productTypeMetadata: line.product_type_metadata,
      quantity: line.quantity,
      totalAmount: Number(line.total_amount),
      unitAmount: Number(line.unit_amount),
      discount: discountAmount,
    };
  });
};

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
        let totalGrossAmount = line.totalAmount - line.discount;
        let totalNetAmount = line.totalAmount - line.discount;
        let taxRate = "0";

        if (taxDetails?.line_items) {
          const lineTax = taxDetails.line_items.find((l) => l.id === line.id);
          if (lineTax) {
            totalGrossAmount = lineTax.taxable_amount + lineTax.tax_collectable;
            totalNetAmount = lineTax.taxable_amount;
            taxRate = String(lineTax.combined_tax_rate);
          }
        }
        return {
          total_gross_amount: totalGrossAmount.toFixed(2),
          total_net_amount: totalNetAmount.toFixed(2),
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
    lines: prepareLinesPayload(checkoutPayload.lines, checkoutPayload.discounts),
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
    lines: prepareLinesPayload(orderPayload.lines, orderPayload.discounts),
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
