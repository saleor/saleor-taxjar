type ProductMetaField = {
  taxjar_tax_code?: string;
};

type ChannelPayload = {
  slug: string;
  currency_code: string;
};
type AddressPayload = {
  first_name: string;
  last_name: string;
  company_name: string;
  street_address_1: string;
  street_address_2: string;
  city: string;
  city_area: string;
  postal_code: string;
  country: string;
  country_area: string;
  phone: string;
};

type DiscountPayload = {
  name?: string;
  amount: string;
};

type CheckoutLinePayload = {
  id: string;
  variant_id: string;
  full_name: string;
  product_name: string;
  variant_name: string;
  product_metadata: ProductMetaField;
  product_type_metadata: ProductMetaField;
  quantity: number;
  sku: string;
  charge_taxes: boolean;
  unit_amount: string;
  total_amount: string;
};

export type CheckoutPayload = {
  id: string;
  channel: ChannelPayload;
  address: AddressPayload;
  user_id: string | null;
  user_public_metadata: Object;
  included_taxes_in_prices: boolean;
  currency: string;
  shipping_amount: string;
  shipping_name: string | null;
  metadata: Object;
  private_metadata: Object;
  discounts: Array<DiscountPayload>;
  lines: Array<CheckoutLinePayload>;
};

export interface CheckoutLineResponsePayload {
  total_gross_amount: string;
  total_net_amount: string;
  tax_rate: string;
}

export interface CheckoutResponsePayload {
  shipping_price_gross_amount: string;
  shipping_price_net_amount: string;
  shipping_tax_rate: string;
  lines: Array<CheckoutLineResponsePayload>;
}

export interface TaxJarAddress {
  fromCountry: string;
  fromZip: string;
  fromState: string;
  fromCity: string;
  fromStreet: string;
}

export interface TaxJarConfig {
  shipFrom: TaxJarAddress;
  apiKey: string;
  sandbox: boolean;
}
