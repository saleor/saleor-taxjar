import { SidebarMenuItem } from "@saleor/macaw-ui";

import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { ConfirmButtonTransitionState } from "@saleor/macaw-ui";

import useApp from "../hooks/useApp";
import { useChannelsQuery } from "../generated/graphql";
import ConfigurationDetails from "../components/templates/ConfigurationDetails";
import { ChannelItem } from "../types/common";
import { ChannelConfigurationPayload } from "../types/api";
import { useFetch } from "@/hooks/useFetch";
import { requestGetConfiguration, requestSetConfiguration } from "@/fetch";

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
    channels?.map((channel) => ({ id: channel.id, label: channel.name })) || [];

  useEffect(() => {
    if (!currentChannel && !!channels?.length) {
      setCurrentChannel(channelItems[0]);
    }
  }, [channelItems.length]);

  const [getConfiguration, getConfigurationFetch] = useFetch(
    requestGetConfiguration,
    {
      skip: !appState?.ready,
    }
  );
  const [setConfiguration, setConfigurationFetch] = useFetch(
    requestSetConfiguration,
    {
      skip: true,
    }
  );

  const configurationData = getConfiguration.data?.data;
  const configuration =
    configurationData && currentChannel && configurationData[currentChannel.id];

  const handleSubmit = async (data: ChannelConfigurationPayload) => {
    if (!currentChannel) {
      return;
    }

    await setConfigurationFetch(data);

    await getConfigurationFetch();
  };

  console.log(configuration);

  const loading =
    !appState?.ready ||
    getConfiguration.loading ||
    setConfiguration.loading ||
    !configuration;
  const error = getConfiguration.error || setConfiguration.error;
  const transitionState: ConfirmButtonTransitionState = loading
    ? "loading"
    : error
    ? "error"
    : "default";

  return (
    <ConfigurationDetails
      configuration={configuration}
      channels={channelItems}
      currentChannel={currentChannel}
      onChannelClick={setCurrentChannel}
      loading={loading}
      saveButtonBarState={transitionState}
      onCancel={() => undefined}
      onSubmit={handleSubmit}
    />
  );
};

export default Configuration;
