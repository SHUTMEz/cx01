import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types test runner requires the explicit extension.
import { initialLineServiceState, lineServiceReducer } from "./serviceState.ts";

test("starting with an account moves the service to running", () => {
  const state = lineServiceReducer(
    { ...initialLineServiceState, accountId: "line-user-1" },
    { type: "start" },
  );

  assert.equal(state.status, "running");
  assert.equal(state.message, "Waiting for incoming data");
});

test("starting without an account keeps the service ready", () => {
  const state = lineServiceReducer(initialLineServiceState, { type: "start" });

  assert.equal(state.status, "ready");
  assert.equal(state.message, "Connect a LINE account to start");
});

test("stopping a running service returns it to stopped", () => {
  const running = lineServiceReducer(
    { ...initialLineServiceState, accountId: "line-user-1" },
    { type: "start" },
  );

  const stopped = lineServiceReducer(running, { type: "stop" });

  assert.equal(stopped.status, "stopped");
  assert.equal(stopped.message, "Service is stopped");
});
