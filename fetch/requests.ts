import { getAuthHeaders } from "@/misc/auth";
import { FetchResponse } from "../frontend/hooks/useFetch";
import { ConfigurationPayload } from "../types/api";

export interface ConfigurationQuery {
  channelSlug: string | string[];
}

export interface ConfigurationRequest {
  data: ConfigurationPayload;
}

export const requestGetConfiguration = (
  params: ConfigurationQuery
): FetchResponse<ConfigurationRequest> =>
  fetch(`/api/configuration?channel=${params.channelSlug}`, {
    method: "GET",
    // @ts-ignore
    headers: getAuthHeaders(),
  });

export const requestSetConfiguration = (
  params: ConfigurationQuery,
  data: ConfigurationRequest
): FetchResponse<ConfigurationRequest> =>
  fetch(`/api/configuration?channel=${params.channelSlug}`, {
    method: "POST",
    // @ts-ignore
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
