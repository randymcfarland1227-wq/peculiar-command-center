import { addTaskIfMissing } from "./added-tasks.ts";
import {
  BOOKKEEPING_NOTES,
  BOXES_TITLE,
  BUSINESS_SETUP_NOTES,
  FIRST_RUN_STEP,
  GO_LIVE_DEPENDENCIES,
  SHOPPING_ID,
  bookkeepingSteps,
  shoppingTask,
} from "./seed.ts";
import type { PeculiarData, Task, TaskStatus, TaskStep } from "./types.ts";

/**
 * Puts the plan in order (Oct 9, 2026): tasks wait on the ones before them, insurance is
 * optional, wicks, closures, and boxes fold into one Shopping list, packaging design joins
 * boxes, the waitlist moves to Launch, and every launch task waits on everything before it.
 * Like every update it runs once and only changes values still at their old defaults, so
 * anything edited by hand stays as it is. Lives apart from updates.ts so it can be tested.
 */
export function orderThePlan(data: PeculiarData): PeculiarData {
  const firstRun = `pl-vessels:${FIRST_RUN_STEP}`;
  let tasks = data.tasks.map((task) => ({ ...task }));
  const get = (id: string) => tasks.find((task) => task.id === id);
  const depsIf = (id: string, old: string, next: string) => {
    const task = get(id);
    if (task && (task.dependencies ?? "").trim() === old) task.dependencies = next;
  };

  // The vessel run gets its own field, the one wicks, closures, and boxes wait on.
  const vessels = get("pl-vessels");
  // A finished vessel task already settles the run, so it is left alone.
  if (vessels?.steps && vessels.status !== "COMPLETE" && !vessels.steps.some((item) => item.id === FIRST_RUN_STEP)) {
    const at = vessels.steps.findIndex((item) => item.id === "p23");
    const field: TaskStep = {
      id: FIRST_RUN_STEP,
      label: "First run",
      hint: "Which vessels go in the launch run. Wicks, closures, and boxes wait on this",
      value: "",
    };
    vessels.steps = [...vessels.steps.slice(0, at + 1), field, ...vessels.steps.slice(at + 1)];
  }

  // Wicks, closures, and boxes: locked until the vessel run, counted through the Shopping list.
  depsIf("pl-wicks", "pl-vessels, pl-wax, pl-fragrance", `${firstRun}, pl-wax, pl-fragrance`);
  depsIf("pl-closures", "pl-vessels", firstRun);
  depsIf("cm-boxes", "", firstRun);
  for (const id of ["pl-wicks", "pl-closures", "cm-boxes"]) {
    const task = get(id);
    if (task && task.partOf === undefined) task.partOf = SHOPPING_ID;
  }
  const boxes = get("cm-boxes");
  const pack = get("br-pack");
  if (boxes) {
    if (boxes.title === "Shipping boxes") boxes.title = BOXES_TITLE;
    if (pack) {
      const have = new Set((boxes.steps ?? []).map((item) => item.id));
      boxes.steps = [...(boxes.steps ?? []), ...(pack.steps ?? []).filter((item) => !have.has(item.id))];
      if (pack.notes.trim() && !boxes.notes.includes(pack.notes)) boxes.notes = [boxes.notes, pack.notes].filter(Boolean).join("\n");
      boxes.status = settled(boxes.status, boxes.steps);
      tasks = tasks.filter((task) => task.id !== "br-pack");
    }
  }
  tasks = addTaskIfMissing(tasks, shoppingTask(), boxes ? tasksBefore(tasks, "cm-boxes") : "cm-store");

  // Company: setup is blocked on money, legal waits on setup, insurance is optional.
  const setup = get("co-setup");
  if (setup && (setup.status === "NOT STARTED" || setup.status === "PLANNING")) setup.status = "BLOCKED";
  if (setup && !setup.notes.includes("Blocked:")) {
    const old = "File the LLC, then EIN, then business checking. A credit card is a later decision, not part of this action.";
    setup.notes = [BUSINESS_SETUP_NOTES, setup.notes.replace(old, "").trim()].filter(Boolean).join("\n");
  }
  depsIf("co-legal", "", "co-setup");
  const insurance = get("co-insurance");
  if (insurance && insurance.optional === undefined) {
    insurance.optional = true;
    insurance.notes = insurance.notes.replace("Need quotes before the first sale.", "Optional: not counted. Worth a quote before the first sale.");
  }

  // Bookkeeping: now, and spelled out.
  const books = get("co-books");
  if (books) {
    if (books.priority === "LATER") books.priority = "NOW";
    if (!books.notes.trim()) books.notes = BOOKKEEPING_NOTES;
    if (books.steps && books.status !== "COMPLETE") {
      const fresh = new Map(bookkeepingSteps().map((item) => [item.id, item]));
      const OLD_HINTS: Record<string, string> = {
        c14: "Tool or spreadsheet",
        c15: "The list",
        c16: "Share of each sale set aside",
      };
      books.steps = books.steps.map((item) =>
        OLD_HINTS[item.id] === item.hint ? { ...item, hint: fresh.get(item.id)!.hint } : item,
      );
      const have = new Set(books.steps.map((item) => item.id));
      books.steps = [...books.steps, ...[...fresh.values()].filter((item) => !have.has(item.id))];
    }
  }

  // Costs wait on what gets bought; pricing waits on costs.
  depsIf("cm-costs", "", `${SHOPPING_ID}, pl-wicks, pl-closures, cm-boxes`);
  depsIf("cm-pricing", "", "cm-costs");

  // Launch: the waitlist joins it, and nothing in it opens until everything before it is done.
  const waitlist = get("cm-waitlist");
  if (waitlist && waitlist.workstream === "commerce") {
    waitlist.workstream = "launch";
    if (waitlist.section === "Storefront") waitlist.section = "Readiness";
  }
  for (const id of ["cm-waitlist", "la-content", "la-interviews", "la-batch"]) depsIf(id, "", "*");
  depsIf("la-golive", "", GO_LIVE_DEPENDENCIES);
  const golive = get("la-golive");
  if (golive && !golive.notes.trim()) golive.notes = "The last step. Opens once every other launch task is done.";

  return { ...data, tasks };
}

/** The id just before `id`, so a task inserted after it lands right before `id`. */
function tasksBefore(tasks: Task[], id: string) {
  const at = tasks.findIndex((task) => task.id === id);
  return at > 0 ? tasks[at - 1].id : undefined;
}

/** A complete task that gained an empty field is back in progress. */
function settled(status: TaskStatus, steps: TaskStep[]): TaskStatus {
  return status === "COMPLETE" && steps.some((item) => !item.value.trim()) ? "IN PROGRESS" : status;
}
