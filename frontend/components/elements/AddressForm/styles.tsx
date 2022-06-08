import { makeStyles } from "@saleor/macaw-ui";

export const useStyles = makeStyles(
  (theme) => ({
    root: {
      display: "grid",
      gridTemplateAreas: `
        "country country country zip"
        "city city state state"
        "street street street street"
      `,
      gridTemplateColumns: `1fr 1fr 1fr 1fr`,
      gap: theme.spacing(2),
    },
    country: {
      gridArea: "country",
    },
    zip: {
      gridArea: "zip",
    },
    city: {
      gridArea: "city",
    },
    street: {
      gridArea: "street",
    },
    state: {
      gridArea: "state",
    },
  }),
  {
    name: "AddressForm",
  }
);
