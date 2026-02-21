import { requestContext } from "../../config/requestcontext";

export const getContext = () => {
  const store = requestContext.getStore();

  if (!store) {
    throw new Error("Request context not available");
  }

  return store;
};
