import { ChannelConfigurationPayload } from "@/types/api";
import {
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import { ConfirmButtonTransitionState } from "@saleor/macaw-ui";
import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { ChannelItem } from "../../../../types/common";
import AddressForm from "../../elements/AddressForm";
import AppLayout from "../../elements/AppLayout";
import AppSavebar from "../../elements/AppSavebar";
import VerticalSpacer from "../../elements/VerticalSpacer";
import { getFormDefaultValues } from "./data";

interface ConfigurationDetailsProps {
  channels: ChannelItem[];
  currentChannel?: ChannelItem;
  configuration?: ChannelConfigurationPayload;
  saveButtonBarState: ConfirmButtonTransitionState;
  loading: boolean;
  onChannelClick: (channel: ChannelItem) => void;
  onCancel: () => void;
  onSubmit: (data: ChannelConfigurationPayload) => void;
}

const ConfigurationDetails: React.FC<ConfigurationDetailsProps> = ({
  channels,
  currentChannel,
  configuration,
  saveButtonBarState,
  loading,
  onCancel,
  onSubmit,
  onChannelClick,
}) => {
  const {
    control,
    formState,
    handleSubmit: handleSubmitForm,
    reset: resetForm,
  } = useForm({
    shouldUnregister: true,
  });

  useEffect(() => {
    resetForm(getFormDefaultValues(configuration)); // Update values on subpage change as the same form is used
  }, [configuration, resetForm]);

  const handleSubmit = (data: Record<string, any>) => {
    onSubmit({
      apiKey: data["apiKey"],
      active: data["active"],
      sandbox: data["sandbox"],
      shipFrom: {
        fromCountry: data["country"],
        fromZip: data["zip"],
        fromCity: data["city"],
        fromStreet: data["street"],
        fromState: data["state"],
      },
    });
  };

  return (
    <form>
      <AppLayout
        title={"test"}
        items={channels}
        selectedItem={currentChannel}
        loading={loading}
        onBackClick={undefined}
        onSettingsClick={undefined}
        onItemClick={onChannelClick}
      >
        <Card>
          <CardContent>
            {loading ? (
              <Skeleton />
            ) : (
              <>
                <Controller
                  name="apiKey"
                  control={control}
                  defaultValue={configuration?.apiKey}
                  render={({ field }) => (
                    <TextField
                      label="API Key"
                      fullWidth
                      name={field.name}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                    />
                  )}
                />
                <VerticalSpacer />
                <Controller
                  name="active"
                  control={control}
                  defaultValue={configuration?.active}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      }
                      label="Active"
                    />
                  )}
                />
                <VerticalSpacer />
                <Controller
                  name="sandbox"
                  control={control}
                  defaultValue={configuration?.sandbox}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.value}
                          name={field.name}
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                        />
                      }
                      label="Sandbox"
                    />
                  )}
                />
                <VerticalSpacer />
                <Typography variant="body2">Ship From</Typography>
                <VerticalSpacer />
                <AddressForm
                  address={{
                    country: configuration?.shipFrom.fromCountry || "",
                    zip: configuration?.shipFrom.fromZip || "",
                    city: configuration?.shipFrom.fromCity || "",
                    street: configuration?.shipFrom.fromStreet || "",
                    state: configuration?.shipFrom.fromState || "",
                  }}
                  formControl={control}
                />
              </>
            )}
          </CardContent>
        </Card>
      </AppLayout>
      <AppSavebar
        disabled={loading || !formState.isDirty}
        state={saveButtonBarState}
        onCancel={onCancel}
        onSubmit={handleSubmitForm(handleSubmit)}
      />
    </form>
  );
};
export default ConfigurationDetails;
