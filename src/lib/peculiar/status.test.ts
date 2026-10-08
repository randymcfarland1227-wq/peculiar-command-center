import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { POST_LAUNCH, countComplete, isClosed, isOpenTask, isPostLaunch, nextActions, showInTaskList } from "./status.ts";
import { STATUSES, type Task, type TaskStatus } from "./types.ts";

function task(id: string, patch: Partial<Task> = {}): Task {
  return {
    id,
    title: id,
    workstream: "launch",
    status: "NOT STARTED",
    priority: "NOW",
    section: "General",
    due: "",
    notes: "",
    dependencies: "",
    link: "",
    cost: "",
    owner: "Founder",
    completedDate: "",
    relatedExperiment: "",
    relatedSupplier: "",
    relatedDocument: "",
    launchArea: "",
    ...patch,
  };
}

const view = (patch: Partial<Parameters<typeof showInTaskList>[1]> = {}) => ({
  scope: "active" as const,
  priority: "ALL" as const,
  status: "ALL" as const,
  query: "",
  ...patch,
});

describe("Post launch status", () => {
  it("is a selectable status that sits right after COMPLETE, with every older status kept", () => {
    assert.ok(STATUSES.includes(POST_LAUNCH));
    assert.equal(STATUSES.indexOf(POST_LAUNCH), STATUSES.indexOf("COMPLETE") + 1);
    for (const old of ["NOT STARTED", "PLANNING", "IN PROGRESS", "WAITING", "TESTING", "DECIDED", "ORDERED", "COMPLETE", "BLOCKED"]) {
      assert.ok((STATUSES as readonly string[]).includes(old), old);
    }
  });

  it("is closed (not active) but never mistaken for COMPLETE", () => {
    assert.equal(isClosed(POST_LAUNCH), true);
    assert.equal(isClosed("COMPLETE"), true);
    assert.equal(isPostLaunch(POST_LAUNCH), true);
    assert.equal(isPostLaunch("COMPLETE"), false);
    for (const status of STATUSES.filter((s) => s !== "COMPLETE" && s !== POST_LAUNCH)) {
      assert.equal(isClosed(status as TaskStatus), false, status);
    }
    assert.equal(isOpenTask(task("a", { status: POST_LAUNCH })), false);
    assert.equal(isOpenTask(task("b", { status: "IN PROGRESS" })), true);
    assert.equal(isOpenTask(task("c", { status: "IN PROGRESS", afterLaunch: true })), false);
  });

  it("counts as done for launch progress and reports how many are post launch", () => {
    const tasks = [
      task("done", { status: "COMPLETE" }),
      task("later", { status: POST_LAUNCH }),
      task("open", { status: "IN PROGRESS" }),
      task("open2"),
      task("parked", { status: POST_LAUNCH, afterLaunch: true }),
    ];
    assert.deepEqual(countComplete(tasks), { done: 2, total: 4, postLaunch: 1, percent: 50 });
  });

  it("drops out of next actions", () => {
    const tasks = [task("later", { status: POST_LAUNCH }), task("open", { status: "IN PROGRESS" })];
    assert.deepEqual(
      nextActions(tasks).map((t) => t.id),
      ["open"],
    );
  });
});

describe("showInTaskList", () => {
  const later = task("later", { status: POST_LAUNCH });
  const laterLow = task("laterLow", { status: POST_LAUNCH, priority: "LATER" });
  const done = task("done", { status: "COMPLETE" });
  const open = task("open", { status: "IN PROGRESS" });
  const all = [later, laterLow, done, open];
  const ids = (v: ReturnType<typeof view>) => all.filter((t) => showInTaskList(t, v)).map((t) => t.id);

  it("hides post launch work from Now and next", () => {
    assert.deepEqual(ids(view()), ["open"]);
  });

  it("shows it in the full list next to complete work", () => {
    assert.deepEqual(ids(view({ scope: "all" })), ["later", "laterLow", "done", "open"]);
  });

  it("filters to post launch only, from either view, whatever the priority", () => {
    assert.deepEqual(ids(view({ status: POST_LAUNCH })), ["later", "laterLow"]);
    assert.deepEqual(ids(view({ scope: "all", status: POST_LAUNCH })), ["later", "laterLow"]);
  });

  it("keeps the old behaviour for open statuses in Now and next", () => {
    assert.deepEqual(ids(view({ status: "IN PROGRESS" })), ["open"]);
  });

  it("never shows tasks parked with the After launch switch", () => {
    assert.equal(showInTaskList(task("p", { status: POST_LAUNCH, afterLaunch: true }), view({ scope: "all" })), false);
  });
});

describe("saved data from before Post launch existed", () => {
  it("keeps every task's status exactly as saved", () => {
    const saved = STATUSES.filter((s) => s !== POST_LAUNCH).map((status, i) => task(`t${i}`, { status }));
    const roundTrip: Task[] = JSON.parse(JSON.stringify(saved));
    assert.deepEqual(
      roundTrip.map((t) => t.status),
      saved.map((t) => t.status),
    );
    // Only COMPLETE was closed before, and only COMPLETE is closed now.
    assert.deepEqual(
      roundTrip.filter((t) => isClosed(t.status)).map((t) => t.status),
      ["COMPLETE"],
    );
  });
});
