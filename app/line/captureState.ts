export type LineCaptureStatus = "idle" | "waiting-text" | "ready-to-save";

export interface LineCaptureState {
  images: string[];
  text: string;
  status: LineCaptureStatus;
}

export type LineCaptureAction =
  | { type: "image"; dataUrl: string }
  | { type: "copy-image"; index: number }
  | { type: "text"; text: string }
  | { type: "clear" };

export const initialCaptureState: LineCaptureState = { images: [], text: "", status: "idle" };

export function lineCaptureReducer(state: LineCaptureState, action: LineCaptureAction): LineCaptureState {
  switch (action.type) {
    case "image":
      return { ...state, images: [...state.images, action.dataUrl], status: "waiting-text" };
    case "copy-image":
      if (action.index < 0 || action.index >= state.images.length) return state;
      return { ...state, images: [...state.images, state.images[action.index]] };
    case "text":
      return state.images.length ? { ...state, text: action.text, status: "ready-to-save" } : state;
    case "clear":
      return initialCaptureState;
  }
}
