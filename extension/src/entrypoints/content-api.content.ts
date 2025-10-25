/**
 * Content Script API for browser interaction
 * Provides DOM manipulation and content extraction capabilities
 */

import { browser } from "wxt/browser";
import type {
  ToolMessage,
  ToolResponse,
  PageContent,
  ElementInfo,
  TabInfo,
  ClickResult,
  FillInputResult,
  ScrollResult,
} from "@/src/types/tools";
import { ToolName } from "@/src/types/tools";

export default defineContentScript({
  matches: ["<all_urls>"],
  main() {
    console.log("[Content API] Initialized on", window.location.href);

    // Listen for tool messages from background script
    browser.runtime.onMessage.addListener(
      (
        message: any,
        sender: browser.Runtime.MessageSender,
        sendResponse: (response: ToolResponse) => void,
      ) => {
        if (message.type === "TOOL_CALL") {
          handleToolCall(message as ToolMessage)
            .then((response) => sendResponse(response))
            .catch((error) => {
              sendResponse({
                type: "TOOL_RESPONSE",
                requestId: message.requestId,
                success: false,
                error: error.message || "Unknown error",
              });
            });
          return true; // Keep message channel open for async response
        }
      },
    );
  },
});

/**
 * Route tool calls to appropriate handlers
 */
async function handleToolCall(message: ToolMessage): Promise<ToolResponse> {
  const { toolName, params, requestId } = message;

  try {
    let data: any;

    switch (toolName) {
      case ToolName.GET_CURRENT_TAB_INFO:
        data = getCurrentTabInfo();
        break;

      case ToolName.GET_PAGE_CONTENT:
        data = getPageContent();
        break;

      case ToolName.FIND_ELEMENTS:
        data = findElements(params.selector, params.maxResults);
        break;

      case ToolName.CLICK_ELEMENT:
        data = clickElement(params.selector);
        break;

      case ToolName.FILL_INPUT:
        data = fillInput(params.selector, params.value);
        break;

      case ToolName.SCROLL_TO_ELEMENT:
        data = scrollToElement(params.selector);
        break;

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }

    return {
      type: "TOOL_RESPONSE",
      requestId,
      success: true,
      data,
    };
  } catch (error: any) {
    return {
      type: "TOOL_RESPONSE",
      requestId,
      success: false,
      error: error.message || "Tool execution failed",
    };
  }
}

/**
 * Get current tab information
 */
function getCurrentTabInfo(): TabInfo {
  const url = window.location.href;
  const title = document.title;
  const domain = window.location.hostname;

  return {
    url,
    title,
    domain,
  };
}

/**
 * Extract page content with cleaned text
 */
function getPageContent(): PageContent {
  const title = document.title;
  const url = window.location.href;

  // Extract headings
  const headings = Array.from(document.querySelectorAll("h1, h2, h3"))
    .map((h) => h.textContent?.trim())
    .filter((text): text is string => Boolean(text));

  // Extract links
  const links = Array.from(document.querySelectorAll("a[href]"))
    .slice(0, 50) // Limit to first 50 links
    .map((a) => ({
      text: a.textContent?.trim() || "",
      href: (a as HTMLAnchorElement).href,
    }))
    .filter((link) => link.text.length > 0);

  // Extract main content
  const mainContent = extractMainContent();

  return {
    title,
    url,
    mainContent,
    headings,
    links,
  };
}

/**
 * Extract the main readable content from the page
 * Attempts to find article/main content and clean up boilerplate
 */
function extractMainContent(): string {
  // Try to find main content containers
  const contentSelectors = [
    "article",
    "main",
    '[role="main"]',
    ".content",
    "#content",
    ".post",
    ".article",
  ];

  let contentElement: Element | null = null;

  for (const selector of contentSelectors) {
    contentElement = document.querySelector(selector);
    if (contentElement) break;
  }

  // Fallback to body if no main content found
  if (!contentElement) {
    contentElement = document.body;
  }

  // Extract and clean text
  const textContent = contentElement.textContent || "";

  // Clean up whitespace
  return textContent.replace(/\s+/g, " ").trim().substring(0, 10000); // Limit to 10k characters
}

/**
 * Find elements matching a selector
 */
function findElements(
  selector: string,
  maxResults: number = 10,
): ElementInfo[] {
  if (!selector) {
    throw new Error("Selector is required");
  }

  const elements = Array.from(document.querySelectorAll(selector)).slice(
    0,
    maxResults,
  );

  return elements.map((el) => ({
    text: el.textContent?.trim() || "",
    tag: el.tagName.toLowerCase(),
    attributes: getElementAttributes(el),
    xpath: getXPath(el),
  }));
}

/**
 * Click an element
 */
function clickElement(selector: string): ClickResult {
  if (!selector) {
    return {
      success: false,
      message: "Selector is required",
      elementFound: false,
    };
  }

  const element = document.querySelector(selector);

  if (!element) {
    return {
      success: false,
      message: `Element not found: ${selector}`,
      elementFound: false,
    };
  }

  try {
    // Scroll element into view first
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    // Simulate click
    if (element instanceof HTMLElement) {
      element.click();
    } else {
      // Fallback to dispatching event
      const clickEvent = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        view: window,
      });
      element.dispatchEvent(clickEvent);
    }

    return {
      success: true,
      message: `Clicked element: ${selector}`,
      elementFound: true,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to click: ${error.message}`,
      elementFound: true,
    };
  }
}

/**
 * Fill an input field
 */
function fillInput(selector: string, value: string): FillInputResult {
  if (!selector) {
    return {
      success: false,
      message: "Selector is required",
      elementFound: false,
    };
  }

  const element = document.querySelector(selector);

  if (!element) {
    return {
      success: false,
      message: `Element not found: ${selector}`,
      elementFound: false,
    };
  }

  try {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement
    ) {
      // Set value
      element.value = value;

      // Trigger input events for React/Vue compatibility
      element.dispatchEvent(new Event("input", { bubbles: true }));
      element.dispatchEvent(new Event("change", { bubbles: true }));

      return {
        success: true,
        message: `Filled input: ${selector}`,
        elementFound: true,
      };
    } else if (element instanceof HTMLSelectElement) {
      // Handle select elements
      element.value = value;
      element.dispatchEvent(new Event("change", { bubbles: true }));

      return {
        success: true,
        message: `Selected option: ${selector}`,
        elementFound: true,
      };
    } else {
      return {
        success: false,
        message: `Element is not an input, textarea, or select: ${selector}`,
        elementFound: true,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to fill input: ${error.message}`,
      elementFound: true,
    };
  }
}

/**
 * Scroll to an element
 */
function scrollToElement(selector: string): ScrollResult {
  if (!selector) {
    return {
      success: false,
      message: "Selector is required",
      elementFound: false,
    };
  }

  const element = document.querySelector(selector);

  if (!element) {
    return {
      success: false,
      message: `Element not found: ${selector}`,
      elementFound: false,
    };
  }

  try {
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    return {
      success: true,
      message: `Scrolled to element: ${selector}`,
      elementFound: true,
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to scroll: ${error.message}`,
      elementFound: true,
    };
  }
}

/**
 * Helper: Get element attributes as object
 */
function getElementAttributes(element: Element): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    attrs[attr.name] = attr.value;
  }
  return attrs;
}

/**
 * Helper: Get XPath for an element
 */
function getXPath(element: Element): string {
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling = current.previousSibling;

    while (sibling) {
      if (
        sibling.nodeType === Node.ELEMENT_NODE &&
        sibling.nodeName === current.nodeName
      ) {
        index++;
      }
      sibling = sibling.previousSibling;
    }

    const tagName = current.nodeName.toLowerCase();
    const part = index > 0 ? `${tagName}[${index + 1}]` : tagName;
    parts.unshift(part);

    current = current.parentElement;
  }

  return "/" + parts.join("/");
}
