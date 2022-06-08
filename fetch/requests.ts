import { envVars } from "@/constants";
import { FetchResponse } from "../frontend/hooks/useFetch";
import { getAuthHeaders } from "@/misc/auth";
import { ConfigurationPayload } from "../types/api";

export interface ConfigurationRequest {
  data: ConfigurationPayload;
}

export const requestGetConfiguration =
  (): FetchResponse<ConfigurationRequest> =>
    fetch(`${envVars.appUrl}/api/configuration`, {
      method: "GET",
      // @ts-ignore
      headers: getAuthHeaders(),
    });

export const requestSetConfiguration = (
  data: ConfigurationRequest
): FetchResponse<ConfigurationRequest> =>
  fetch(`${envVars.appUrl}/api/configuration`, {
    method: "POST",
    // @ts-ignore
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
