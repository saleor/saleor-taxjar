import { makeStyles } from "@saleor/macaw-ui";

export const useStyles = makeStyles(
  (theme) => ({
    root: {
      display: "flex",
      gap: "2rem",
      marginBottom: theme.spacing(12),
    },
    content: {
      flex: "2",
      marginTop: theme.spacing(1),
    },
    settings: {
      display: "flex",
      flexWrap: "wrap",
      gap: theme.spacing(2),
      width: "100%",
    },
  }),
  { name: "AppLayout" }
);
