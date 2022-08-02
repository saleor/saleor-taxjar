import {
  ChannelConfigurationPayload,
  ChannelConfigurationPayloadMetadata,
  ConfigurationPayload,
  MetedataField,
} from "@/types/api";
import { PollyConfig, PollyServer } from "@pollyjs/core";
import { reduce } from "lodash";
import path from "path";
import { setupPolly } from "setup-polly-jest";

const HEADERS_BLACKLIST = new Set([
  "authorization",
  "set-cookie",
  "authorization-bearer",
]);
const PROTECTED_FIELDS = [
  {
    field: "apiKey",
    replaceValue: "U2FsdGVkX1+vwewxrCWG98Hnr8Qx/MXEZfUmS6IQEIM=",
  },
];
const tryParse = (data: string | undefined) => {
  try {
    return JSON.parse(data as string);
  } catch (e) {
    return undefined;
  }
};

export const setupPollyMiddleware = (server: PollyServer) => {
  // Hide sensitive data in headers or in body
  server.any().on("beforePersist", (_, recording, event) => {
    const requestHeaders = recording.request.headers.filter(
      (el: Record<string, string>) => !HEADERS_BLACKLIST.has(el.name)
    );

    const responseHeaders = recording.response.headers.filter(
      (el: Record<string, string>) => !HEADERS_BLACKLIST.has(el.name)
    );

    recording.request.headers = requestHeaders;
    recording.response.cookies = [];
    recording.response.headers = responseHeaders;

    const responseData = tryParse(recording.response.content?.text);
    if (
      recording.request.postData.text.includes("FetchAppMetafields") &&
      responseData
    ) {
      const privateMetadata: ConfigurationPayload = reduce(
        responseData.data.app.privateMetafields,
        (filteredChannelsConfiguration, jsonData, channelSlug) => {
          const parsedConfiguration = JSON.parse(jsonData);
          const filteredConfiguration: ChannelConfigurationPayloadMetadata =
            reduce(
              parsedConfiguration,
              (
                resultConfig: ChannelConfigurationPayloadMetadata,
                configValue: MetedataField<ChannelConfigurationPayload>,
                configName: string
              ) => {
                PROTECTED_FIELDS.find((elem) => elem.field === configName);
                const protectedField = PROTECTED_FIELDS.find(
                  (elem) => elem.field === configName
                );
                if (protectedField) {
                  (configValue.value as unknown as string) =
                    protectedField.replaceValue;
                }
                return {
                  ...resultConfig,
                  [configName as keyof ChannelConfigurationPayloadMetadata]:
                    configValue,
                };
              },
              {} as ChannelConfigurationPayloadMetadata
            );
          return {
            ...filteredChannelsConfiguration,
            [channelSlug as keyof ConfigurationPayload]: JSON.stringify(
              filteredConfiguration
            ),
          };
        },
        {}
      );
      responseData.data.app.privateMetafields = privateMetadata;
      recording.response.content.text = JSON.stringify(responseData);
      recording.response.content.size = recording.response.content.text.length;
      recording.response.bodySize = recording.response.content.text.length;
    }
  });
};

export const setupRecording = () => {
  // use replay mode by default, override if POLLY_MODE env variable is passed
  let mode: PollyConfig["mode"] = "replay";
  let recordIfMissing = false;

  switch (process.env.POLLY_MODE) {
    case "record":
      mode = "record";
      recordIfMissing = true;
      break;
    case "replay":
      mode = "replay";
      recordIfMissing = false;
      break;
  }

  if (process.env.CI) {
    mode = "replay";
    recordIfMissing = false;
  }

  return setupPolly({
    // Fix for Jest runtime issues (inline require)
    // https://github.com/gribnoysup/setup-polly-jest/issues/23#issuecomment-890494186
    adapters: [require("@pollyjs/adapter-node-http")],
    persister: require("@pollyjs/persister-fs"),
    mode,
    recordIfMissing,
    flushRequestsOnStop: true,
    recordFailedRequests: true,
    adapterOptions: {
      fetch: {
        context: globalThis,
      },
    },
    persisterOptions: {
      fs: {
        recordingsDir: path.resolve("./__tests__/recordings"),
      },
    },
    matchRequestsBy: {
      method: true,
      headers: false,
      body: true,
      order: true,

      url: {
        protocol: true,
        username: true,
        password: true,
        hostname: true,
        port: true,
        pathname: true,
        query: true,
        hash: false,
      },
    },
  });
};
