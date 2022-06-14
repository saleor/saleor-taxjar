import { countries } from "./data";

export const getCountryCodeFromName = (name: string) =>
  countries.find((country) => country.label === name)?.code;

export const getCountryFromCode = (code: string) =>
  countries.find((country) => country.code === code);
