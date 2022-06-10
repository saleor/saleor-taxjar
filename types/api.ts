export type ConfigurationPayloadShipFrom = {
  shipFromCountry: string;
  shipFromZip: string;
  shipFromCity: string;
  shipFromStreet: string;
  shipFromState: string;
};

export type ChannelConfigurationPayload = {
  apiKey: string;
  active: boolean;
  sandbox: boolean;
} & ConfigurationPayloadShipFrom;

export type MetedataField<T> = {
  encrypted: boolean;
  value: T;
};

export type ChannelConfigurationPayloadMetadata = {
  [K in keyof ChannelConfigurationPayload]: MetedataField<
    ChannelConfigurationPayload[K]
  >;
};

export type ConfigurationPayload = {
  [channelID in string]: ChannelConfigurationPayload;
};

export type ConfigurationMetadata = {
  [channelID in string]: string;
};
