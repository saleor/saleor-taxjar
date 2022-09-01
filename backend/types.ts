export type FetchTaxesLinePayload = {
  id: string;
  quantity: number;
  taxCode?: string | null;
  discount: number;
  chargeTaxes: boolean;
  unitAmount: number;
  totalAmount: number;
};

export interface LineTaxResponsePayload {
  total_gross_amount: string;
  total_net_amount: string;
  tax_rate: string;
}

export interface ResponseTaxPayload {
  shipping_price_gross_amount: string;
  shipping_price_net_amount: string;
  shipping_tax_rate: string;
  lines: Array<LineTaxResponsePayload>;
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
  active: boolean;
}
