import { ChannelConfigurationPayload } from "@/types/api";
import { Address, ChannelConfigurationForm } from "@/types/common";

export const getFormDefaultAddress = (
  configuration: ChannelConfigurationPayload | undefined
): Address => ({
  country: configuration?.shipFromCountry || "",
  zip: configuration?.shipFromZip || "",
  city: configuration?.shipFromCity || "",
  street: configuration?.shipFromStreet || "",
  state: configuration?.shipFromState || "",
});

export const getFormDefaultValues = (
  configuration: ChannelConfigurationPayload | undefined
): ChannelConfigurationForm => ({
  apiKey: configuration?.apiKey || "",
  active: configuration?.active || false,
  sandbox: configuration?.sandbox || true,
  ...getFormDefaultAddress(configuration),
});
