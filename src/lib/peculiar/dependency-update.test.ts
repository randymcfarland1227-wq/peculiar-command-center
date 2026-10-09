import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { orderThePlan } from "./dependency-update.ts";
import { seedData } from "./seed.ts";
import { countComplete, isLocked, isOpenTask } from "./status.ts";
import type { PeculiarData, Task } from "./types.ts";

/** A browser saved before this update: the old task shapes, as the seed used to make them. */
function oldSave(): PeculiarData {
  const data = seedData();
  const tasks = data.tasks
    .filter((task) => task.id !== "cm-shopping")
    .map((task): Task => {
      const t = { ...task, optional: undefined, partOf: undefined };
      if (t.id === "pl-vessels") t.steps = t.steps!.filter((s) => s.id !== "p-run");
      if (t.id === "pl-wicks") t.dependencies = "pl-vessels, pl-wax, pl-fragrance";
      if (t.id === "pl-closures") t.dependencies = "pl-vessels";
      if (t.id === "co-setup") {
        t.status = "NOT STARTED";
        t.notes = "File the LLC, then EIN, then business checking. A credit card is a later decision, not part of this action.";
      }
      if (t.id === "co-insurance") t.notes = "Need quotes before the first sale.";
      if (t.id === "co-books") {
        t.priority = "LATER";
        t.notes = "";
        t.steps = [
          { id: "c14", label: "Bookkeeping", hint: "Tool or spreadsheet", value: "" },
          { id: "c15", label: "Expense categories", hint: "The list", value: "Schedule C" },
          { id: "c16", label: "Tax reserve", hint: "Share of each sale set aside", value: "" },
        ];
      }
      if (t.id === "cm-boxes") {
        t.title = "Shipping boxes";
        t.steps = t.steps!.filter((s) => s.id !== "b12" && s.id !== "b13");
      }
      if (t.id === "cm-waitlist") {
        t.workstream = "commerce";
        t.section = "Storefront";
      }
      if (["cm-costs", "cm-pricing", "cm-boxes", "cm-waitlist", "co-legal", "la-content", "la-interviews", "la-batch", "la-golive"].includes(t.id)) {
        t.dependencies = "";
      }
      if (t.id === "la-golive") t.notes = "";
      return t;
    });
  const pack: Task = {
    ...tasks.find((t) => t.id === "cm-boxes")!,
    id: "br-pack",
    title: "Packaging design",
    workstream: "brand",
    partOf: undefined,
    notes: "Kraft, not white.",
    steps: [
      { id: "b12", label: "Closure look", hint: "", value: "Cork" },
      { id: "b13", label: "Care card", hint: "", value: "" },
    ],
  };
  return { ...data, tasks: [...tasks, pack] };
}

const byId = (data: PeculiarData, id: string) => data.tasks.find((task) => task.id === id)!;

describe("orderThePlan", () => {
  const next = orderThePlan(oldSave());

  it("chains business setup → legal and tax, and blocks setup", () => {
    assert.equal(byId(next, "co-setup").status, "BLOCKED");
    assert.match(byId(next, "co-setup").notes, /\$100/);
    assert.equal(byId(next, "co-legal").dependencies, "co-setup");
    assert.equal(isLocked(byId(next, "co-legal"), next.tasks), true);
  });

  it("makes insurance optional", () => {
    assert.equal(byId(next, "co-insurance").optional, true);
  });

  it("spells out bookkeeping and keeps what was filled in", () => {
    const books = byId(next, "co-books");
    assert.equal(books.priority, "NOW");
    assert.deepEqual(books.steps!.map((s) => s.id), ["c14", "c15", "c16", "c17", "c18"]);
    assert.equal(books.steps![1].value, "Schedule C");
    assert.match(books.steps![0].hint, /Peculiar Floor/);
  });

  it("folds packaging design into boxes and adds one Shopping list", () => {
    assert.equal(next.tasks.some((t) => t.id === "br-pack"), false);
    const boxes = byId(next, "cm-boxes");
    assert.equal(boxes.title, "Boxes and packaging design");
    assert.equal(boxes.steps!.find((s) => s.id === "b12")!.value, "Cork");
    assert.match(boxes.notes, /Kraft/);
    assert.equal(next.tasks.filter((t) => t.id === "cm-shopping").length, 1);
    for (const id of ["pl-wicks", "pl-closures", "cm-boxes"]) assert.equal(byId(next, id).partOf, "cm-shopping");
  });

  it("locks shopping, wicks, closures, and boxes behind the vessel run, then opens them", () => {
    for (const id of ["cm-shopping", "pl-closures", "cm-boxes"]) assert.equal(isLocked(byId(next, id), next.tasks), true, id);
    const vessels = byId(next, "pl-vessels");
    const picked = {
      ...next,
      tasks: next.tasks.map((t) =>
        t.id === "pl-vessels" ? { ...t, steps: vessels.steps!.map((s) => (s.id === "p-run" ? { ...s, value: "GNT, JS" } : s)) } : t,
      ),
    };
    for (const id of ["cm-shopping", "pl-closures", "cm-boxes"]) assert.equal(isLocked(byId(picked, id), picked.tasks), false, id);
  });

  it("chains real costs → pricing and moves the waitlist into launch", () => {
    assert.equal(byId(next, "cm-costs").dependencies, "cm-shopping, pl-wicks, pl-closures, cm-boxes");
    assert.equal(byId(next, "cm-pricing").dependencies, "cm-costs");
    assert.equal(byId(next, "cm-waitlist").workstream, "launch");
    const launch = next.tasks.filter((t) => t.workstream === "launch" && !t.afterLaunch);
    assert.equal(launch.length, 5);
    for (const t of launch) assert.equal(isOpenTask(t, next.tasks), false, t.id);
  });

  it("never touches values edited by hand", () => {
    const save = oldSave();
    save.tasks = save.tasks.map((t) => (t.id === "cm-pricing" ? { ...t, dependencies: "my-own" } : t.id === "co-setup" ? { ...t, status: "IN PROGRESS" } : t));
    const out = orderThePlan(save);
    assert.equal(byId(out, "cm-pricing").dependencies, "my-own");
    assert.equal(byId(out, "co-setup").status, "IN PROGRESS");
  });

  it("matches a fresh browser's plan", () => {
    const fresh = seedData();
    const ids = (d: PeculiarData) => d.tasks.map((t) => t.id).sort();
    assert.deepEqual(ids(next), ids(fresh));
    const shape = (d: PeculiarData) => d.tasks.map((t) => [t.id, t.dependencies, Boolean(t.optional), t.partOf ?? "", t.workstream]).sort();
    assert.deepEqual(shape(next), shape(fresh));
    assert.deepEqual(countComplete(next.tasks).open, countComplete(fresh.tasks).open);
  });
});
