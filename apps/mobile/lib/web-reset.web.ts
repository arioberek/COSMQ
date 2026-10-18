import { Alert, type AlertButton, type AlertOptions } from "react-native";

// React Native Web renders pressables with a button role as <button>, and browsers
// center text inside buttons. Native platforms don't, so match them here.
if (typeof document !== "undefined" && !document.getElementById("cosmq-web-reset")) {
  const style = document.createElement("style");
  style.id = "cosmq-web-reset";
  style.textContent = "button { text-align: inherit; }";
  document.head.appendChild(style);
}

/**
 * react-native-web ships `Alert.alert` as a no-op, so every confirmation
 * (dangerous queries, deletes, the More menu) silently did nothing in the web
 * preview, and promise-based confirms never resolved. Map it onto the
 * browser's own dialogs:
 * - no actions: `alert()`, then the cancel/OK handler
 * - one action: `confirm()`; OK runs it, Cancel runs the cancel button
 * - several actions: one `confirm()` per action, in order; the first OK wins
 */
export const webAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
  options?: AlertOptions,
): void => {
  if (typeof window === "undefined") return;
  const text = message ? `${title}\n\n${message}` : title;
  const list = buttons && buttons.length > 0 ? buttons : [{ text: "OK" }];
  const cancel = list.find((b) => b.style === "cancel");
  const actions = list.filter((b) => b !== cancel);

  if (actions.length === 0 || (actions.length === 1 && !cancel)) {
    window.alert(text);
    (actions[0] ?? cancel)?.onPress?.();
    return;
  }

  for (const action of actions) {
    if (window.confirm(`${text}\n\nPress OK to “${action.text ?? "Continue"}”.`)) {
      action.onPress?.();
      return;
    }
  }

  if (cancel?.onPress) cancel.onPress();
  else options?.onDismiss?.();
};

Alert.alert = webAlert;
