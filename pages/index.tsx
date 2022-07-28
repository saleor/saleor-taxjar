import { SidebarMenuItem } from "@saleor/macaw-ui";

import { ConfirmButtonTransitionState } from "@saleor/macaw-ui";
import type { NextPage } from "next";
import { useEffect, useState } from "react";

import { requestGetConfiguration, requestSetConfiguration } from "@/fetch";
import { useFetch } from "@/frontend/hooks/useFetch";
import { getCommonErrors } from "@/frontend/utils";
import { CombinedError } from "urql";
import ConfigurationDetails, {
  LoadingState,
} from "../frontend/components/templates/ConfigurationDetails";
import useApp from "../frontend/hooks/useApp";
import { useChannelsQuery } from "../generated/graphql";
import { ChannelConfigurationPayload } from "../types/api";
import { ChannelItem } from "../types/common";

export const menu: SidebarMenuItem[] = [
  {
    ariaLabel: "Menu 1",
    id: "menu1",
    label: "Menu 1",
    url: "/section1/",
  },
  {
    ariaLabel: "Menu 2",
    id: "menu2",
    label: "Menu 2",
  },
];

const Configuration: NextPage = () => {
  const appState = useApp()?.getState();
  const [currentChannel, setCurrentChannel] = useState<ChannelItem>();
  const [channelsQuery] = useChannelsQuery({
    pause: !appState?.ready,
  });

  const channels = channelsQuery.data?.channels || [];
  const channelItems =
    channels?.map((channel) => ({
      id: channel.slug,
      label: channel.name,
    })) || [];

  useEffect(() => {
    if (!currentChannel && !!channels?.length) {
      setCurrentChannel(channelItems[0]);
    }
  }, [channelItems.length]);

  const [getConfiguration, getConfigurationFetch] = useFetch(
    () =>
      requestGetConfiguration({
        channelSlug: currentChannel?.id || "",
      }),
    {
      skip: !appState?.ready || !currentChannel?.id,
    }
  );
  const [setConfiguration, setConfigurationFetch] = useFetch(
    (data) =>
      requestSetConfiguration(
        {
          channelSlug: currentChannel?.id || "",
        },
        data
      ),
    {
      skip: true,
    }
  );

  const configurationData = getConfiguration.data?.data;
  const configuration =
    configurationData && currentChannel && configurationData[currentChannel.id];

  useEffect(() => {
    if (currentChannel?.id) {
      getConfigurationFetch();
    }
  }, [currentChannel]);

  const handleSubmit = async (data: ChannelConfigurationPayload) => {
    if (!currentChannel) {
      return;
    }

    await setConfigurationFetch({
      data: {
        ...configurationData,
        [currentChannel.id]: data,
      },
    });

    await getConfigurationFetch();
  };

  const loading: LoadingState = {
    sidebar: !appState?.ready || channelsQuery.fetching,
    configuration:
      !appState?.ready ||
      channelsQuery.fetching ||
      getConfiguration.loading ||
      setConfiguration.loading ||
      !configuration,
  };
  const errors = [
    ...getCommonErrors(channelsQuery.error),
    ...getCommonErrors(getConfiguration.error as Partial<CombinedError>),
    ...getCommonErrors(setConfiguration.error as Partial<CombinedError>),
  ];
  const transitionState: ConfirmButtonTransitionState =
    loading.sidebar || loading.configuration
      ? "loading"
      : !!errors.length
      ? "error"
      : "default";

  return (
    <ConfigurationDetails
      configuration={configuration}
      channels={channelItems}
      currentChannel={currentChannel}
      onChannelClick={setCurrentChannel}
      loading={loading}
      errors={errors}
      saveButtonBarState={transitionState}
      onCancel={() => undefined}
      onSubmit={handleSubmit}
    />
  );
};

export default Configuration;
