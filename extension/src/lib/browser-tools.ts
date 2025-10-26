/**
 * LangChain tool definitions for browser interaction
 * These tools wrap the content script API for use with LangGraph
 */

import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { sendToolMessage } from "./tool-messenger";
import type {
  TabInfo,
  PageContent,
  ElementInfo,
  ClickResult,
  FillInputResult,
  ScrollResult,
  ScreenshotData,
} from "@/src/types/tools";
import { ToolName } from "@/src/types/tools";

/**
 * Get information about the current tab
 */
export const getCurrentTabInfoTool = new DynamicStructuredTool({
  name: "getCurrentTabInfo",
  description:
    "Get basic information about the current browser tab, including URL, title, and domain. Use this when you need to know what page the user is currently viewing.",
  schema: z.object({}),
  func: async (): Promise<string> => {
    const response = await sendToolMessage<TabInfo>(
      ToolName.GET_CURRENT_TAB_INFO,
      {},
    );
    return JSON.stringify(response.data, null, 2);
  },
});

/**
 * Extract page content
 */
export const getPageContentTool = new DynamicStructuredTool({
  name: "getPageContent",
  description:
    "Extract the main content from the current web page, including title, headings, links, and readable text. Use this to understand what's on the page. Returns cleaned text content (up to 10,000 characters).",
  schema: z.object({}),
  func: async (): Promise<string> => {
    const response = await sendToolMessage<PageContent>(
      ToolName.GET_PAGE_CONTENT,
      {},
    );
    return JSON.stringify(response.data, null, 2);
  },
});

/**
 * Find elements on the page
 */
export const findElementsTool = new DynamicStructuredTool({
  name: "findElements",
  description:
    "Find elements on the page matching a CSS selector. Returns information about matching elements including their text content, tag name, attributes, and XPath. Use this to locate specific elements before interacting with them. Examples: 'button', '.submit-button', '#login-form input[type=\"email\"]'",
  schema: z.object({
    selector: z
      .string()
      .describe(
        "CSS selector to find elements (e.g., 'button', '.class-name', '#id')",
      ),
    maxResults: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of results to return (default: 10)"),
  }),
  func: async ({ selector, maxResults }): Promise<string> => {
    const response = await sendToolMessage<ElementInfo[]>(
      ToolName.FIND_ELEMENTS,
      { selector, maxResults },
    );
    return JSON.stringify(response.data, null, 2);
  },
});

/**
 * Click an element
 */
export const clickElementTool = new DynamicStructuredTool({
  name: "clickElement",
  description:
    "Click an element on the page using a CSS selector. The element will be scrolled into view before clicking. Use this to click buttons, links, or other interactive elements. Example selectors: 'button.submit', '#login-button', 'a[href=\"/signup\"]'",
  schema: z.object({
    selector: z
      .string()
      .describe(
        "CSS selector for the element to click (e.g., 'button.submit', '#login')",
      ),
  }),
  func: async ({ selector }): Promise<string> => {
    const response = await sendToolMessage<ClickResult>(
      ToolName.CLICK_ELEMENT,
      { selector },
    );
    return JSON.stringify(response.data, null, 2);
  },
});

/**
 * Fill an input field
 */
export const fillInputTool = new DynamicStructuredTool({
  name: "fillInput",
  description:
    "Fill a text input, textarea, or select element with a value. This triggers appropriate input events for React/Vue compatibility. Use this to fill out forms. Example selectors: 'input[name=\"email\"]', '#password', 'textarea.message'",
  schema: z.object({
    selector: z
      .string()
      .describe(
        "CSS selector for the input element (e.g., 'input[name=\"email\"]')",
      ),
    value: z.string().describe("Value to fill into the input"),
  }),
  func: async ({ selector, value }): Promise<string> => {
    const response = await sendToolMessage<FillInputResult>(
      ToolName.FILL_INPUT,
      { selector, value },
    );
    return JSON.stringify(response.data, null, 2);
  },
});

/**
 * Scroll to an element
 */
export const scrollToElementTool = new DynamicStructuredTool({
  name: "scrollToElement",
  description:
    "Scroll the page to bring an element into view. Use this to make hidden elements visible before interacting with them.",
  schema: z.object({
    selector: z.string().describe("CSS selector for the element to scroll to"),
  }),
  func: async ({ selector }): Promise<string> => {
    const response = await sendToolMessage<ScrollResult>(
      ToolName.SCROLL_TO_ELEMENT,
      { selector },
    );
    return JSON.stringify(response.data, null, 2);
  },
});

/**
 * Capture screenshot
 */
export const captureScreenshotTool = new DynamicStructuredTool({
  name: "captureScreenshot",
  description:
    "Capture a screenshot of the currently visible viewport. Returns a base64-encoded PNG image data URL. Use this when you need to see what's visible on the page.",
  schema: z.object({}),
  func: async (): Promise<string> => {
    const response = await sendToolMessage<ScreenshotData>(
      ToolName.CAPTURE_SCREENSHOT,
      {},
    );
    return `Screenshot captured at ${new Date(response.data!.timestamp).toISOString()}. Data URL length: ${response.data!.dataUrl.length} characters.`;
  },
});

/**
 * Get all open tabs
 */
export const getAllTabsTool = new DynamicStructuredTool({
  name: "getAllTabs",
  description:
    "Get a list of all open browser tabs with their IDs, URLs, and titles. Use this to see what other pages the user has open.",
  schema: z.object({}),
  func: async (): Promise<string> => {
    const response = await sendToolMessage<
      Array<{ id?: number; url: string; title: string }>
    >(ToolName.GET_ALL_TABS, {});
    return JSON.stringify(response.data, null, 2);
  },
});

/**
 * Switch to a different tab
 */
export const switchToTabTool = new DynamicStructuredTool({
  name: "switchToTab",
  description:
    "Switch to a different browser tab by its ID. Use getAllTabs first to find the tab ID you want to switch to.",
  schema: z.object({
    tabId: z.number().describe("The ID of the tab to switch to"),
  }),
  func: async ({ tabId }): Promise<string> => {
    const response = await sendToolMessage<{
      success: boolean;
      message: string;
    }>(ToolName.SWITCH_TO_TAB, { tabId });
    return JSON.stringify(response.data, null, 2);
  },
});

/**
 * Array of all browser tools for easy import
 */
export const browserTools = [
  getCurrentTabInfoTool,
  getPageContentTool,
  findElementsTool,
  clickElementTool,
  fillInputTool,
  scrollToElementTool,
  captureScreenshotTool,
  getAllTabsTool,
  switchToTabTool,
];
