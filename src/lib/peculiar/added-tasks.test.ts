import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { STRIPE_TASK_ID, addTaskIfMissing, stripeIntegrationTask } from "./added-tasks.ts";
import type { Task } from "./types.ts";

function saved(id: string, patch: Partial<Task> = {}): Task {
  return { ...stripeIntegrationTask(), id, title: id, status: "IN PROGRESS", notes: `my notes on ${id}`, due: "", ...patch };
}

describe("Stripe integration task", () => {
  it("is a not-started Commerce task due Fri Oct 9, 2026, with all seven steps", () => {
    const task = stripeIntegrationTask();
    assert.equal(task.title, "Stripe backend to frontend integration");
    assert.equal(task.workstream, "commerce");
    assert.equal(task.status, "NOT STARTED");
    assert.equal(task.due, "2026-10-09");
    assert.equal(task.launchArea, "Storefront");
    for (const n of [1, 2, 3, 4, 5, 6, 7]) assert.match(task.notes, new RegExp(`^${n}\\) `, "m"));
    assert.ok(task.notes.includes("https://peculiar-floor.randymcfarland1227.workers.dev/api/stripe/webhook"));
    assert.ok(task.notes.includes("4242 4242 4242 4242"));
  });
});

describe("addTaskIfMissing", () => {
  const existing = [saved("co-setup", { status: "COMPLETE" }), saved("cm-store"), saved("cm-waitlist", { status: "POST LAUNCH" })];

  it("adds the new task after Storefront and leaves every saved task exactly as it was", () => {
    const before = structuredClone(existing);
    const next = addTaskIfMissing(existing, stripeIntegrationTask(), "cm-store");
    assert.deepEqual(
      next.map((t) => t.id),
      ["co-setup", "cm-store", STRIPE_TASK_ID, "cm-waitlist"],
    );
    assert.deepEqual(
      next.filter((t) => t.id !== STRIPE_TASK_ID),
      before,
    );
    assert.deepEqual(existing, before, "input not mutated");
  });

  it("never overwrites a copy that is already saved (edited, completed, or post launch)", () => {
    const mine = saved(STRIPE_TASK_ID, { title: "Renamed by Randy", status: "COMPLETE" });
    const list = [...existing, mine];
    const next = addTaskIfMissing(list, stripeIntegrationTask(), "cm-store");
    assert.equal(next, list);
  });

  it("puts it first when Storefront was deleted", () => {
    const next = addTaskIfMissing([saved("co-setup")], stripeIntegrationTask(), "cm-store");
    assert.deepEqual(
      next.map((t) => t.id),
      [STRIPE_TASK_ID, "co-setup"],
    );
  });
});
