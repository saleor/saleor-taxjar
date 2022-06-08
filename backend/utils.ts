import { TaxJarConfig } from "./types";

export const getTaxJarConfig = () => {
  const taxJarConfig: TaxJarConfig = {
    shipFrom: {
      fromCountry: process.env.TAXJAR_FROM_COUNTRY!,
      fromZip: process.env.TAXJAR_FROM_ZIP!,
      fromState: process.env.TAXJAR_FROM_STATE!,
      fromCity: process.env.TAXJAR_FROM_CITY!,
      fromStreet: process.env.TAXJAR_FROM_STREET!,
    },
    apiKey: process.env.TAXJAR_API_KEY!,
    sandbox: process.env.TAXJAR_SANDBOX !== "false",
  };
  return taxJarConfig;
};
