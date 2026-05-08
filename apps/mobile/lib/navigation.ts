import { type Href, router } from "expo-router";

/**
 * router.back() throws "GO_BACK was not handled" when the screen was reached
 * via deep link with no back stack to pop. Use this helper instead — it
 * navigates back when possible and replaces with the fallback otherwise.
 */
export const safeBack = (fallback: Href = "/"): void => {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
};
