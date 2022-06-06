import { SidebarMenuItem } from "@saleor/macaw-ui";

import type { NextPage } from "next";
import { useEffect, useState, ChangeEvent, SyntheticEvent } from "react";
import {
  CardContent,
  TextField,
  FormGroup,
  FormControlLabel,
  Switch,
} from "@material-ui/core";
import {
  ConfirmButton,
  ConfirmButtonTransitionState,
  makeStyles,
} from "@saleor/macaw-ui";

import { SALEOR_DOMAIN_HEADER } from "../constants";
import useApp from "../hooks/useApp";
import { useChannelsQuery } from "../generated/graphql";
import AppLayout from "../frontend/components/elements/AppLayout";

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

// FIXME: should be shared between this and backend
type ConfigurationPayloadShipFrom = {
  fromCountry: string;
  fromZip: string;
  fromCity: string;
  fromStreet: string;
  fromState: string;
};

type ChannelConfigurationPayload = {
  apiKey: string;
  active: boolean;
  sandbox: boolean;
  shipFrom: ConfigurationPayloadShipFrom;
};

type ConfigurationPayload = {
  [channelID in string]: ChannelConfigurationPayload;
};

type ChannelItem = {
  id: string;
  label: string;
};

const useStyles = makeStyles((theme) => ({
  confirmButton: {
    marginLeft: "auto",
  },
  fieldContainer: {
    marginBottom: theme.spacing(2),
  },
}));

const Configuration: NextPage = () => {
  const classes = useStyles();
  const appState = useApp()?.getState();
  const [channelsQuery] = useChannelsQuery({
    pause: !appState?.ready,
  });
  const [configuration, setConfiguration] =
    useState<ChannelConfigurationPayload>();

  const [transitionState, setTransitionState] =
    useState<ConfirmButtonTransitionState>("default");

  const [isReady, setIsReady] = useState(false);

  const [configurationForChannels, setConfigurationForChannels] =
    useState<ConfigurationPayload>();
  const [currentChannel, setCurrentChannel] = useState<ChannelItem>();
  const [allChannels, setAllChannels] = useState<ChannelItem[]>([]);

  // FIXME: https://nextjs.org/docs/basic-features/data-fetching/client-side
  useEffect(() => {
    const channels = channelsQuery.data?.channels || [];
    const channelItems =
      channels?.map((channel) => ({ id: channel.id, label: channel.name })) ||
      [];
    if (channelItems && channelItems.length) {
      setAllChannels(channelItems);
      // setCurrentChannel(channelItems[0])
      appState?.domain &&
        appState?.token &&
        fetch("/api/configuration", {
          headers: [
            [SALEOR_DOMAIN_HEADER, appState.domain],
            ["authorization-bearer", appState.token!],
          ],
        })
          .then((res) => res.json())
          .then(({ data }) => {
            const configs: ConfigurationPayload = data;
            setConfigurationForChannels(configs);
            console.log("here");
            console.log(channelItems);
            setCurrentChannel(channelItems[0]);
            setConfiguration(configs[channelItems[0].id]);
            setIsReady(true);
            // console.log(currentChannel);
          });
    }
  }, [appState, channelsQuery]);

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();
    setTransitionState("loading");

    fetch("/api/configuration", {
      method: "POST",
      headers: [
        ["content-type", "application/json"],
        [SALEOR_DOMAIN_HEADER, appState?.domain!],
        ["authorization-bearer", appState?.token!],
      ],
      body: JSON.stringify({ data: configuration }),
    })
      .then((response) =>
        setTransitionState(response.status === 200 ? "success" : "error")
      )
      .catch(() => setTransitionState("error"));
  };

  const onChange = (event: ChangeEvent) => {
    const { name, value } = event.target as HTMLInputElement;
    let conf;
    setConfiguration((prev) => {
      // FIXME: set current configuration
      return prev;
    });
    console.log(conf);
  };
  const onChannelClick = (channel: ChannelItem) => {
    setCurrentChannel(channel);
    setConfiguration(configurationForChannels[channel.id]);
  };
  if (!appState?.ready || isReady === false || configuration === undefined) {
    return <div className="text-white">Loading...</div>;
  }
  console.log(configuration);

  return (
    <form>
      <AppLayout
        title={"test"}
        items={allChannels}
        selectedItem={currentChannel}
        loading={false}
        onBackClick={undefined}
        onSettingsClick={undefined}
        onItemClick={onChannelClick}
      >
        <CardContent>
          <div key={"apiKey"} className={classes.fieldContainer}>
            <TextField
              label={"API Key"}
              name={"apiKey"}
              fullWidth
              onChange={onChange}
              value={configuration.apiKey}
            />
          </div>
          {/* <div> */}
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  name={"active"}
                  checked={configuration.active === true}
                  onChange={onChange}
                />
              }
              label="Active"
            />
            <FormControlLabel
              control={
                <Switch
                  name={"sandbox"}
                  checked={configuration.sandbox === true}
                  onChange={onChange}
                />
              }
              label="Sandbox"
            />
          </FormGroup>
          {/* FIXME: Doesnt show a shipFrom form*/}
          {Object.entries(configuration.shipFrom).forEach(([key, value]) => (
            <div key={key} className={classes.fieldContainer}>
              <TextField
                label={key}
                name={key}
                fullWidth
                onChange={onChange}
                value={value}
              />
            </div>
          ))}
        </CardContent>
      </AppLayout>
    </form>
  );
};

export default Configuration;
