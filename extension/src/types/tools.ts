/**
 * Type definitions for browser tool messages and responses
 */

export interface ToolMessage {
  type: "TOOL_CALL";
  toolName: string;
  params: Record<string, any>;
  requestId: string;
}

export interface ToolResponse<T = any> {
  type: "TOOL_RESPONSE";
  requestId: string;
  success: boolean;
  data?: T;
  error?: string;
}

export interface PageContent {
  title: string;
  url: string;
  mainContent: string;
  headings: string[];
  links: Array<{ text: string; href: string }>;
}

export interface ElementInfo {
  text: string;
  tag: string;
  attributes: Record<string, string>;
  xpath: string;
}

export interface TabInfo {
  id?: number;
  url: string;
  title: string;
  domain: string;
}

export interface ScreenshotData {
  dataUrl: string;
  timestamp: number;
}

export interface ClickResult {
  success: boolean;
  message: string;
  elementFound: boolean;
}

export interface FillInputResult {
  success: boolean;
  message: string;
  elementFound: boolean;
}

export interface ScrollResult {
  success: boolean;
  message: string;
  elementFound: boolean;
}

/**
 * Tool names enum for type safety
 * Note: These must match the tool names defined in browser-tools.ts
 */
export enum ToolName {
  GET_CURRENT_TAB_INFO = "get_current_tab_info",
  GET_PAGE_CONTENT = "get_page_content",
  FIND_ELEMENTS = "find_elements",
  CLICK_ELEMENT = "click_element",
  FILL_INPUT = "fill_input",
  SCROLL_TO_ELEMENT = "scroll_to_element",
  CAPTURE_SCREENSHOT = "capture_screenshot",
  GET_ALL_TABS = "get_all_tabs",
  SWITCH_TO_TAB = "switch_to_tab",
}
