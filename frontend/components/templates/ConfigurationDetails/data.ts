import { ChannelConfigurationPayload } from "@/types/api";

export const getFormDefaultValues = (
  configuration: ChannelConfigurationPayload | undefined
) => ({
  ...configuration,
  street: configuration?.shipFrom.fromStreet,
  city: configuration?.shipFrom.fromCity,
  state: configuration?.shipFrom.fromState,
  zip: configuration?.shipFrom.fromZip,
  country: configuration?.shipFrom.fromCountry,
});
