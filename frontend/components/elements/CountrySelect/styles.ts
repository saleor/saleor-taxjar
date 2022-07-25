import { makeStyles } from "@saleor/macaw-ui";

export const useStyles = makeStyles(
  (theme) => ({
    input: {
      padding: theme.spacing(1.75, 0.5, 0.25, 0.5),
    },
  }),
  { name: "CountrySelect" }
);
