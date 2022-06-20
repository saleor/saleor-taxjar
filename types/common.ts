import { ChannelConfigurationBase } from "./api";

export interface Item {
  id: string;
  label: string;
}

export type ChannelItem = {
  id: string;
  label: string;
};

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export type ChannelConfigurationForm = ChannelConfigurationBase & Address;
