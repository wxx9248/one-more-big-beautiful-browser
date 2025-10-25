// Example: Import the browser object
import { browser } from "wxt/browser";

export default defineBackground(() => {
  console.log("Hello background!", { id: browser.runtime.id });
  browser.runtime.onInstalled.addListener(async () => {
    // Make sure the side panel uses your HTML by default
    await browser.sidePanel.setOptions({
      path: "sidepanel.html", // same file as in manifest
      enabled: true,
    });

    // Make the toolbar icon open the side panel when clicked
    browser.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((err) => console.error(err));
  });
});
