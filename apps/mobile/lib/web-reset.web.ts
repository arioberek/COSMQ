// React Native Web renders pressables with a button role as <button>, and browsers
// center text inside buttons. Native platforms don't, so match them here.
if (typeof document !== "undefined" && !document.getElementById("cosmq-web-reset")) {
  const style = document.createElement("style");
  style.id = "cosmq-web-reset";
  style.textContent = "button { text-align: inherit; }";
  document.head.appendChild(style);
}

export {};
