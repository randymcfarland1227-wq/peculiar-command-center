import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { stripeIntegrationTask } from "./added-tasks.ts";
import { UMBRELLA_STEPS, umbrellaSteps } from "./umbrella-steps.ts";
import type { PeculiarData, Task } from "./types.ts";

function saved(id: string, patch: Partial<Task> = {}): Task {
  return { ...stripeIntegrationTask(), id, title: id, status: "NOT STARTED", ...patch };
}
const run = (tasks: Task[]) => umbrellaSteps({ tasks } as PeculiarData).tasks;

describe("Umbrella steps", () => {
  it("adds the four new tasks next to their neighbours", () => {
    const ids = run([saved("cm-store"), saved("cm-stripe"), saved("la-content")]).map((t) => t.id);
    assert.deepEqual(ids, ["cm-store", "cm-brand-offer", "cm-ingredients", "cm-stripe", "cm-backend-sweep", "la-content", "la-channels"]);
  });

  it("appends only missing steps and keeps filled ones", () => {
    const burn = saved("sa-burn", { status: "IN PROGRESS", steps: [{ id: "s-std", label: "Mine", hint: "", value: "ASTM F2417" }] });
    const out = run([burn]).find((t) => t.id === "sa-burn")!;
    assert.equal(out.steps!.length, UMBRELLA_STEPS["sa-burn"].length);
    assert.equal(out.steps![0].value, "ASTM F2417");
  });

  it("reopens a finished task that gains new steps", () => {
    const done = saved("co-insurance", { status: "COMPLETE", completedDate: "2026-10-01", steps: [{ id: "c12", label: "x", hint: "", value: "yes" }] });
    assert.equal(run([done]).find((t) => t.id === "co-insurance")!.status, "IN PROGRESS");
  });

  it("brings the return framework forward from after launch", () => {
    const sf8 = run([saved("sf8", { afterLaunch: true, priority: "LATER" })]).find((t) => t.id === "sf8")!;
    assert.equal(sf8.afterLaunch, false);
    assert.equal(sf8.priority, "NEXT");
    assert.equal(sf8.steps!.length, 6);
  });

  it("leaves a deleted task deleted", () => {
    assert.equal(run([]).some((t) => t.id === "pl-vessels"), false);
  });
});
