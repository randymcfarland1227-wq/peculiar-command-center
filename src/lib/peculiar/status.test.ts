import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { POST_LAUNCH, countComplete, isClosed, isLocked, isOpenTask, isPostLaunch, nextActions, showInTaskList, waitingOn } from "./status.ts";
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
    assert.deepEqual(countComplete(tasks), { done: 2, total: 4, postLaunch: 1, open: 2, locked: 0, blocked: 0, percent: 50 });
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

describe("dependencies", () => {
  const step = (id: string, value = "") => ({ id, label: id.toUpperCase(), hint: "", value });

  it("locks a task until the task it names is closed", () => {
    const setup = task("setup", { workstream: "company", status: "BLOCKED" });
    const legal = task("legal", { workstream: "company", dependencies: "setup" });
    const all = [setup, legal];
    assert.equal(isLocked(legal, all), true);
    assert.deepEqual(waitingOn(legal, all), [{ id: "setup", label: "setup" }]);
    assert.equal(isOpenTask(legal, all), false);
    const done = [{ ...setup, status: "COMPLETE" as const }, legal];
    assert.equal(isLocked(legal, done), false);
    assert.equal(isOpenTask(legal, done), true);
  });

  it("waits on a single field with task:step", () => {
    const vessels = task("vessels", { workstream: "product-lab", steps: [step("inv", "done"), step("run")] });
    const shop = task("shop", { workstream: "commerce", dependencies: "vessels:run" });
    assert.deepEqual(waitingOn(shop, [vessels, shop]), [{ id: "vessels:run", label: "vessels: RUN" }]);
    const picked = { ...vessels, steps: [step("inv", "done"), step("run", "GNT, JS")] };
    assert.equal(isLocked(shop, [picked, shop]), false);
  });

  it("'*' waits on every counted task outside launch and research", () => {
    const store = task("store", { workstream: "commerce" });
    const research = task("notes", { workstream: "research" });
    const optional = task("ins", { workstream: "company", optional: true });
    const part = task("wicks", { workstream: "product-lab", partOf: "shop" });
    const waitlist = task("waitlist", { workstream: "launch", dependencies: "*" });
    const golive = task("golive", { workstream: "launch", dependencies: "*, waitlist" });
    const all = [store, research, optional, part, waitlist, golive];
    assert.deepEqual(waitingOn(waitlist, all).map((w) => w.id), ["store"]);
    assert.deepEqual(waitingOn(golive, all).map((w) => w.id), ["store", "waitlist"]);
    const ready = all.map((t) => (t.id === "store" ? { ...t, status: "COMPLETE" as const } : t));
    assert.equal(isLocked(waitlist, ready), false);
    assert.equal(isLocked(golive, ready), true);
  });

  it("ignores missing and optional dependencies", () => {
    const optional = task("ins", { optional: true });
    const t1 = task("a", { dependencies: "gone, ins" });
    assert.equal(isLocked(t1, [optional, t1]), false);
  });

  it("keeps locked, blocked, optional, and folded-in tasks out of the open count", () => {
    const all = [
      task("open"),
      task("blocked", { status: "BLOCKED" }),
      task("locked", { dependencies: "blocked" }),
      task("optional", { optional: true }),
      task("part", { partOf: "open" }),
    ];
    assert.deepEqual(countComplete(all), { done: 0, total: 3, postLaunch: 0, open: 1, locked: 1, blocked: 1, percent: 0 });
    assert.deepEqual(nextActions(all).map((t) => t.id), ["open"]);
  });

  it("resolves locks across groups when given every task", () => {
    const store = task("store", { workstream: "commerce" });
    const content = task("content", { workstream: "launch", dependencies: "*" });
    assert.equal(countComplete([content]).open, 1);
    assert.equal(countComplete([content], [store, content]).open, 0);
  });

  it("hides locked, blocked, and optional tasks from Now and next, shows them in the full list", () => {
    const blocked = task("blocked", { status: "BLOCKED" });
    const locked = task("locked", { dependencies: "blocked" });
    const optional = task("optional", { optional: true });
    const all = [blocked, locked, optional, task("open")];
    const ids = (v: ReturnType<typeof view>) => all.filter((t) => showInTaskList(t, v, all)).map((t) => t.id);
    assert.deepEqual(ids(view()), ["open"]);
    assert.deepEqual(ids(view({ scope: "all" })), ["blocked", "locked", "optional", "open"]);
    assert.deepEqual(ids(view({ status: "BLOCKED" })), ["blocked"]);
  });
});
