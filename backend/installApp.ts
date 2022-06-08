import { Client, OperationResult } from "urql";
import {
    OrderCreatedEventSubscriptionFragmentDoc,
  OrderCreatedSubscriptionDocument,
  WebhookCreateDocument,
  WebhookCreateMutation,
  WebhookEventTypeAsyncEnum,
  WebhookEventTypeSyncEnum,
} from "../generated/graphql";
import { setAuthToken } from "../lib/environment";
import { createClient } from "../lib/graphql";
import { WebhookCreateError } from "./errors";

type WebhookToCreate = {
  event: string;
  endpointName: string;
  query?: string;
};
type ResponseError = {
    message?: string
}
import { print } from "graphql/language/printer.js";


// This consts will be replaced after we'll provide new way of registrating webhooks 
// directly from app's manifest.
const SYNC_WEBHOOKS_TO_CREATE: WebhookToCreate[] = [
  {
    event: WebhookEventTypeSyncEnum.CheckoutCalculateTaxes,
    endpointName: "checkout-calculate-taxes",
  },
  {
    event: WebhookEventTypeSyncEnum.OrderCalculateTaxes,
    endpointName: "order-calculate-taxes",
  },
];

const ASYNC_WEBHOOKS_TO_CREATE: WebhookToCreate[] = [
  {
    event: WebhookEventTypeAsyncEnum.OrderCreated,
    query: print(OrderCreatedSubscriptionDocument),
    endpointName: "order-created",
  },
];

const getErrors = (response: OperationResult<WebhookCreateMutation, {}>): string[] => {
    const errors: string[] = []
    if (response.error){
        console.log(response.error);
        errors.push("Unable to execute a request.");
        return errors;
    }
    // Casting response to any as `errors` are not declared in API, and can be returned directly
    // when the error doesn't come from Graphql.
    const graphqlErrors: ResponseError[] = (response as any).errors || []
    const mutationErrors = response?.data?.webhookCreate?.errors || []
    errors.push(...graphqlErrors.map((error)=>(error?.message || "")));
    errors.push(...mutationErrors.map((error=>(error.code))));
    return errors
}

export const createWebhooks = async (client: Client, baseURL:string, secretKey?:string) => {
    const errors: string[] = [];
  for (const eventDefinition of SYNC_WEBHOOKS_TO_CREATE) {
    const response = (await client
      .mutation<WebhookCreateMutation>(WebhookCreateDocument, {
        syncEvents: [eventDefinition.event],
        asyncEvents: [],
        targetUrl: `${baseURL}/api/webhooks/${eventDefinition.endpointName}`,
        name: eventDefinition.endpointName,
        query: eventDefinition.query,
        secretKey
      })
      .toPromise());
    if (response.error || response?.hasOwnProperty("errors") || response?.data?.webhookCreate?.errors){
        errors.push(...getErrors(response));
    }
  }
  for (const eventDefinition of ASYNC_WEBHOOKS_TO_CREATE) {
    const response = (await client
        .mutation<WebhookCreateMutation>(WebhookCreateDocument, {
        asyncEvents: [eventDefinition.event],
        syncEvents: [],
          targetUrl: `${baseURL}/api/webhooks/${eventDefinition.endpointName}`,
          name: eventDefinition.endpointName,
          query: eventDefinition.query,
          secretKey
        })
        .toPromise());
        console.log(OrderCreatedEventSubscriptionFragmentDoc);
        console.log(response.data?.webhookCreate);
        if (response.error || response?.hasOwnProperty("errors") || response?.data?.webhookCreate?.errors){
            errors.push(...getErrors(response));
        }
  }
  if (errors.length){
      const error = new WebhookCreateError("Recieved an errors during the webhooks installation", errors)
      console.error(error);
      throw error;
  }
};

export const install = async (
  token: string,
  saleorDomain: string,
  baseURL: string
) => {
    // FIXME: 
  const client = createClient(`http://${saleorDomain}/graphql/`, async () =>
    Promise.resolve({ token: token })
  );
  const secretKey = process.env.WEBHOOK_KEY
await createWebhooks(client, baseURL, secretKey);
await setAuthToken(token)
};

