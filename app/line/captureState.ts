export const LINE_CAPTURE_LIMIT = 5;
export const LINE_PENDING_TEXT_TTL_MS = 60_000;

export type LineCaptureStatus = "loading-images" | "waiting-text" | "ready-to-save";

export interface LineCaptureImage {
  messageId: string;
  dataUrl: string;
  sequence: number;
}

export interface LineCaptureSession {
  id: string;
  chatId: string;
  createdAt: number;
  images: LineCaptureImage[];
  pendingImageIds: string[];
  failedImageCount: number;
  text: string;
  textMessageId: string | null;
  textSequence: number | null;
  textReceivedAt: number | null;
  status: LineCaptureStatus;
}

export interface PendingLineText {
  messageId: string;
  chatId: string;
  sequence: number;
  receivedAt: number;
  expiresAt: number;
  text: string;
}

export interface LineCaptureState {
  queue: LineCaptureSession[];
  pendingTexts: PendingLineText[];
  processedMessageIds: string[];
  notice: { type: "queue-full"; id: number } | null;
}

type CaptureEventBase = {
  messageId: string;
  chatId: string;
  sequence: number;
  receivedAt: number;
};

export type LineCaptureAction =
  | ({ type: "image-pending" } & CaptureEventBase)
  | ({ type: "image-loaded"; dataUrl: string } & CaptureEventBase)
  | ({ type: "image-error" } & CaptureEventBase)
  | ({ type: "text"; text: string } & CaptureEventBase)
  | { type: "copy-image"; index: number }
  | { type: "discard-active" }
  | { type: "complete-capture"; id: string }
  | { type: "expire"; now: number }
  | { type: "clear-queue" }
  | { type: "clear" };

export const initialCaptureState: LineCaptureState = {
  queue: [],
  pendingTexts: [],
  processedMessageIds: [],
  notice: null,
};

function captureStatus(capture: LineCaptureSession): LineCaptureStatus {
  if (capture.pendingImageIds.length) return "loading-images";
  if (capture.images.length && capture.text) return "ready-to-save";
  return "waiting-text";
}

function updateCapture(capture: LineCaptureSession, value: Partial<LineCaptureSession>): LineCaptureSession {
  const updated = { ...capture, ...value };
  return { ...updated, status: captureStatus(updated) };
}

function prunePendingTexts(pendingTexts: PendingLineText[], now: number) {
  return pendingTexts.filter((pending) => pending.expiresAt > now);
}

function messageKey(chatId: string, messageId: string) {
  return `${chatId}:${messageId}`;
}

function rememberMessage(processedMessageIds: string[], chatId: string, messageId: string) {
  const key = messageKey(chatId, messageId);
  if (processedMessageIds.includes(key)) return processedMessageIds;
  return [...processedMessageIds, key].slice(-500);
}

function hasImage(state: LineCaptureState, chatId: string, messageId: string) {
  return state.queue.some((capture) => capture.chatId === chatId && (
    capture.pendingImageIds.includes(messageId) ||
    capture.images.some((image) => image.messageId === messageId)
  )) || state.processedMessageIds.includes(messageKey(chatId, messageId));
}

function createCapture(action: Extract<LineCaptureAction, { type: "image-pending" }>, pendingText?: PendingLineText): LineCaptureSession {
  const capture: LineCaptureSession = {
    id: `${action.chatId}:${action.sequence}:${action.messageId}`,
    chatId: action.chatId,
    createdAt: Math.min(action.receivedAt, pendingText?.receivedAt ?? action.receivedAt),
    images: [],
    pendingImageIds: [action.messageId],
    failedImageCount: 0,
    text: pendingText?.text ?? "",
    textMessageId: pendingText?.messageId ?? null,
    textSequence: pendingText?.sequence ?? null,
    textReceivedAt: pendingText?.receivedAt ?? null,
    status: "loading-images",
  };
  return capture;
}

function beginImage(state: LineCaptureState, action: Extract<LineCaptureAction, { type: "image-pending" }>): LineCaptureState {
  if (hasImage(state, action.chatId, action.messageId)) return state;
  const pendingTexts = prunePendingTexts(state.pendingTexts, action.receivedAt);
  const targetIndex = state.queue.findIndex((capture) =>
    capture.chatId === action.chatId &&
    (!capture.text || (capture.textSequence !== null && action.sequence < capture.textSequence)),
  );
  if (targetIndex >= 0) {
    const queue = [...state.queue];
    queue[targetIndex] = updateCapture(queue[targetIndex], {
      pendingImageIds: [...queue[targetIndex].pendingImageIds, action.messageId],
    });
    return { ...state, queue, pendingTexts, notice: null };
  }

  const pendingText = pendingTexts.find((pending) =>
    pending.chatId === action.chatId && action.sequence < pending.sequence,
  );
  const pendingCount = state.queue.length + pendingTexts.length - (pendingText ? 1 : 0);
  if (pendingCount >= LINE_CAPTURE_LIMIT) {
    return { ...state, pendingTexts, notice: { type: "queue-full", id: action.receivedAt } };
  }
  return {
    ...state,
    queue: [...state.queue, createCapture(action, pendingText)].sort((left, right) => left.createdAt - right.createdAt),
    pendingTexts: pendingText ? pendingTexts.filter((pending) =>
      pending.chatId !== pendingText.chatId || pending.messageId !== pendingText.messageId,
    ) : pendingTexts,
    notice: null,
  };
}

export function lineCaptureReducer(state: LineCaptureState, action: LineCaptureAction): LineCaptureState {
  switch (action.type) {
    case "image-pending":
      return beginImage({ ...state, notice: null }, action);
    case "image-loaded": {
      if (state.processedMessageIds.includes(messageKey(action.chatId, action.messageId))) return state;
      let working = state;
      if (!hasImage(working, action.chatId, action.messageId)) {
        working = beginImage(working, { ...action, type: "image-pending" });
      }
      const captureIndex = working.queue.findIndex((capture) =>
        capture.chatId === action.chatId && capture.pendingImageIds.includes(action.messageId),
      );
      if (captureIndex < 0) return working;
      const queue = [...working.queue];
      const capture = queue[captureIndex];
      queue[captureIndex] = updateCapture(capture, {
        pendingImageIds: capture.pendingImageIds.filter((id) => id !== action.messageId),
        images: [...capture.images, { messageId: action.messageId, dataUrl: action.dataUrl, sequence: action.sequence }]
          .sort((left, right) => left.sequence - right.sequence),
      });
      return {
        ...working,
        queue,
        processedMessageIds: rememberMessage(working.processedMessageIds, action.chatId, action.messageId),
        notice: null,
      };
    }
    case "image-error": {
      if (state.processedMessageIds.includes(messageKey(action.chatId, action.messageId))) return state;
      const captureIndex = state.queue.findIndex((capture) =>
        capture.chatId === action.chatId && capture.pendingImageIds.includes(action.messageId),
      );
      if (captureIndex < 0) return state;
      const queue = [...state.queue];
      const capture = updateCapture(queue[captureIndex], {
        pendingImageIds: queue[captureIndex].pendingImageIds.filter((id) => id !== action.messageId),
        failedImageCount: queue[captureIndex].failedImageCount + 1,
      });
      let pendingTexts = prunePendingTexts(state.pendingTexts, action.receivedAt);
      if (!capture.images.length && !capture.pendingImageIds.length) {
        queue.splice(captureIndex, 1);
        if (capture.text && capture.textMessageId && capture.textSequence !== null && capture.textReceivedAt !== null) {
          const expiresAt = capture.textReceivedAt + LINE_PENDING_TEXT_TTL_MS;
          if (expiresAt > action.receivedAt) {
            pendingTexts = [...pendingTexts, {
              messageId: capture.textMessageId,
              chatId: capture.chatId,
              sequence: capture.textSequence,
              receivedAt: capture.textReceivedAt,
              expiresAt,
              text: capture.text,
            }];
          }
        }
      } else {
        queue[captureIndex] = capture;
      }
      return {
        ...state,
        queue,
        pendingTexts,
        processedMessageIds: rememberMessage(state.processedMessageIds, action.chatId, action.messageId),
        notice: null,
      };
    }
    case "text": {
      if (state.processedMessageIds.includes(messageKey(action.chatId, action.messageId))) return state;
      const pendingTexts = prunePendingTexts(state.pendingTexts, action.receivedAt);
      const captureIndex = state.queue.findIndex((capture) => capture.chatId === action.chatId && !capture.text);
      if (captureIndex >= 0) {
        const queue = [...state.queue];
        queue[captureIndex] = updateCapture(queue[captureIndex], {
          text: action.text,
          textMessageId: action.messageId,
          textSequence: action.sequence,
          textReceivedAt: action.receivedAt,
        });
        return {
          ...state,
          queue,
          pendingTexts,
          processedMessageIds: rememberMessage(state.processedMessageIds, action.chatId, action.messageId),
          notice: null,
        };
      }
      if (state.queue.some((capture) => capture.chatId === action.chatId) || pendingTexts.some((pending) => pending.chatId === action.chatId)) {
        return {
          ...state,
          pendingTexts,
          processedMessageIds: rememberMessage(state.processedMessageIds, action.chatId, action.messageId),
          notice: null,
        };
      }
      if (state.queue.length + pendingTexts.length >= LINE_CAPTURE_LIMIT) {
        return {
          ...state,
          pendingTexts,
          processedMessageIds: rememberMessage(state.processedMessageIds, action.chatId, action.messageId),
          notice: { type: "queue-full", id: action.receivedAt },
        };
      }
      return {
        ...state,
        pendingTexts: [...pendingTexts, {
          messageId: action.messageId,
          chatId: action.chatId,
          sequence: action.sequence,
          receivedAt: action.receivedAt,
          expiresAt: action.receivedAt + LINE_PENDING_TEXT_TTL_MS,
          text: action.text,
        }],
        processedMessageIds: rememberMessage(state.processedMessageIds, action.chatId, action.messageId),
        notice: null,
      };
    }
    case "copy-image": {
      const active = state.queue[0];
      if (!active || action.index < 0 || action.index >= active.images.length) return state;
      const image = active.images[action.index];
      const copied = {
        ...image,
        messageId: `${image.messageId}:copy:${active.images.length}`,
        sequence: Math.max(...active.images.map((item) => item.sequence), 0) + 1,
      };
      return {
        ...state,
        queue: [updateCapture(active, { images: [...active.images, copied] }), ...state.queue.slice(1)],
        notice: null,
      };
    }
    case "discard-active": {
      const active = state.queue[0];
      if (!active) return state;
      const processedMessageIds = active.pendingImageIds.reduce(
        (ids, messageId) => rememberMessage(ids, active.chatId, messageId),
        state.processedMessageIds,
      );
      return { ...state, queue: state.queue.slice(1), processedMessageIds, notice: null };
    }
    case "complete-capture":
      return { ...state, queue: state.queue.filter((capture) => capture.id !== action.id), notice: null };
    case "expire":
      return { ...state, pendingTexts: prunePendingTexts(state.pendingTexts, action.now), notice: null };
    case "clear-queue": {
      const processedMessageIds = state.queue.reduce(
        (ids, capture) => capture.pendingImageIds.reduce(
          (nextIds, messageId) => rememberMessage(nextIds, capture.chatId, messageId),
          ids,
        ),
        state.processedMessageIds,
      );
      return { ...state, queue: [], pendingTexts: [], processedMessageIds, notice: null };
    }
    case "clear":
      return initialCaptureState;
  }
}
