import { configurationEncryptedFields } from "@/config";
import { serverEnvVars } from "@/constants";
import {
  ChannelConfigurationPayload,
  ChannelConfigurationPayloadMetadata,
  MetedataField,
} from "@/types/api";
import CryptoJS from "crypto-js";

export const PLACEHOLDER = "••••";

export const obfuscateValue = (value: string) => {
  if (!value) {
    return "";
  }
  const unobfuscatedLength = Math.min(4, value.length - 4);

  // if value is 4 characters or less, obfuscate entire value
  if (unobfuscatedLength <= 0) {
    return PLACEHOLDER;
  }

  const unobfuscatedValue = value.slice(-unobfuscatedLength);

  return PLACEHOLDER + " " + unobfuscatedValue;
};

export const encryptConfigurationValue = (
  configurationKey: keyof ChannelConfigurationPayload,
  configurationValue: string | boolean
): MetedataField<string | boolean> => {
  if (
    typeof configurationValue === "boolean" ||
    !configurationEncryptedFields.includes(configurationKey)
  ) {
    return {
      encrypted: false,
      value: configurationValue,
    };
  }
  return {
    encrypted: true,
    value:
      CryptoJS.AES.encrypt(
        configurationValue,
        serverEnvVars.settingsEncryptionSecret
      ).toString() || "",
  };
};

export const decryptConfigurationValue = (
  configurationValue: MetedataField<string | boolean>,
  obfuscateEncryptedData: boolean
) => {
  if (
    !configurationValue.encrypted ||
    typeof configurationValue.value === "boolean"
  ) {
    return configurationValue.value;
  }

  const decrypted =
    CryptoJS.AES.decrypt(
      configurationValue.value,
      serverEnvVars.settingsEncryptionSecret
    ).toString(CryptoJS.enc.Utf8) || "";

  if (obfuscateEncryptedData) {
    return obfuscateValue(decrypted);
  }

  return decrypted;
};

export const encryptConfiguration = (
  configuration: ChannelConfigurationPayload
) => {
  return Object.entries(configuration).reduce(
    (encryptedConfiguration, [key, value]) => {
      return {
        ...encryptedConfiguration,
        [key as keyof ChannelConfigurationPayload]: encryptConfigurationValue(
          key as keyof ChannelConfigurationPayload,
          value
        ),
      };
    },
    {} as ChannelConfigurationPayloadMetadata
  );
};

export const decryptConfiguration = (
  configuration: ChannelConfigurationPayloadMetadata,
  obfuscateEncryptedData: boolean
) => {
  return Object.entries(configuration).reduce(
    (decryptedConfiguration, [key, value]) => {
      return {
        ...decryptedConfiguration,
        [key as keyof ChannelConfigurationPayload]: decryptConfigurationValue(
          value,
          obfuscateEncryptedData
        ),
      };
    },
    {} as ChannelConfigurationPayload
  );
};
