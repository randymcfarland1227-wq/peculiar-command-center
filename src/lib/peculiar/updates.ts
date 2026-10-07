import { GUIDES } from "./guides";
import { AFTER_LAUNCH_IDS, CUT_TASK_ALIASES, CUT_TASK_IDS, combinedTasks, economics, scents, skus } from "./seed";
import type { Decision, Experiment, PeculiarData, ResearchQuestion, Priority, SizeModel, Task, TaskStatus, TaskStep } from "./types";

/**
 * One-time changes to saved data. Each runs once per browser, is recorded in
 * `appliedUpdates`, and never runs again, so later edits are never overwritten.
 * Every change only touches values still at their old default.
 */
const UPDATES: { id: string; apply: (data: PeculiarData) => PeculiarData }[] = [
  { id: "2026-10-05-combine-tasks", apply: combineTasks },
  { id: "2026-10-05-regular-large", apply: regularAndLarge },
  { id: "2026-10-05-supplies", apply: recordSupplies },
  { id: "2026-10-05-wicks-labels-research", apply: wicksLabelsResearch },
  { id: "2026-10-05-research-findings", apply: researchFindings },
  { id: "2026-10-06-launch-sweep", apply: launchSweep },
];

export function applyUpdates(data: PeculiarData): PeculiarData {
  let next: PeculiarData = { ...data, appliedUpdates: data.appliedUpdates ?? [] };
  for (const update of UPDATES) {
    if (next.appliedUpdates.includes(update.id)) continue;
    next = update.apply(next);
    next = { ...next, appliedUpdates: [...next.appliedUpdates, update.id] };
  }
  return { ...next, tasks: withGuides(next.tasks) };
}

/** Copies the current how-to text onto matching fields. Guides are reference text, so they always refresh. */
function withGuides(tasks: Task[]): Task[] {
  return tasks.map((task) => {
    const guide = GUIDES[task.id];
    if (!guide || !task.steps) return task;
    return { ...task, steps: task.steps.map((item) => (guide[item.id] ? { ...item, how: guide[item.id] } : item)) };
  });
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

/** Swaps a value only while it still reads exactly as an earlier update wrote it. */
const REANSWER: Record<string, Record<string, [string, string]>> = {
  "pl-wax": {
    p1: ["One bought: 10 lb bag from Amazon", "One bought: Hearth & Harbor pure soy, 10 lb (Amazon)"],
    p5: ["Amazon wax, 10 lb bag ($33)", "Hearth & Harbor pure soy wax flakes, 10 lb ($33, Amazon)"],
  },
};

/** Fields answered by the wick order, the in-house labels, and the home-business lookup. */
const NEW_ANSWERS: Record<string, Record<string, string>> = {
  "pl-wicks": {
    p18: "Wood (Jiozermi, 15 mm). Cotton wicks that came with the wax are the backup",
    p19: "Amazon: Jiozermi wood wicks 15 × 150 mm, 50 with metal bases, $5.99",
  },
  "cm-costs": {
    m4: "$0.12 per wood wick ($5.99 for 50)",
    m8: "Made in-house: sticker paper and ink. Too small to track yet",
  },
  "co-legal": {
    c11: "Allowed: no sign, no customers at the house, no outside employees. No permit found; no trader's license (maker exemption)",
  },
};

const NEW_DECISIONS: Decision[] = [
  {
    id: "d21",
    date: "2026-10-05",
    decision: "Labels are made in-house: home printer, sticker paper, cut on a Silhouette Cameo.",
    category: "Brand",
    status: "DECIDED",
    reason: "No minimum order, and designs can change batch to batch.",
    evidence: "Printer and Cameo already owned; sticker paper sorted.",
    revisitWhen: "If print quality or time per label becomes a problem.",
    workstreams: ["brand", "commerce"],
  },
  {
    id: "d22",
    date: "2026-10-05",
    decision: "Wood wicks are the first wick tested.",
    category: "Wick",
    status: "WORKING ASSUMPTION",
    reason: "The crackle and wide, low flame suit the brand. Cotton wicks that came with the wax are the fallback.",
    evidence: "Jiozermi 15 mm wood wicks bought on Amazon.",
    revisitWhen: "After burn tests in each jar width. Wide jars may need two wicks.",
    workstreams: ["product-lab"],
  },
  {
    id: "d23",
    date: "2026-09-30",
    decision: "The brand stays anonymous: no founder name or face.",
    category: "Brand",
    status: "DECIDED",
    reason: "The brand's voice does the work a founder's face would. The mystery is part of the appeal.",
    evidence: "Founder preference.",
    revisitWhen: "Only by choice, later.",
    workstreams: ["brand", "launch", "company"],
  },
];

const OLD_RESEARCH: Record<string, { decisions?: Partial<Decision>; was: string }> = {
  d6: {
    was: "Soy-coconut, or a soy-dominant coconut blend, is the leading wax.",
    decisions: {
      date: "2026-10-05",
      decision: "The first batch uses Hearth & Harbor pure soy wax.",
      status: "DECIDED",
      reason: "Bought: 10 lb of soy flakes, rated for up to 10% fragrance.",
      evidence: "Amazon order, $33.",
      revisitWhen: "If hot throw is weak in the test jars.",
    },
  },
};

const OLD_QUESTIONS: Record<string, { was: string; patch: Partial<ResearchQuestion> }> = {
  q1: {
    was: "Which soy-coconut wax performs best?",
    patch: {
      question: "Does the soy wax throw well enough at 8%?",
      why: "The wax is bought. Pure soy can have a softer hot throw than blends.",
      evidenceNeeded: "Cold and hot throw notes from one test jar per scent.",
      decisionAffected: "Launch wax.",
    },
  },
  q9: {
    was: "Which recycled-glass supplier can hit the size bands?",
    patch: { status: "COMPLETE", evidenceNeeded: "Answered: Glassnow 10 oz and 13.5 oz recycled jars." },
  },
};

const OLD_EXPERIMENTS: Record<string, { was: string; patch: Partial<Experiment> }> = {
  "exp-wax": {
    was: "Soy-coconut wax test",
    patch: {
      name: "Soy wax test pours",
      hypothesis: "The Hearth & Harbor soy wax holds 8% fragrance with a clean, strong hot throw.",
      method: "Pour one 10 oz test jar per scent at 8% with a wood wick. Cure 1–2 weeks, then compare cold and hot throw.",
      materials: "Hearth & Harbor soy wax (10 lb), Jiozermi wood wicks, CandleScience oils.",
      nextAction: "Pour the test jars when the oils arrive (Oct 8–13).",
    },
  },
  "exp-scent": {
    was: "Scent 01 development",
    patch: {
      name: "Six-blend trials",
      hypothesis: "The six starting blends in the Candle Lab sheet smell as described once they're in wax.",
      method: "Mix 10 g of each blend by weight and check on blotters. Then pour one test jar each and adjust ratios using the sheet's notes.",
      materials: "14 CandleScience oils (order R157666947).",
      nextAction: "Mix the 10 g trials when the oils arrive (Oct 8–13).",
      status: "PLANNING",
    },
  },
};

function wicksLabelsResearch(data: PeculiarData): PeculiarData {
  const tasks = data.tasks.map((task) => {
    if (!task.steps) return task;
    const swap = REANSWER[task.id] ?? {};
    const fresh = NEW_ANSWERS[task.id] ?? {};
    const steps = task.steps.map((item) => {
      if (swap[item.id] && item.value === swap[item.id][0]) return { ...item, value: swap[item.id][1] };
      if (fresh[item.id] && !item.value.trim()) return { ...item, value: fresh[item.id] };
      return item;
    });
    return settle({ ...task, steps });
  });

  const suppliers = data.suppliers.map((item) => {
    if (item.id === "sup-wax" && item.name === "Amazon")
      return {
        ...item,
        product: "Hearth & Harbor pure soy wax flakes, 10 lb",
        website: "https://www.amazon.com/dp/B09ZG8P7ZB",
        notes: "Rated for up to 10% fragrance. Came with 100 cotton wicks (for 2.75–3.15 in. jars) and wick stickers.",
      };
    if (item.id === "sup-wick" && item.name === "Unchosen")
      return {
        ...item,
        name: "Amazon (Jiozermi)",
        product: "Wood wicks, 15 × 150 mm, with metal bases",
        website: "https://www.amazon.com/dp/B0BN78SDK7",
        sampleOrdered: true,
        unitCost: "$5.99 for 50",
        landedCost: "$0.12 per wick",
        notes: "Test in each jar width. Wide jars may need two.",
      };
    if (item.id === "sup-label" && item.name === "Unchosen")
      return {
        ...item,
        name: "In-house",
        product: "Labels printed at home and cut on a Silhouette Cameo",
        approved: true,
        unitCost: "Sticker paper and ink",
        notes: "No supplier needed.",
      };
    return item;
  });

  const acquisitions = data.acquisitions.map((item) => {
    if (item.status !== "NEED") return item;
    if (item.id === "ac-wick") return { ...item, status: "ORDERED" as const, price: item.price || "$5.99", url: item.url || "https://www.amazon.com/dp/B0BN78SDK7" };
    if (item.id === "ac-label") return { ...item, status: "STAPLE" as const, details: "Made in-house: printer, sticker paper, Silhouette Cameo." };
    return item;
  });
  const withWaxLink = acquisitions.map((item) =>
    item.id === "ac-wax" && !item.url ? { ...item, url: "https://www.amazon.com/dp/B09ZG8P7ZB" } : item,
  );

  const budget = data.budget.map((line) => (line.id === "bud-wick" && !line.actual ? { ...line, actual: 5.99, paid: 5.99 } : line));

  const economicsRows = data.economics.map((row) => {
    const cell = row.lines.wick;
    if (!cell || cell.source !== "ESTIMATE") return row;
    return { ...row, lines: { ...row.lines, wick: { amount: 0.12, source: "ACTUAL" as const } } };
  });

  const known = new Set(data.decisions.map((item) => item.id));
  const decisions = [
    ...data.decisions.map((item) => {
      const change = OLD_RESEARCH[item.id];
      return change && item.decision === change.was ? { ...item, ...change.decisions } : item;
    }),
    ...NEW_DECISIONS.filter((item) => !known.has(item.id)),
  ];

  const questions = data.questions.map((item) => {
    const change = OLD_QUESTIONS[item.id];
    return change && item.question === change.was ? { ...item, ...change.patch } : item;
  });

  const experiments = data.experiments.map((item) => {
    const change = OLD_EXPERIMENTS[item.id];
    return change && item.name === change.was ? { ...item, ...change.patch } : item;
  });

  const blockers = data.blockers.map((item) =>
    item.id === "bl5" && item.title === "Prices rest on estimates"
      ? { ...item, detail: "Wax, oil, jars, and wicks are real costs now. Packaging, closures, and retail prices are still estimates." }
      : item,
  );

  return { ...data, tasks, suppliers, acquisitions: withWaxLink, budget, economics: economicsRows, decisions, questions, experiments, blockers };
}

/** Answered research, checked October 5, 2026. Estimates are marked as estimates. */
function finding(
  id: string,
  question: string,
  category: string,
  answer: string,
  link: string,
  decisionAffected: string,
  workstreams: ResearchQuestion["workstreams"],
): ResearchQuestion {
  return {
    id,
    question,
    category,
    why: "Researched October 5, 2026.",
    evidenceNeeded: "",
    link,
    owner: "Founder",
    due: "",
    status: "COMPLETE",
    decisionAffected,
    workstreams,
    answer,
  };
}

const FINDINGS: ResearchQuestion[] = [
  finding(
    "q13",
    "What does an LLC cost to start and keep in Maryland?",
    "Company",
    "Filing: $100 state fee at Maryland Business Express, plus a card fee; expediting costs extra.\nEvery year after: $300 annual report (Form 1), due April 15. The first is due April 15, 2027.\nOptional: a registered-agent service, about $50–150 a year, keeps your home address off the public record.\nEIN: free from the IRS.",
    "https://www.zenbusiness.com/maryland-filing-fees/",
    "Business setup",
    ["company"],
  ),
  finding(
    "q14",
    "Do I need a trader's license or a home-business permit?",
    "Company",
    "Trader's license: no. Maryland exempts makers selling what they make.\nHome business: Baltimore County allows a home occupation with no sign outside, no customers buying at the house, no employees except family who live there, and only household equipment. Making candles and shipping them out fits; skip doorstep pickups.\nNo home-business permit found. Baltimore County Zoning Review in Towson can confirm.",
    "https://www.marylandcomptroller.gov/businesses/new-business/business-licenses.html",
    "Legal and tax",
    ["company"],
  ),
  finding(
    "q15",
    "How does Maryland sales tax work for this business?",
    "Company",
    "Register free with the Combined Registration Application once you have the EIN. Approval takes a few business days.\nCharge 6% on sales to Maryland buyers only.\nFile on the schedule the Comptroller assigns, even when you sold nothing.",
    "https://interactive.marylandtaxes.gov/webapps/comptrollercra",
    "Legal and tax",
    ["company", "commerce"],
  ),
  finding(
    "q16",
    "What insurance do I need, and what does it cost?",
    "Company",
    "Required by law: none, with no employees (no workers' comp or unemployment insurance).\nRecommended before the first sale: general liability with products liability, usually $1 million per claim. Estimate: about $450–1,500 a year.\nMaker plans: ACT Insurance's yearly plan is about $515 for $2 million; per-event cover starts around $49.\nHomeowners and renters policies usually exclude business activity. Markets and shops often ask for a certificate of insurance.",
    "https://www.actinsurance.com/candle-maker-insurance",
    "Insurance",
    ["company"],
  ),
  finding(
    "q17",
    "What will shipping cost?",
    "Shipping",
    "Estimates from September 30: a boxed 14–16 oz candle weighs about 1.5–2 lb, and USPS Ground Advantage runs about $7–12 depending on distance.\nBox, honeycomb paper, and card add about $1.50–2.50 an order.\nOptions: a flat $8 per order, or free shipping over $75 to encourage 2–3 candle orders.\nPirate Ship gives discounted USPS labels free, with no subscription.",
    "https://www.pirateship.com",
    "Shipping policy",
    ["commerce"],
  ),
  finding(
    "q18",
    "What's the cheapest way to take payments on the storefront?",
    "Storefront",
    "Estimates from September 30, from memory, so check the pricing pages before signing up:\nStripe Payment Links: no monthly fee.\nShopify Starter: about $5 a month, with buy buttons on your own site.\nCard processing: about 2.9% + $0.30 a sale.\nStart with Stripe plus Pirate Ship; switch if volume grows.",
    "https://stripe.com/payments/payment-links",
    "Storefront checkout",
    ["commerce"],
  ),
  finding(
    "q19",
    "What can the candles sell for, and what's the profit?",
    "Pricing",
    "Estimates from September 30: each candle costs about $7–10 to make.\nSuggested prices: Regular about $32, Large about $38 (recycled 10 oz about $28, 13.5 oz about $36).\nMargin after card fees: about 65–76%.\nThe first batch (about $335 of supplies) breaks even after about 12–13 sales.\n120 candles a month is about $3,950 in sales and $2,300–2,800 profit before income tax.",
    "",
    "Pricing",
    ["commerce", "launch"],
  ),
  finding(
    "q20",
    "How big is the candle market?",
    "Customer",
    "Approximate, from memory: US candle sales are about $3 billion a year (National Candle Association), and about 7 in 10 US households use candles.\nA large share of sales, often estimated at about a third, happens in the holiday season.\nPremium, clean candles are the fastest-growing part.",
    "https://candles.org",
    "Launch timing",
    ["launch"],
  ),
];

/** Research notes for the task cards, so the numbers sit where the work is. */
const TASK_NOTES: Record<string, string> = {
  "co-setup": "Costs: LLC $100 to file, then $300 every year (April 15). Registered agent about $50–150 a year if you want your address private. EIN free.",
  "co-legal": "Sales tax registration is free; charge 6% on Maryland sales. No trader's license or home-business permit needed.",
  "co-insurance": "Estimate: about $450–1,500 a year for $1 million. ACT maker plan about $515 a year for $2 million. Not required by law.",
  "cm-shipping": "Estimate: USPS about $7–12 per boxed candle; box and padding about $1.50–2.50 an order. Flat $8 or free over $75. Pirate Ship for labels.",
  "cm-store": "Checkout estimate: Stripe Payment Links, no monthly fee; card fees about 2.9% + $0.30.",
  "cm-pricing": "Estimate: Regular about $32, Large about $38. Cost to make about $7–10. Research page has the full numbers.",
};

function researchFindings(data: PeculiarData): PeculiarData {
  const known = new Set(data.questions.map((item) => item.id));
  const questions = [...FINDINGS.filter((item) => !known.has(item.id)), ...data.questions];

  const tasks = data.tasks.map((task) => {
    const note = TASK_NOTES[task.id];
    if (!note || task.notes.includes(note)) return task;
    return { ...task, notes: [task.notes, note].filter(Boolean).join("\n") };
  });

  const ESTIMATES: Record<string, [number, number]> = { "bud-form": [275, 200], "bud-ins": [900, 515] };
  const budget = data.budget.map((line) => {
    const change = ESTIMATES[line.id];
    return change && line.estimated === change[0] ? { ...line, estimated: change[1] } : line;
  });
  if (!budget.some((line) => line.id === "bud-annual")) {
    budget.splice(1, 0, { id: "bud-annual", label: "LLC annual report (yearly)", estimated: 300, actual: 0, paid: 0, workstreams: ["company"] });
  }

  return { ...data, questions, tasks, budget };
}

/** Fields finished on October 5–6, 2026: drafts, the storefront, the owner floor, and brand work. */
const SWEEP_ANSWERS: Record<string, Record<string, string>> = {
  "co-books": {
    c14: "Owner floor Ledger (peculiar-floor), with CSV import and export",
    c15: "Schedule C categories, from the bookkeeping draft",
    c16: "25% of each sale, set on the Ledger",
  },
  "pl-wax": {
    p6: "At least 7 days; re-test hot throw at 14 (Safety and QC standards)",
  },
  "pl-vessels": {
    p24: "No chips or cracks, labels and glue off, survives a warm-up with no craze, jar type has passed a burn test",
    p25: "Any chip or crack, crazing on warm-up, or too wide for a steady wick",
  },
  "sa-docs": {
    s1: "ASTM F2058, F2417, F2179, F1972, and no lead-core wicks (Safety and QC standards)",
  },
  "sa-burn": {
    s3: "Tests page, using the protocol in Safety and QC standards",
    s6: "Flame under 3 in, full melt pool by hour 4, glass side under about 140°F, no steady soot, burns calmly to 1/2 in",
  },
  "sa-release": {
    s9: "YYMMDD-NN-V-B, e.g. 261012-05-R-1",
    s10: "Glass, cured candle, and finish checks in Safety and QC standards",
    s11: "Eight checks in Safety and QC standards, including insurance before the first sale",
  },
  "br-logo": {
    b1: "Refined in Canva: Forest green, light green background, Since 2026",
    b2: "Peculiar Candle Co. in DM Serif Display, Forest green",
  },
  "br-system": {
    b5: "Forest #2F4F46 on parchment",
    b6: "Playfair Display Italic, DM Serif Display, Josefin Sans Light, Montserrat Medium",
    b7: "DM Serif Display, 01–06",
  },
  "br-labels": {
    b8: "Done in Canva",
    b9: "Done in Canva",
    b10: "Done",
    b11: "Done",
  },
  "br-pack": {
    b13: "Canva care card, 3.5 × 2 in, front and back",
  },
  "cm-costs": {
    m11: "Stripe: 2.9% + $0.30 per sale",
    m12: "$15/hr (used in the pricing sheet)",
  },
  "cm-pricing": {
    m14: "About $9.75 Regular, $11.25 Large (recycled jar, labor at $15/hr)",
    m16: "About 66% Regular, 68% Large after card fees",
    m15: "Regular $32, Large $40",
  },
  "cm-store": {
    sf1: "Live at peculiarcandle.com",
    sf2: "Built",
    sf3: "Reclaimed and Recycled pages",
    sf4: "Library plus a scene page for each blend, opened with an arrow",
    sf5: "Size, blend, and Clear / Color / Surprise Me",
    sf7: "About, Materials, and Care with FAQ",
    sf9: "Cart works on a phone",
    sf12: "Stripe Checkout, live",
  },
  "cm-waitlist": {
    sf10: "Footer form on the storefront",
    n9: "Written in the storefront footer",
  },
  "cm-shipping": {
    k7: "USPS Ground Advantage, labels through Pirate Ship",
    k8: "$8 flat, free over $75, free Baltimore pickup",
    k9: "June–September, may hold orders to places over 90°F; ship early in the week",
    k10: "Photo within 7 days, replacement or refund, no need to return it",
  },
  "la-golive": {
    l13: "Returns form live and tested; shipping policy and care card written",
  },
};

const SWEEP_DECISIONS: Decision[] = [
  {
    id: "d24",
    date: "2026-10-06",
    decision: "Regular is $32 and Large is $40, in either glass.",
    category: "Pricing",
    status: "DECIDED",
    reason: "A wider gap makes Large feel like a step up. Both keep about two-thirds margin.",
    evidence: "Pricing draft sheet, from real wax, oil, jar, and wick costs.",
    revisitWhen: "After customer price reactions or the first month of sales.",
    workstreams: ["commerce"],
  },
  {
    id: "d25",
    date: "2026-10-06",
    decision: "Shipping is $8 flat per order, free over $75, by USPS Ground Advantage.",
    category: "Policy",
    status: "DECIDED",
    reason: "Two Large candles ship free, which nudges orders up to two or three.",
    evidence: "Shipping policy draft. Label costs are estimates until a box is weighed.",
    revisitWhen: "Once real packed weights and zone prices are in.",
    workstreams: ["commerce"],
  },
];

function launchSweep(data: PeculiarData): PeculiarData {
  const tasks = data.tasks.map((task) => {
    const answers = SWEEP_ANSWERS[task.id];
    if (!answers || !task.steps) return task;
    const steps = task.steps.map((item) =>
      answers[item.id] && !item.value.trim() ? { ...item, value: answers[item.id] } : item,
    );
    return settle({ ...task, steps });
  });

  const known = new Set(data.decisions.map((item) => item.id));
  const decisions = [...data.decisions, ...SWEEP_DECISIONS.filter((item) => !known.has(item.id))];

  // Large moved from $38 to $40; only an untouched estimate changes.
  const economicsRows = data.economics.map((row) =>
    row.size === "Large" && row.retail.source === "ESTIMATE" && row.retail.amount === 38
      ? { ...row, retail: { amount: 40, source: "ACTUAL" as const } }
      : row,
  );

  // Not launch gates any more: prices and blends are set, so these wait until after launch.
  const parked = tasks.map((task) => (PARK_AFTER_LAUNCH.includes(task.id) && task.status !== "COMPLETE" ? { ...task, afterLaunch: true } : task));

  const blockers = data.blockers.map((item) => {
    const done = SWEEP_BLOCKERS[item.id];
    return done && item.title === done && !item.resolved ? { ...item, resolved: true } : item;
  });

  const questions = data.questions.map((item) => {
    const change = SWEEP_QUESTIONS[item.id];
    return change && item.question === change.was && item.status !== "COMPLETE" ? { ...item, status: "COMPLETE" as const, answer: item.answer || change.answer } : item;
  });

  const acquisitions = data.acquisitions.map((item) =>
    item.id === "ac-fill" && item.status === "NEED" ? { ...item, status: "ORDERED" as const, details: item.details || "Honeycomb paper" } : item,
  );

  const documents = data.documents.map((item) => {
    const url = SWEEP_DOCS[item.id];
    return url && !item.url ? { ...item, url } : item;
  });

  return { ...data, tasks: parked, decisions, economics: economicsRows, blockers, questions, acquisitions, documents };
}

const PARK_AFTER_LAUNCH = ["la-interviews", "r1"];

/** Blockers cleared Oct 6, matched on their original title. */
const SWEEP_BLOCKERS: Record<string, string> = {
  bl3: "Mystery vessel is untested with customers",
  bl5: "Prices rest on estimates",
};

const SWEEP_QUESTIONS: Record<string, { was: string; answer: string }> = {
  q4: {
    was: "What price feels justified to the target customer?",
    answer: "Set at Regular $32 and Large $40, about two-thirds margin. Revisit after the first month of sales.",
  },
  q8: {
    was: "What cure age is required before a candle can be sold?",
    answer: "At least 7 days; re-test hot throw at 14 (Safety and QC standards).",
  },
  q11: {
    was: "What is the exact unused-candle return window?",
    answer: "No returns on unburned candles unless something is wrong; damage reported with a photo within 7 days. Empty jars come back through Return to the Circle.",
  },
};

const SWEEP_DOCS: Record<string, string> = {
  "doc-safe": "https://claude.ai/code/artifact/5c0b50ab-d5ad-42dc-9add-c9b5f56f23d3",
};
