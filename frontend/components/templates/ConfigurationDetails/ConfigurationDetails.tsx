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
import { CombinedError } from "urql";
import { ChannelItem } from "../../../../types/common";
import AddressForm from "../../elements/AddressForm";
import AppLayout from "../../elements/AppLayout";
import AppSavebar from "../../elements/AppSavebar";
import ErrorAlert from "../../elements/ErrorAlert";
import VerticalSpacer from "../../elements/VerticalSpacer";
import { getFormDefaultValues } from "./data";

export interface LoadingState {
  sidebar: boolean;
  configuration: boolean;
}

interface ConfigurationDetailsProps {
  channels: ChannelItem[];
  currentChannel?: ChannelItem;
  configuration?: ChannelConfigurationPayload;
  saveButtonBarState: ConfirmButtonTransitionState;
  loading: LoadingState;
  errors?: Partial<CombinedError>[];
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
  errors,
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
      shipFromCountry: data["country"],
      shipFromZip: data["zip"],
      shipFromCity: data["city"],
      shipFromStreet: data["street"],
      shipFromState: data["state"],
    });
  };

  return (
    <form>
      <AppLayout
        title={"test"}
        items={channels}
        selectedItem={currentChannel}
        loading={loading.sidebar}
        onBackClick={undefined}
        onSettingsClick={undefined}
        onItemClick={onChannelClick}
      >
        <ErrorAlert
          errors={errors}
          getErrorMessage={(error) => error.message}
        />
        <Card>
          <CardContent>
            {loading.configuration ? (
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
                    country: configuration?.shipFromCountry || "",
                    zip: configuration?.shipFromZip || "",
                    city: configuration?.shipFromCity || "",
                    street: configuration?.shipFromStreet || "",
                    state: configuration?.shipFromState || "",
                  }}
                  formControl={control}
                />
              </>
            )}
          </CardContent>
        </Card>
      </AppLayout>
      <AppSavebar
        disabled={
          loading.sidebar || loading.configuration || !formState.isDirty
        }
        state={saveButtonBarState}
        onCancel={onCancel}
        onSubmit={handleSubmitForm(handleSubmit)}
      />
    </form>
  );
};
export default ConfigurationDetails;
