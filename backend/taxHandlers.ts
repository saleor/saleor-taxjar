import {
  OrderSubscriptionFragment,
  TaxDiscountSubscription,
  TaxBaseLineSubscriptonFragment,
  TaxBaseSubscriptionFragment,
} from "../generated/graphql";
import { createOrderTransaction, fetchTaxes } from "./taxjarApi";
import {
  FetchTaxesLinePayload,
  ResponseTaxPayload,
  TaxJarConfig,
} from "./types";
import {
  getTaxJarConfig,
  taxJarConfigIsValidToUse,
  taxObjectIsValidToUse,
} from "./utils";

const getDiscountForLine = (
  line: TaxBaseLineSubscriptonFragment,
  totalDiscount: number,
  allLinesTotal: number
) => {
  if (totalDiscount === 0 || allLinesTotal === 0) {
    return 0;
  }
  const lineTotalAmount = Number(line.totalPrice.amount);
  const discountAmount = (lineTotalAmount / allLinesTotal) * totalDiscount;
  if (discountAmount > lineTotalAmount) {
    return lineTotalAmount;
  }
  return discountAmount;
};

const prepareLinesPayload = (
  lines: Array<TaxBaseLineSubscriptonFragment>,
  discounts: Array<TaxDiscountSubscription>
): Array<FetchTaxesLinePayload> => {
  const allLinesTotal = lines.reduce(
    (total, current) => total + Number(current.totalPrice.amount),
    0
  );
  const discountsSum =
    discounts?.reduce(
      (total, current) => total + Number(current.amount.amount),
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

    const taxCode =
      line.sourceLine.__typename === "OrderLine"
        ? line.sourceLine.variant!.product.metafield ||
          line.sourceLine.variant!.product.productType.metafield
        : line.sourceLine.productVariant.product.metafield ||
          line.sourceLine.productVariant.product.productType.metafield;
    return {
      id: line.sourceLine.id,
      chargeTaxes: line.chargeTaxes,
      taxCode: taxCode,
      quantity: line.quantity,
      totalAmount: Number(line.totalPrice.amount),
      unitAmount: Number(line.unitPrice.amount),
      discount: discountAmount,
    };
  });
};

export const calculateTaxes = async (
  taxData: TaxBaseSubscriptionFragment,
  taxJarConfig: TaxJarConfig
): Promise<{ data: ResponseTaxPayload }> => {
  const linesWithDiscounts = prepareLinesPayload(
    taxData.lines,
    taxData.discounts
  );
  const linesWithChargeTaxes = linesWithDiscounts.filter(
    (line) => line.chargeTaxes === true
  );

  const taxResponse =
    linesWithChargeTaxes.length !== 0
      ? await fetchTaxes(taxData, linesWithChargeTaxes, taxJarConfig)
      : undefined;
  const taxDetails = taxResponse?.tax.breakdown;
  const shippingDetails = taxDetails?.shipping;

  const shippingPriceGross = shippingDetails
    ? shippingDetails.taxable_amount + shippingDetails.tax_collectable
    : taxData.shippingPrice.amount;
  const shippingPriceNet = shippingDetails
    ? shippingDetails.taxable_amount
    : taxData.shippingPrice.amount;
  const shippingTaxRate = shippingDetails
    ? shippingDetails.combined_tax_rate
    : 0;

  return {
    data: {
      shipping_price_gross_amount: shippingPriceGross.toFixed(2),
      shipping_price_net_amount: shippingPriceNet.toFixed(2),
      shipping_tax_rate: String(shippingTaxRate),
      // lines order needs to be the same as for recieved payload.
      // lines that have chargeTaxes === false will have returned default value
      lines: linesWithDiscounts.map((line) => {
        const lineTax = taxDetails?.line_items?.find((l) => l.id === line.id);
        const totalGrossAmount = lineTax
          ? lineTax.taxable_amount + lineTax.tax_collectable
          : line.totalAmount - line.discount;
        const totalNetAmount = lineTax
          ? lineTax.taxable_amount
          : line.totalAmount - line.discount;
        const taxRate = lineTax ? String(lineTax.combined_tax_rate || 0) : "0";
        return {
          total_gross_amount: totalGrossAmount.toFixed(2),
          total_net_amount: totalNetAmount.toFixed(2),
          tax_rate: taxRate,
        };
      }),
    },
  };
};

export const calculateTaxesHandler = async (
  taxObject: TaxBaseSubscriptionFragment,
  saleorDomain: string
) => {
  const taxJarConfig = await getTaxJarConfig(
    saleorDomain,
    taxObject.channel.slug
  );
  const validData = taxJarConfigIsValidToUse(taxJarConfig);

  if (!validData.isValid) {
    return { body: validData.message, status: validData.status };
  }

  const validTaxObject = taxObjectIsValidToUse(taxObject);
  if (!validTaxObject.isValid) {
    return { body: validData.message, status: validData.status };
  }
  const calculatedTaxes = await calculateTaxes(taxObject, taxJarConfig);
  return { body: calculatedTaxes.data, status: 200 };
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
    return await createOrderTransaction(order, taxJarConfig);
  }
  return {};
};
