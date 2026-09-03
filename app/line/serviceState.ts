export type LineServiceStatus = "disconnected" | "connecting" | "ready" | "running" | "stopped";

export interface LineServiceState {
  accountId: string | null;
  accountName: string | null;
  status: LineServiceStatus;
  message: string;
}

export type LineServiceAction =
  | { type: "connecting" }
  | { type: "connect"; accountId: string; accountName: string }
  | { type: "disconnect" }
  | { type: "start" }
  | { type: "stop" };

export const initialLineServiceState: LineServiceState = {
  accountId: null,
  accountName: null,
  status: "disconnected",
  message: "Connect a LINE account to start",
};

export function lineServiceReducer(state: LineServiceState, action: LineServiceAction): LineServiceState {
  switch (action.type) {
    case "connecting":
      return { ...state, status: "connecting", message: "Waiting for LINE login" };
    case "connect":
      return { accountId: action.accountId, accountName: action.accountName, status: "ready", message: "Ready to start" };
    case "disconnect":
      return { ...initialLineServiceState };
    case "start":
      return state.accountId
        ? { ...state, status: "running", message: "Waiting for incoming data" }
        : { ...state, status: "ready", message: "Connect a LINE account to start" };
    case "stop":
      return { ...state, status: "stopped", message: "Service is stopped" };
  }
}
