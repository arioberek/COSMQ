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
 * - several actions: one `prompt()` listing them by number. Cancel or an
 *   unknown answer cancels; a run of confirms would turn Cancel on the first
 *   ("Wrap in Transaction") into an offer of the next ("Run Anyway").
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
  const dismiss = () => {
    if (cancel?.onPress) cancel.onPress();
    else options?.onDismiss?.();
  };

  if (actions.length === 0 || (actions.length === 1 && !cancel)) {
    window.alert(text);
    (actions[0] ?? cancel)?.onPress?.();
    return;
  }

  if (actions.length === 1) {
    if (window.confirm(`${text}\n\nPress OK to “${actions[0].text ?? "Continue"}”.`)) {
      actions[0].onPress?.();
    } else {
      dismiss();
    }
    return;
  }

  const menu = actions.map((b, i) => `${i + 1}. ${b.text ?? "Option"}`).join("\n");
  const answer = window.prompt(`${text}\n\n${menu}\n\nType a number, or Cancel.`, "");
  const choice = answer === null ? Number.NaN : Number.parseInt(answer.trim(), 10);
  const picked = Number.isInteger(choice) ? actions[choice - 1] : undefined;
  if (picked) picked.onPress?.();
  else dismiss();
};

Alert.alert = webAlert;
