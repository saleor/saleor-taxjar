import { envVars } from "@/constants";
import { FetchResponse } from "../frontend/hooks/useFetch";
import { getAuthHeaders } from "@/misc/auth";
import { ConfigurationPayload } from "../types/api";

export interface ConfigurationQuery {
  channelId: string | string[];
}

export interface ConfigurationRequest {
  data: ConfigurationPayload;
}

export const requestGetConfiguration = (
  params: ConfigurationQuery
): FetchResponse<ConfigurationRequest> =>
  fetch(`${envVars.appUrl}/api/configuration?channel=${params.channelId}`, {
    method: "GET",
    // @ts-ignore
    headers: getAuthHeaders(),
  });

export const requestSetConfiguration = (
  params: ConfigurationQuery,
  data: ConfigurationRequest
): FetchResponse<ConfigurationRequest> =>
  fetch(`${envVars.appUrl}/api/configuration?channel=${params.channelId}`, {
    method: "POST",
    // @ts-ignore
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
