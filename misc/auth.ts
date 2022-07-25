import { SALEOR_DOMAIN_HEADER } from "@/constants";
import { app } from "./app";

export const getAuthHeaders = () => ({
  "authorization-bearer": app?.getState()?.token,
  [SALEOR_DOMAIN_HEADER]: app?.getState()?.domain,
});
