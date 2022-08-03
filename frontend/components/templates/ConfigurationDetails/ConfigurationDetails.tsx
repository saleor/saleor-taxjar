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
import {
  ChannelConfigurationForm,
  ChannelItem,
} from "../../../../types/common";
import AddressForm from "../../elements/AddressForm";
import AppLayout from "../../elements/AppLayout";
import AppSavebar from "../../elements/AppSavebar";
import ErrorAlert from "../../elements/ErrorAlert";
import VerticalSpacer from "../../elements/VerticalSpacer";
import { getFormDefaultAddress, getFormDefaultValues } from "./data";

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
  } = useForm<ChannelConfigurationForm>({
    shouldUnregister: true,
  });

  useEffect(() => {
    if (!loading) {
      resetForm(getFormDefaultValues(configuration)); // Update values on subpage change as the same form is used
    }
  }, [configuration, loading, resetForm]);

  const handleSubmit = ({
    country,
    zip,
    city,
    street,
    state,
    ...rest
  }: ChannelConfigurationForm) => {
    onSubmit({
      shipFromCountry: country,
      shipFromZip: zip,
      shipFromCity: city,
      shipFromStreet: street,
      shipFromState: state,
      ...rest,
    });
  };

  return (
    <form>
      <AppLayout
        title="Configuration"
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
                  address={getFormDefaultAddress(configuration)}
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
