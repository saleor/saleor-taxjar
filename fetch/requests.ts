import { envVars } from "@/constants";
import { FetchResponse } from "../hooks/useFetch";
import { getAuthHeaders } from "@/misc/auth";
import {
  ChannelConfigurationPayload,
  ConfigurationPayload,
} from "../types/api";

export interface ConfigurationResult {
  data: ConfigurationPayload;
}

export const requestGetConfiguration = (): FetchResponse<ConfigurationResult> =>
  fetch(`${envVars.appUrl}/api/configuration`, {
    method: "GET",
    // @ts-ignore
    headers: getAuthHeaders(),
  });

export const requestSetConfiguration = (
  data: ChannelConfigurationPayload
): FetchResponse<ConfigurationResult> =>
  fetch(`${envVars.appUrl}/api/configuration`, {
    method: "POST",
    // @ts-ignore
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
