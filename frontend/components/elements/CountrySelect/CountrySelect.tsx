import { Box, TextField } from "@material-ui/core";
import { Autocomplete } from "@material-ui/lab";
import * as React from "react";
import { countries } from "./data";
import { getCountryCodeFromName, getCountryFromCode } from "./utils";
import { useStyles } from "./styles";

interface CountrySelectProps {
  style?: React.CSSProperties;
  name: string;
  label: string;
  value: string;
  onChange?: (event: React.ChangeEvent<{ value?: string }>) => void;
  onBlur?: (event: React.FocusEvent<{}>) => void;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
  style,
  label,
  name,
  value,
  onChange,
  onBlur,
}) => {
  const classes = useStyles();

  return (
    <Autocomplete
      style={style}
      options={countries}
      value={getCountryFromCode(value)}
      onSelect={(event) => {
        const code = getCountryCodeFromName((event.target as any).value);
        onChange &&
          onChange({
            ...event,
            target: {
              ...event.target,
              value: code,
            },
          });
      }}
      onBlur={onBlur}
      autoHighlight
      getOptionLabel={(option) => option.label}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          {props.label} ({props.code})
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          name={name}
          label={label}
          inputProps={{
            ...params.inputProps,
            autoComplete: "new-password", // disable autocomplete and autofill
            className: classes.input,
          }}
        />
      )}
    />
  );
};
export default CountrySelect;
