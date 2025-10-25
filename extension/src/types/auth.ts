/**
 * Authentication related types
 */

export interface AuthToken {
  token: string;
  expiresAt?: number;
}

export interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
}

/**
 * Message types for communication between extension components
 */
export enum MessageType {
  AUTH_TOKEN = "AUTH_TOKEN",
  AUTH_SUCCESS = "AUTH_SUCCESS",
  AUTH_LOGOUT = "AUTH_LOGOUT",
  GET_AUTH_STATE = "GET_AUTH_STATE",
}

export interface AuthTokenMessage {
  type: MessageType.AUTH_TOKEN;
  token: string;
}

export interface AuthSuccessMessage {
  type: MessageType.AUTH_SUCCESS;
  token: string;
}

export interface AuthLogoutMessage {
  type: MessageType.AUTH_LOGOUT;
}

export interface GetAuthStateMessage {
  type: MessageType.GET_AUTH_STATE;
}

export type AuthMessage =
  | AuthTokenMessage
  | AuthSuccessMessage
  | AuthLogoutMessage
  | GetAuthStateMessage;
