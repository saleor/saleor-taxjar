import { TextField } from "@material-ui/core";
import { Control, Controller, FieldValues } from "react-hook-form";
import { Address } from "../../../../types/common";
import { useStyles } from "./styles";

interface AddressFormProps {
  address: Address;
  formControl?: Control<FieldValues, any>;
}

const AddressForm: React.FC<AddressFormProps> = ({ address, formControl }) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      <Controller
        name="country"
        control={formControl}
        defaultValue={address.country}
        render={({ field }) => (
          <TextField
            className={classes.country}
            label="Country"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <Controller
        name="zip"
        control={formControl}
        defaultValue={address.zip}
        render={({ field }) => (
          <TextField
            className={classes.zip}
            label="Zip"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <Controller
        name="city"
        control={formControl}
        defaultValue={address.city}
        render={({ field }) => (
          <TextField
            className={classes.city}
            label="City"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <Controller
        name="street"
        control={formControl}
        defaultValue={address.street}
        render={({ field }) => (
          <TextField
            className={classes.street}
            label="Street"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
      <Controller
        name="state"
        control={formControl}
        defaultValue={address.state}
        render={({ field }) => (
          <TextField
            className={classes.state}
            label="State"
            name={field.name}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
          />
        )}
      />
    </div>
  );
};
export default AddressForm;
