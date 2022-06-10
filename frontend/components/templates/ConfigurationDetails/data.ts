import { ChannelConfigurationPayload } from "@/types/api";

export const getFormDefaultValues = (
  configuration: ChannelConfigurationPayload | undefined
) => ({
  ...configuration,
  street: configuration?.shipFromStreet,
  city: configuration?.shipFromCity,
  state: configuration?.shipFromState,
  zip: configuration?.shipFromZip,
  country: configuration?.shipFromCountry,
});
