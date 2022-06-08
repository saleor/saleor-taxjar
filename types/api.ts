export type ConfigurationPayloadShipFrom = {
  fromCountry: string;
  fromZip: string;
  fromCity: string;
  fromStreet: string;
  fromState: string;
};

export type ChannelConfigurationPayload = {
  apiKey: string;
  active: boolean;
  sandbox: boolean;
  shipFrom: ConfigurationPayloadShipFrom;
};

export type ConfigurationPayload = {
  [channelID in string]: ChannelConfigurationPayload;
};
