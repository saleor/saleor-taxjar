import { TextField } from "@material-ui/core";
import { Control, Controller } from "react-hook-form";
import { Address, ChannelConfigurationForm } from "../../../../types/common";
import CountrySelect from "../CountrySelect/CountrySelect";
import { useStyles } from "./styles";

interface AddressField {
  key: keyof Address;
  label: string;
  component: typeof CountrySelect | typeof TextField;
}

const addressFields: AddressField[] = [
  {
    key: "country",
    label: "Country",
    component: CountrySelect,
  },
  {
    key: "zip",
    label: "Zip",
    component: TextField,
  },
  {
    key: "city",
    label: "City",
    component: TextField,
  },
  {
    key: "street",
    label: "Street",
    component: TextField,
  },
  {
    key: "state",
    label: "State",
    component: TextField,
  },
];

interface AddressFormProps {
  address: Address;
  formControl?: Control<ChannelConfigurationForm, any>;
}

const AddressForm: React.FC<AddressFormProps> = ({ address, formControl }) => {
  const classes = useStyles();

  return (
    <div className={classes.root}>
      {addressFields.map((addressField) => (
        <Controller
          key={addressField.key}
          name={addressField.key}
          control={formControl}
          defaultValue={address[addressField.key]}
          render={({ field }) => (
            <addressField.component
              style={{ gridArea: addressField.key }}
              label={addressField.label}
              name={field.name}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      ))}
    </div>
  );
};
export default AddressForm;
