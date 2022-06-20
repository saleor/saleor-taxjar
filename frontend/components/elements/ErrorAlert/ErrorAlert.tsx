import { Typography } from "@material-ui/core";
import { Alert } from "@saleor/macaw-ui";
import { useStyles } from "./styles";

interface UnknownError<T> {
  message?: string | null;
  code?: T;
}

interface ErrorAlertProps<T> {
  errors?: UnknownError<T>[];
  getErrorMessage: (error: UnknownError<T>) => string | null | undefined;
}

const ErrorAlert = <T extends any>({
  errors,
  getErrorMessage,
}: ErrorAlertProps<T>) => {
  const classes = useStyles();

  if (!errors?.length) {
    return null;
  }

  return (
    <>
      <Alert
        variant="error"
        title="Something went wrong"
        className={classes.root}
      >
        {errors.map((error, idx) => (
          <Typography key={idx}>{getErrorMessage(error)}</Typography>
        ))}
      </Alert>
    </>
  );
};
export default ErrorAlert;
