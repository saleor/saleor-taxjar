import { CombinedError } from "urql";

export const getCommonErrors = (error?: Partial<CombinedError>) =>
  error?.graphQLErrors || error?.networkError
    ? [
        ...(error?.graphQLErrors || []),
        ...(error?.networkError ? [error.networkError] : []),
      ]
    : [...(error ? [error] : [])];
