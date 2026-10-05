import { AFTER_LAUNCH_IDS, CUT_TASK_ALIASES, CUT_TASK_IDS, combinedTasks, economics, scents, skus } from "./seed";
import type { Decision, PeculiarData, Priority, SizeModel, Task, TaskStatus, TaskStep } from "./types";

/**
 * One-time changes to saved data. Each runs once per browser, is recorded in
 * `appliedUpdates`, and never runs again, so later edits are never overwritten.
 * Every change only touches values still at their old default.
 */
const UPDATES: { id: string; apply: (data: PeculiarData) => PeculiarData }[] = [
  { id: "2026-10-05-combine-tasks", apply: combineTasks },
  { id: "2026-10-05-regular-large", apply: regularAndLarge },
  { id: "2026-10-05-supplies", apply: recordSupplies },
];

export function applyUpdates(data: PeculiarData): PeculiarData {
  let next: PeculiarData = { ...data, appliedUpdates: data.appliedUpdates ?? [] };
  for (const update of UPDATES) {
    if (next.appliedUpdates.includes(update.id)) continue;
    next = update.apply(next);
    next = { ...next, appliedUpdates: [...next.appliedUpdates, update.id] };
  }
  return next;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

/** Same rule as the store: complete once every field has an answer, in progress once any does. */
function statusFromSteps(current: TaskStatus, steps: TaskStep[]): TaskStatus {
  const filled = steps.filter((item) => item.value.trim()).length;
  if (steps.length && filled === steps.length) return "COMPLETE";
  if (current === "COMPLETE") return "IN PROGRESS";
  if (filled > 0 && (current === "NOT STARTED" || current === "PLANNING")) return "IN PROGRESS";
  return current;
}

function settle(task: Task): Task {
  const status = statusFromSteps(task.status, task.steps ?? []);
  return { ...task, status, completedDate: status === "COMPLETE" ? task.completedDate || today() : "" };
}

const RANK: Record<Priority, number> = { NOW: 0, NEXT: 1, LATER: 2 };

/**
 * Folds the old one-job-per-task lists into combined tasks with fields, parks the
 * after-launch tasks, and drops duplicates. A finished old task becomes a filled field;
 * notes on unfinished ones move into the combined task's notes so nothing is lost.
 * Old tasks already deleted stay deleted: their fields are left out.
 */
function combineTasks(data: PeculiarData): PeculiarData {
  const saved = data.tasks;
  const byId = new Map(saved.map((task) => [task.id, task]));
  const built = new Map<string, Task>();
  const parentOf = new Map<string, string>();

  for (const task of combinedTasks()) {
    if (byId.has(task.id)) continue;
    const kept = (task.steps ?? []).filter((item) => byId.has(item.id));
    if (!kept.length) continue;
    const carried: string[] = [];
    const steps = kept.map((item) => {
      const was = byId.get(item.id)!;
      parentOf.set(item.id, task.id);
      if (was.status === "COMPLETE") return { ...item, value: was.notes.trim() || "Done" };
      const note = was.notes.trim();
      if (note && !task.notes.includes(note)) carried.push(`${item.label}: ${note}`);
      return item;
    });
    const olds = kept.map((item) => byId.get(item.id)!);
    const priority = olds.reduce<Priority>((best, was) => (RANK[was.priority] < RANK[best] ? was.priority : best), task.priority);
    const due = task.due || olds.map((was) => was.due).filter(Boolean).sort()[0] || "";
    const notes = [task.notes, ...carried].filter(Boolean).join("\n");
    built.set(task.id, settle({ ...task, steps, notes, priority, due }));
  }

  // A cut duplicate that was finished fills the field it duplicated.
  const fill = (taskId: string, stepId: string, value: string, list: Task[]) =>
    list.map((task) =>
      task.id === taskId && task.steps?.some((item) => item.id === stepId && !item.value.trim())
        ? settle({ ...task, steps: task.steps.map((item) => (item.id === stepId ? { ...item, value } : item)) })
        : task,
    );

  const emitted = new Set<string>();
  let tasks: Task[] = [];
  for (const task of saved) {
    const parent = parentOf.get(task.id);
    if (parent) {
      if (!emitted.has(parent)) {
        emitted.add(parent);
        tasks.push(built.get(parent)!);
      }
      continue;
    }
    if (CUT_TASK_IDS.includes(task.id)) continue;
    tasks.push(AFTER_LAUNCH_IDS.includes(task.id) ? { ...task, afterLaunch: true } : task);
  }
  for (const [cutId, [taskId, stepId]] of Object.entries(CUT_TASK_ALIASES)) {
    const was = byId.get(cutId);
    if (was?.status === "COMPLETE") tasks = fill(taskId, stepId, was.notes.trim() || "Done", tasks);
  }
  return { ...data, tasks };
}

/** Small / Medium / Large becomes Regular (up to about 12 oz) and Large (13–16 oz). */
function regularAndLarge(data: PeculiarData): PeculiarData {
  const size = (value: string) => (value === "Small" || value === "Regular" ? "Regular" : "Large");
  const vessels = data.vessels.map((item) => ({ ...item, sizeClass: size(item.sizeClass) }) as typeof item);

  let rows = data.economics;
  const old = rows as unknown as (Omit<SizeModel, "size"> & { size: string })[];
  if (old.some((row) => row.size === "Small" || row.size === "Medium")) {
    const from = { Regular: old.find((row) => row.size === "Small"), Large: old.find((row) => row.size === "Medium") };
    rows = economics().map((fresh) => {
      const prior = from[fresh.size];
      if (!prior) return fresh;
      const lines = { ...fresh.lines };
      for (const key of Object.keys(lines) as (keyof typeof lines)[]) {
        const cell = prior.lines?.[key];
        if (cell && cell.source !== "ESTIMATE") lines[key] = cell;
      }
      if (!prior.lines) return { ...fresh, lines };
      // A cost line deleted on the Costs page stays deleted.
      for (const key of Object.keys(lines) as (keyof typeof lines)[]) {
        if (!(key in prior.lines)) delete lines[key];
      }
      const retail = prior.retail.source === "ESTIMATE" ? fresh.retail : prior.retail;
      return { ...fresh, retail, lines };
    });
  }

  const OLD_SKU_SCENTS = ["01 Bright / Fresh", "02 Green / Botanical", "03 Woody / Dark", "04 Warm / Gourmand", "05 Clean / Atmospheric"];
  const untouched = data.skus.every(
    (sku) => OLD_SKU_SCENTS.includes(sku.scent) && !sku.poured && !sku.curing && !sku.ready && !sku.sold,
  );
  const nextSkus = untouched ? skus() : data.skus.map((sku) => ({ ...sku, size: size(sku.size) }) as typeof sku);

  return { ...data, vessels, economics: rows, skus: nextSkus };
}

/** Field answers from the wax, glass, and fragrance orders. */
const STEP_ANSWERS: Record<string, Record<string, string>> = {
  "pl-wax": {
    p1: "One bought: 10 lb bag from Amazon",
    p5: "Amazon wax, 10 lb bag ($33)",
  },
  "pl-vessels": {
    p27: "Glassnow",
    p29: "Glassnow, Sep 30: 12 × 10 oz Flat Round + 6 × 13.5 oz Classico, $63.74 shipped",
  },
  "pl-fragrance": {
    p7: "Off the Record, Art Class Soap, Legend Has It, Haute Vanilla, Streetlights On, Butterfly Conservatory",
    p8: "Launches as Butterfly Conservatory",
    p9: "Name, notes, and story for all six (Scent lab)",
    p10: "CandleScience",
    p11: "CandleScience, Oct 5: 14 oils, 35 oz, $129.36. Arrives Oct 8–13",
    p15: "Candle Lab sheet, Recommended Blends tab",
    p16: "8% to start, adjusted per scent after testing",
    p17: "$3.70 per oz ($129.36 ÷ 35 oz)",
  },
  "co-name": {
    c3: "Owned",
    c4: "Handle secured",
  },
  "cm-costs": {
    m2: "$0.21 per oz ($33 for 10 lb, Amazon)",
    m3: "$3.70 per oz of oil (CandleScience)",
    m5: "Recycled $3.40 (10 oz) and $3.57 (13.5 oz) landed; reclaimed about $1",
  },
  "cm-boxes": {
    k4: "Honeycomb paper (ordered)",
  },
};

const OLD_DECISIONS: Record<string, { was: string; patch: Partial<Decision> }> = {
  d4: {
    was: "Working sizes are Small 8–10 oz, Medium 12–16 oz, and Large 17–20 oz.",
    patch: {
      date: "2026-10-05",
      decision: "Working sizes are Regular (up to about 12 oz) and Large (13–16 oz).",
      reason: "Most reclaimed stock is large, and very little runs above 16 oz. Two sizes keep the shop simple.",
      evidence: "Current reclaimed stock, plus the 10 oz and 13.5 oz Glassnow jars.",
      revisitWhen: "If enough jars over 16 oz turn up for a third size.",
    },
  },
  d9: {
    was: "About five permanent signature scents are planned.",
    patch: {
      date: "2026-10-05",
      decision: "Six signature scents: Off the Record, Art Class Soap, Legend Has It, Haute Vanilla, Streetlights On, Butterfly Conservatory.",
      evidence: "Names, notes, and starting formulas in the Candle Lab sheet. Oils ordered Oct 5.",
      revisitWhen: "If a blend fails testing.",
    },
  },
  d10: {
    was: "A sixth experimental or seasonal scent may rotate.",
    patch: { status: "SUPERSEDED", revisitWhen: "Replaced by six permanent scents." },
  },
  d11: {
    was: "The working fragrance load is about 6% by wax weight.",
    patch: {
      date: "2026-10-05",
      decision: "The working fragrance load is about 8% by wax weight.",
      reason: "The first batch was planned at 8%. Example: 10 oz wax × 8% = 0.8 oz fragrance.",
    },
  },
  d18: {
    was: "Price bands are Small $34–40, Medium $42–50, Large $52–64.",
    patch: { status: "SUPERSEDED", revisitWhen: "Sizes are now Regular and Large. Set prices on the Pricing task." },
  },
};

function recordSupplies(data: PeculiarData): PeculiarData {
  const tasks = data.tasks.map((task) => {
    const answers = STEP_ANSWERS[task.id];
    if (!answers || !task.steps) return task;
    const steps = task.steps.map((item) =>
      answers[item.id] && !item.value.trim() ? { ...item, value: answers[item.id] } : item,
    );
    return settle({ ...task, steps });
  });

  // A slot still holding its old concept takes the finished scent; anything edited by hand stays.
  const finished = scents();
  const saved = data.scents.map((item) => {
    const scent = finished.find((next) => next.slot === item.slot);
    if (!scent || item.approved || item.formula.trim()) return item;
    return { ...scent, inspiration: item.inspiration, coldThrow: item.coldThrow, hotThrow: item.hotThrow };
  });
  const missing = finished.filter((scent) => !saved.some((item) => item.slot === scent.slot));

  const suppliers = data.suppliers.map((item) => {
    if (item.name !== "Unchosen") return item;
    if (item.id === "sup-wax")
      return { ...item, name: "Amazon", product: "Candle wax, 10 lb bag", sampleOrdered: true, approved: true, unitCost: "$33 per 10 lb", landedCost: "$0.21 per oz", notes: "Bought. Add the product name and link." };
    if (item.id === "sup-glass")
      return {
        ...item,
        name: "Glassnow",
        product: "10 oz Flat Round (G5240) and 13.5 oz Classico (G2225) recycled-glass jars",
        website: "https://www.glassnow.com",
        sampleOrdered: true,
        unitCost: "$2.31 (10 oz), $2.48 (13.5 oz)",
        shipping: "$19.63 FedEx Ground for 18 jars",
        landedCost: "$3.40 (10 oz), $3.57 (13.5 oz)",
        notes: "Order #1100093686, Sep 30: 12 × 10 oz + 6 × 13.5 oz, $63.74.",
      };
    if (item.id === "sup-frag")
      return {
        ...item,
        name: "CandleScience",
        product: "14 fragrance oils for the six blends",
        website: "https://www.candlescience.com",
        sampleOrdered: true,
        unitCost: "$3.49–3.89 per 1 oz, $12.85–14.94 per 4 oz",
        shipping: "$19.99 flat for $100–249.99",
        landedCost: "$3.70 per oz",
        leadTime: "Ships from North Carolina and Texas; arrives Oct 8–13",
        notes: "Order R157666947, Oct 5: 23 bottles, 35 oz, $129.36 after 15% off. Paid with Zip in four payments.",
      };
    return item;
  });

  const ORDERS: Record<string, string> = { "ac-wax": "$33", "ac-frag": "$129.36", "ac-glass": "$63.74" };
  const acquisitions = data.acquisitions.map((item) =>
    ORDERS[item.id] && item.status === "NEED" ? { ...item, status: "ORDERED" as const, price: item.price || ORDERS[item.id] } : item,
  );

  const SPENT: Record<string, { actual: number; paid: number }> = {
    "bud-wax": { actual: 33, paid: 33 },
    "bud-frag": { actual: 129.36, paid: 33.59 },
    "bud-vessel": { actual: 63.74, paid: 63.74 },
  };
  const budget = data.budget.map((line) => (SPENT[line.id] && !line.actual ? { ...line, ...SPENT[line.id] } : line));

  const blockers = data.blockers.map((item) =>
    item.id === "bl1" && item.title === "Waiting on wax samples" ? { ...item, resolved: true } : item,
  );

  const decisions = data.decisions.map((item) => {
    const change = OLD_DECISIONS[item.id];
    return change && item.decision === change.was ? { ...item, ...change.patch } : item;
  });

  const questions = data.questions.map((item) =>
    item.id === "q4" && item.evidenceNeeded === "Interviews against Small, Medium, and Large."
      ? { ...item, evidenceNeeded: "Interviews against Regular and Large." }
      : item,
  );

  return { ...data, tasks, scents: [...saved, ...missing], suppliers, acquisitions, budget, blockers, decisions, questions };
}
