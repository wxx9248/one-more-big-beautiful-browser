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

export interface DownloadResult {
  success: boolean;
  message: string;
  filename: string;
}

export interface ScreenshotAndDownloadResult {
  success: boolean;
  message: string;
  filename: string;
  dataUrl: string; // For displaying in chat
  timestamp: number;
}

export interface OpenNewTabResult {
  success: boolean;
  message: string;
  tabId?: number;
  url: string;
}

/**
 * Tool names enum for type safety
 */
export enum ToolName {
  GET_CURRENT_TAB_INFO = "getCurrentTabInfo",
  GET_PAGE_CONTENT = "getPageContent",
  FIND_ELEMENTS = "findElements",
  CLICK_ELEMENT = "clickElement",
  FILL_INPUT = "fillInput",
  SCROLL_TO_ELEMENT = "scrollToElement",
  CAPTURE_SCREENSHOT = "captureScreenshot",
  CAPTURE_SCREENSHOT_AND_DOWNLOAD = "captureScreenshotAndDownload",
  GET_ALL_TABS = "getAllTabs",
  SWITCH_TO_TAB = "switchToTab",
  DOWNLOAD_FILE = "downloadFile",
  OPEN_NEW_TAB = "openNewTab",
}
