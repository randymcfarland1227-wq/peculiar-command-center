import type {
  Blocker,
  BudgetLine,
  BurnTest,
  ContentItem,
  CostKey,
  Decision,
  DocLink,
  Experiment,
  LaunchSku,
  MoneyCell,
  PeculiarData,
  ResearchQuestion,
  Scent,
  SizeModel,
  Supplier,
  Task,
  TaskStep,
  Vessel,
  Workstream,
  Acquisition,
} from "./types";

const emptyTask = {
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
  launchArea: "" as const,
};

function t(
  id: string,
  title: string,
  workstream: Task["workstream"],
  status: Task["status"],
  priority: Task["priority"],
  section: string,
  extra: Partial<Task> = {},
): Task {
  return { id, title, workstream, status, priority, section, ...emptyTask, ...extra };
}

const step = (id: string, label: string, hint: string): TaskStep => ({ id, label, hint, value: "" });

/**
 * The five Product Lab components, each one task whose fields are worked left to right.
 * Step ids are the ids of the separate tasks they replaced, so saved progress carries over.
 * Order here is the build order: vessels and wax first, wicks once the others are known.
 */
export function productLabTracks(): Task[] {
  return [
    t("pl-vessels", "Vessels", "product-lab", "IN PROGRESS", "NOW", "Vessels", {
      due: "2026-10-06",
      relatedExperiment: "exp-vessel",
      relatedSupplier: "sup-glass",
      notes: "Example rows in Inventory are placeholders until measured.",
      launchArea: "Inventory",
      steps: [
        step("p23", "Inventory", "Measured and classified by fill range, diameter, and profile"),
        step(FIRST_RUN_STEP, "First run", "Which vessels go in the launch run. Wicks, closures, and boxes wait on this"),
        step("p24", "Acceptance criteria", "What a vessel needs to pass"),
        step("p25", "Rejection criteria", "What rules a vessel out"),
        step("p26", "Old branding", "Which marks stay, which come off"),
        step("p27", "Wholesale supplier", "Recycled-glass supplier"),
        step("p29", "Glass samples", "Ordered from, and when"),
        step("p28", "Backup supplier", "Second recycled-glass source"),
      ],
    }),
    t("pl-wax", "Wax", "product-lab", "PLANNING", "NOW", "Wax", {
      due: "2026-10-03",
      relatedExperiment: "exp-wax",
      relatedSupplier: "sup-wax",
      launchArea: "Product",
      steps: [
        step("p1", "Wax candidates", "Soy-coconut blends ordered"),
        step("p2", "Finish", "How each candidate sets up"),
        step("p3", "Scent performance", "Which carries fragrance best"),
        step("p4", "Cure behavior", "How each changes while curing"),
        step("p5", "Wax", "The launch wax"),
        step("p6", "Cure standard", "Peculiar's minimum cure"),
      ],
    }),
    t("pl-fragrance", "Fragrance", "product-lab", "NOT STARTED", "NOW", "Fragrance", {
      due: "2026-10-10",
      relatedExperiment: "exp-scent",
      relatedSupplier: "sup-frag",
      notes: "Design each scent in the Scent lab below. This track holds the decisions around them.",
      launchArea: "Product",
      steps: [
        step("p7", "Scent concepts", "Places, memories, objects, atmospheres. Not vanilla, lavender, lemon, or sandalwood"),
        step("p8", "Scent 06", "Launches now or waits"),
        step("p9", "Scent briefs", "One brief per scent"),
        step("p10", "Fragrance suppliers", "Sourced from each concept"),
        step("p11", "Samples", "Ordered from, and when"),
        step("p12", "Formulas", "Blended and tested"),
        step("p13", "Cold throw", "Results"),
        step("p14", "Hot throw", "Results"),
        step("p15", "Formula records", "Where each formula is written down"),
        step("p16", "Fragrance load", "By scent. 6% by wax weight is only the starting point"),
        step("p17", "Cost per ounce", "Each final fragrance"),
      ],
    }),
    t("pl-wicks", "Wicks", "product-lab", "NOT STARTED", "NEXT", "Wicks", {
      relatedSupplier: "sup-wick",
      dependencies: `${FIRST_RUN}, pl-wax, pl-fragrance`,
      partOf: SHOPPING_ID,
      notes: "Bigger sizes may be needed. Decide after the vessel run.",
      launchArea: "Product",
      steps: [
        step("p18", "Wick families", "Which families to test"),
        step("p19", "Wick sampler", "Ordered from, and when"),
        step("p20", "By vessel", "Results by diameter and profile"),
        step("p21", "By fragrance", "Results by scent"),
        step("p22", "Wick combinations", "The combinations that pass"),
      ],
    }),
    t("pl-closures", "Closures", "product-lab", "NOT STARTED", "NEXT", "Closures", {
      relatedExperiment: "exp-cork",
      dependencies: FIRST_RUN,
      partOf: SHOPPING_ID,
      notes: "Measure with the closure tool once the first-run vessels are picked.",
      launchArea: "Packaging",
      steps: [
        step("p30", "Closure", "Lid or cork"),
        step("p31", "Cork prototype", "How it fits and seals"),
        step("p32", "Beeswax detail", "How the seal looks and holds"),
        step("p33", "Heat and shipping", "Stability results"),
        step("p34", "Every line?", "Which lines get a closure"),
        step("p35", "Closure cost", "Per candle"),
      ],
    }),
  ];
}

const est = (amount: number): MoneyCell => ({ amount, source: "ESTIMATE" });

function model(
  size: SizeModel["size"],
  band: string,
  retail: number,
  lines: Record<CostKey, number>,
): SizeModel {
  return {
    size,
    band,
    retail: est(retail),
    lines: {
      wax: est(lines.wax),
      fragrance: est(lines.fragrance),
      wick: est(lines.wick),
      vessel: est(lines.vessel),
      prepLabor: est(lines.prepLabor),
      closure: est(lines.closure),
      labels: est(lines.labels),
      packaging: est(lines.packaging),
      paymentFees: est(lines.paymentFees),
      shippingMaterials: est(lines.shippingMaterials),
      defectAllowance: est(lines.defectAllowance),
      labor: est(lines.labor),
    },
  };
}

export function seedData(): PeculiarData {
  return {
    tasks: tasks(),
    decisions: decisions(),
    experiments: experiments(),
    scents: scents(),
    vessels: vessels(),
    tests: tests(),
    suppliers: suppliers(),
    economics: economics(),
    budget: budget(),
    skus: skus(),
    content: content(),
    questions: questions(),
    documents: documents(),
    blockers: blockers(),
    acquisitions: acquisitions(),
    removedAcquisitions: [],
    appliedUpdates: [],
  };
}

function acquisitions(): Acquisition[] {
  const item = (id: string, name: string, purpose: string, details = ""): Acquisition => ({
    id,
    name,
    category: name,
    purpose,
    url: "",
    price: "",
    thoughts: "",
    details,
    status: "NEED",
    notes: "",
  });
  return [
    item("ac-label", "Labels", "for candles", "Front label and the safety label. Design comes first."),
    item("ac-wax", "Wax", "for candles and experiments", "Compare two or three soy-coconut candidates before locking a launch wax."),
    item("ac-frag", "Fragrance", "for the five signatures", "Samples only, and not until the scent briefs exist."),
    item("ac-wick", "Wicks", "for burn tests", "A sampler that covers narrow, standard, and wide profiles."),
    item("ac-glass", "Vessels", "for the Recycled line", "A predictable recycled-glass vessel, not a one-off jar."),
    item("ac-glass2", "Backup glass", "for a second source", "So one supplier cannot stop the line."),
    item("ac-cork", "Cork", "for closures", "Prototype before this becomes a staple."),
    item("ac-seal", "Beeswax", "for the seal detail", "Has to survive heat and a parcel."),
    item("ac-box1", "One-candle mailer", "for shipping one candle", "Has to protect uneven reclaimed glass."),
    item("ac-box2", "Multi-candle mailer", "for gifts and larger orders"),
    item("ac-fill", "Padding", "for uneven glass"),
  ];
}

/** The vessel-run field that wicks, closures, and boxes wait on. */
export const FIRST_RUN_STEP = "p-run";
const FIRST_RUN = `pl-vessels:${FIRST_RUN_STEP}`;

/** One required task for everything still to buy. Wicks, Closures, and Boxes fold into it. */
export const SHOPPING_ID = "cm-shopping";
export const SHOPPING_PARTS = ["pl-wicks", "pl-closures", "cm-boxes"];
export const BOXES_TITLE = "Boxes and packaging design";

/** Launch tasks wait on everything before launch ("*"); go live also waits on the other launch tasks. */
export const GO_LIVE_DEPENDENCIES = "*, la-content, la-interviews, la-batch, cm-waitlist";

export function shoppingTask(): Task {
  return t(SHOPPING_ID, "Shopping list", "commerce", "NOT STARTED", "NEXT", "Shopping", {
    dependencies: FIRST_RUN,
    link: "/acquiring",
    notes:
      "Counts as one task. Wicks, Closures, and Boxes and packaging design sit inside it and aren't counted on their own. Every item to buy lives on the Acquiring page.",
    launchArea: "Inventory",
    steps: [
      step("sh-wicks", "Wicks", "Bigger sizes, if the vessel run calls for them. What, and when"),
      step("sh-closures", "Closure materials", "For the first-run vessels. What, and when"),
      step("sh-boxes", "Boxes and packaging", "Boxes, padding, and packaging pieces. What, and when"),
    ],
  });
}

export const BUSINESS_SETUP_NOTES = [
  "Blocked: the Maryland LLC filing is $100, not in the budget yet. Legal and tax waits on this.",
  "A free way to start, to check before relying on it: sell as a sole proprietor under your own name (no state filing), get a free EIN from the IRS, and register for Maryland sales tax (free). Form the LLC once there is revenue. A Maryland LLC also owes a $300 annual report every year.",
].join("\n");

export const BOOKKEEPING_NOTES =
  "Bookkeeping lives on Peculiar Floor (the owner backend): its Ledger already sorts every cost into Schedule C categories and holds the tax reserve. Finishing it means every purchase so far is on the Ledger with a receipt, and a monthly close is set. A business bank account comes with Business setup; switch \"Paid with\" to it then.";

export function bookkeepingSteps(): TaskStep[] {
  return [
    step("c14", "Bookkeeping", "Peculiar Floor's Ledger, or something else"),
    step("c15", "Expense categories", "Schedule C list on the Ledger. Keep it, or note changes"),
    step("c16", "Tax reserve", "Share of each sale set aside, set on the Ledger"),
    step("c17", "Receipts logged", "Every purchase so far on the Ledger, amounts checked against receipts"),
    step("c18", "Monthly close", "The day each month the books get closed"),
  ];
}

/**
 * Jobs that used to be several tasks, each now one task whose fields are its parts.
 * Step ids are the ids of the tasks they replaced, so saved progress carries over.
 */
export function combinedTasks(): Task[] {
  return [
    t("co-setup", "Business setup", "company", "BLOCKED", "NOW", "Legal", {
      notes: BUSINESS_SETUP_NOTES,
      launchArea: "Admin",
      steps: [
        step("c1", "LLC", "Filed with Maryland, and when"),
        step("c6", "EIN", "Number on file"),
        step("c7", "Business checking", "Bank, and when it opened"),
      ],
    }),
    t("co-name", "Name check", "company", "IN PROGRESS", "NEXT", "Legal", {
      notes: "Peculiar Pumpkin sells Halloween candles and soaps under a similar name. Check USPTO before spending on labels.",
      steps: [
        step("c3", "Domain", "Owned"),
        step("c4", "Instagram", "Handle secured"),
        step("c5", "Trademark search", "Free USPTO search in Class 4 first. Filing ($350) can wait"),
      ],
    }),
    t("co-legal", "Legal and tax", "company", "NOT STARTED", "NEXT", "Legal", {
      dependencies: "co-setup",
      launchArea: "Admin",
      steps: [
        step("c10", "Maryland sales tax", "Registered, and the account number"),
        step("c11", "Home-business rules", "What the county requires"),
      ],
    }),
    t("co-insurance", "Insurance", "company", "WAITING", "NEXT", "Insurance", {
      notes: "Optional: not counted. Worth a quote before the first sale.",
      optional: true,
      launchArea: "Admin",
      steps: [
        step("c12", "Product liability", "Carrier and yearly cost"),
        step("c13", "General coverage", "Needed or not"),
        step("s16", "Covers the product", "Policy matches the candles as made and sold"),
      ],
    }),
    t("co-books", "Bookkeeping", "company", "NOT STARTED", "NOW", "Finance", {
      notes: BOOKKEEPING_NOTES,
      steps: bookkeepingSteps(),
    }),

    t("sa-docs", "Safety documents", "product-lab", "NOT STARTED", "NEXT", "Safety", {
      launchArea: "Safety",
      steps: [
        step("s1", "Safety standards", "Which candle fire-safety standards apply"),
        step("s2", "SDS and IFRA", "On file for every oil and the wax"),
      ],
    }),
    t("sa-burn", "Burn-test setup", "product-lab", "IN PROGRESS", "NEXT", "Safety", {
      notes: "Working record is the Tests page. Pass/fail criteria are still open.",
      launchArea: "Safety",
      steps: [
        step("s3", "Burn-test template", "Where the record lives"),
        step("s5", "Test records", "Wax, wick, and fragrance records"),
        step("s6", "Pass/fail rules", "What a passing burn looks like"),
      ],
    }),
    t("sa-release", "QC and release", "product-lab", "NOT STARTED", "NEXT", "Safety", {
      steps: [
        step("s9", "Batch codes", "The format"),
        step("s10", "QC checklist", "What every candle is checked for"),
        step("s11", "Release checklist", "What clears a batch for sale"),
      ],
    }),

    t("br-logo", "Logo", "brand", "NOT STARTED", "NEXT", "Logo", {
      notes: "Refine the existing mark. Do not start over.",
      steps: [
        step("b1", "Primary logo", "Refined mark"),
        step("b2", "Wordmark", "Simplified version"),
        step("b3", "Small icon", "For tiny sizes"),
      ],
    }),
    t("br-system", "Brand system", "brand", "PLANNING", "NEXT", "Color", {
      notes: "Direction is muted sage, cream, deep forest, olive, and earth. Tokens are not locked.\nExpressive serif for display. Clean sans for utility.",
      steps: [
        step("b5", "Colors", "Locked color tokens"),
        step("b6", "Typography", "Display and utility fonts"),
        step("b7", "Scent numbers", "How 01–06 appear"),
      ],
    }),
    t("br-labels", "Labels", "brand", "NOT STARTED", "NEXT", "Labels", {
      launchArea: "Safety",
      steps: [
        step("b8", "Front label", "Design"),
        step("b9", "Bottom / safety label", "Design, with the fire-safety warning"),
        step("b10", "Reclaimed identifier", "How a reclaimed vessel is marked"),
        step("b11", "Recycled label", "Recycled collection label"),
      ],
    }),
    t("b17", "Create photo styling guide", "brand", "NOT STARTED", "NEXT", "Photography"),

    t("cm-costs", "Real costs", "commerce", "NOT STARTED", "NEXT", "Pricing", {
      notes: "One field per cost line. The Costs page holds the per-size numbers. Opens once wicks, closures, and boxes are settled.",
      dependencies: `${SHOPPING_ID}, pl-wicks, pl-closures, cm-boxes`,
      steps: [
        step("m2", "Wax", "Cost per ounce, landed"),
        step("m3", "Fragrance", "Cost per ounce of oil"),
        step("m4", "Wick", "Per candle"),
        step("m5", "Vessel", "Per jar, landed"),
        step("m6", "Reclaimed prep labor", "Cleaning and prep per jar"),
        step("m7", "Closure", "Per candle"),
        step("m8", "Label", "Per candle"),
        step("m9", "Packaging", "Per order"),
        step("m10", "Shipping materials", "Per order"),
        step("m11", "Payment fees", "Per sale"),
        step("m12", "Founder labor rate", "Per hour"),
        step("m1", "Costs page updated", "Estimates replaced with these numbers"),
      ],
    }),
    t("cm-pricing", "Pricing", "commerce", "NOT STARTED", "NEXT", "Pricing", {
      dependencies: "cm-costs",
      launchArea: "Product",
      steps: [
        step("m14", "True cost by size", "Regular and Large"),
        step("m16", "Margin by size", "Regular and Large"),
        step("m15", "Retail price by size", "Regular and Large"),
      ],
    }),
    t("cm-budget", "Budget", "commerce", "NOT STARTED", "NEXT", "Budget", {
      launchArea: "Inventory",
      steps: [
        step("c9", "Bootstrap budget", "Total you'll put in"),
        step("m20", "Startup budget", "Split by category"),
        step("m21", "Launch inventory budget", "For the first batch"),
      ],
    }),
    t("cm-store", "Storefront", "commerce", "NOT STARTED", "NOW", "Storefront", {
      due: "2026-10-20",
      notes: "The customer storefront is a separate site. Track it here. Do not build it inside the command center.",
      launchArea: "Storefront",
      steps: [
        step("sf1", "Prototype", "First working version"),
        step("sf2", "Homepage", "Built"),
        step("sf3", "Collections", "Reclaimed and Recycled"),
        step("sf4", "Scent pages", "Library and one page per scent"),
        step("sf5", "Reclaimed builder", "Size, scent, Clear / Color / Surprise Me"),
        step("sf7", "About, care, FAQ", "Built"),
        step("sf9", "Cart and mobile", "Works on a phone"),
        step("sf11", "Analytics and policies", "In place"),
        step("sf12", "Checkout", "Stripe, Shopify Starter, or another"),
      ],
    }),
    t("cm-waitlist", "Waitlist", "launch", "NOT STARTED", "NEXT", "Readiness", {
      dependencies: "*",
      launchArea: "Content",
      steps: [
        step("sf10", "Signup form", "On the storefront"),
        step("n9", "Signup copy", "What the signup says"),
        step("l10", "Live", "Open and collecting emails"),
      ],
    }),
    shoppingTask(),
    t("cm-boxes", BOXES_TITLE, "commerce", "NOT STARTED", "NEXT", "Packaging", {
      relatedSupplier: "sup-pack",
      dependencies: FIRST_RUN,
      partOf: SHOPPING_ID,
      launchArea: "Packaging",
      steps: [
        step("k1", "One-candle box", "Size and source"),
        step("k2", "Multi-candle box", "Size and source"),
        step("k4", "Padding and inserts", "What goes in the box"),
        step("k3", "Odd-shape protection", "How reclaimed shapes ride safely"),
        step("k5", "Drop test", "Result"),
        step("k6", "Packed weights", "Weight and dimensions per box"),
        step("b12", "Closure look", "Cork and beeswax treatment"),
        step("b13", "Care card", "Candle-care instructions, designed"),
      ],
    }),
    t("cm-shipping", "Shipping policy", "commerce", "NOT STARTED", "NEXT", "Packaging", {
      relatedSupplier: "sup-ship",
      steps: [
        step("k7", "Carrier", "And typical cost by zone"),
        step("k8", "Who pays shipping", "Flat rate, free over a threshold, or other"),
        step("k9", "Hot weather", "What changes in summer"),
        step("k10", "Damaged orders", "What happens when one breaks"),
      ],
    }),

    t("la-content", "Photos and content", "launch", "NOT STARTED", "NEXT", "Content", {
      dependencies: "*",
      launchArea: "Content",
      steps: [
        step("n1", "Vessel photos", "Current reclaimed stock"),
        step("n2", "Before and afters", "Transformations"),
        step("n10", "Product photos", "Finished candles"),
        step("n5", "Circularity explainer", "Post or page"),
        step("n6", "Process posts", "Hands-only, no face"),
      ],
    }),
    t("la-interviews", "Customer interviews", "launch", "NOT STARTED", "NEXT", "Validation", {
      notes: "One round of interviews. Each field is a question to ask, answered with what people said.",
      relatedExperiment: "exp-mystery",
      dependencies: "*",
      launchArea: "Customer Validation",
      steps: [
        step("v1", "Interviews done", "Who, and how many"),
        step("v2", "Price", "Reaction to Regular and Large prices"),
        step("v3", "Mystery vessel", "Do they want it"),
        step("v4", "Clear / Color / Surprise Me", "Enough choice or not"),
        step("v6", "Scent concepts", "Which names and stories land"),
        step("v7", "Buying scent online", "Would they, without smelling it"),
        step("v8", "Gifting", "Would they give one"),
        step("v9", "Sustainability", "Reason to buy, or reason to feel good"),
        step("v11", "Objections", "And how the copy changes"),
      ],
    }),
    t("la-batch", "Launch batch", "launch", "NOT STARTED", "LATER", "Readiness", {
      dependencies: "*",
      launchArea: "Inventory",
      steps: [
        step("l7", "First sellable candles", "Poured, cured, and QC'd"),
        step("l8", "Test and photo units", "Made"),
        step("l9", "Replacement reserve", "How many held back"),
      ],
    }),
    t("la-golive", "Go live", "launch", "NOT STARTED", "LATER", "Readiness", {
      dependencies: GO_LIVE_DEPENDENCIES,
      notes: "The last step. Opens once every other launch task is done.",
      launchArea: "Storefront",
      steps: [
        step("l11", "Launch date", "The date"),
        step("l12", "Checkout tested", "Checkout, shipping, and emails"),
        step("l13", "Customer policies", "Returns, shipping, care"),
        step("l14", "Launch open", "Date it opened"),
      ],
    }),
  ];
}

/** Tasks kept for later: out of every count and active list until brought back. */
function afterLaunchTasks(): Task[] {
  const later = { afterLaunch: true };
  return [
    t("c8", "Evaluate business credit card options", "company", "NOT STARTED", "LATER", "Finance", {
      ...later,
      notes: "Financing strategy is unresolved. Do not treat credit as startup cash.",
    }),
    t("b4", "Create maker’s mark", "brand", "NOT STARTED", "LATER", "Logo", later),
    t("b14", "Design thank-you insert", "brand", "NOT STARTED", "LATER", "Packaging", later),
    t("b15", "Design packaging sticker and tape system", "brand", "NOT STARTED", "LATER", "Packaging", later),
    t("b16", "Design shipping box treatment", "brand", "NOT STARTED", "LATER", "Packaging", later),
    t("b18", "Create social templates", "brand", "NOT STARTED", "LATER", "Photography", later),
    t("b19", "Create market and pop-up signage", "brand", "NOT STARTED", "LATER", "Photography", later),
    t("b20", "Create return-program card", "brand", "NOT STARTED", "LATER", "Packaging", later),
    t("m17", "Calculate average order value targets", "commerce", "NOT STARTED", "LATER", "Pricing", later),
    t("m18", "Calculate monthly fixed costs", "commerce", "NOT STARTED", "LATER", "Pricing", later),
    t("m19", "Calculate break-even units and orders", "commerce", "NOT STARTED", "LATER", "Pricing", later),
    t("m22", "Determine working-capital reserve", "commerce", "NOT STARTED", "LATER", "Budget", later),
    t("m23", "Decide how much credit is safe to use", "commerce", "NOT STARTED", "LATER", "Budget", later),
    t("sf6", "Build the “what might arrive” gallery", "commerce", "NOT STARTED", "LATER", "Storefront", later),
    t("sf8", "Build return-program framework", "commerce", "NOT STARTED", "LATER", "Storefront", later),
    t("n3", "Film sourcing, cleaning, scent work, and pours", "launch", "NOT STARTED", "LATER", "Content", later),
    t("n4", "Film curing, QC, and mystery reveals", "launch", "NOT STARTED", "LATER", "Content", later),
    t("n7", "Build launch content bank", "launch", "NOT STARTED", "LATER", "Content", later),
    t("n8", "Create launch-week posting schedule", "launch", "NOT STARTED", "LATER", "Content", later),
    t("v5", "Test reaction to the vessel gallery", "launch", "NOT STARTED", "LATER", "Validation", later),
    t("v10", "Test return-credit interest", "launch", "NOT STARTED", "LATER", "Validation", later),
    t("l15", "Hold the post-launch review", "launch", "NOT STARTED", "LATER", "Readiness", later),
  ];
}

export const AFTER_LAUNCH_IDS = afterLaunchTasks().map((task) => task.id);

/** Old tasks dropped: duplicates of other work, or work that can't start until there are sales. */
export const CUT_TASK_IDS = ["c2", "s4", "s7", "s8", "s12", "s13", "s14", "s15", "m13", "l1", "l2", "l3", "l4", "l5", "l6"];

/** A cut duplicate whose progress belongs on another task's field: [task id, step id]. */
export const CUT_TASK_ALIASES: Record<string, [string, string]> = {
  c2: ["co-name", "c5"],
  s7: ["pl-wax", "p6"],
  s8: ["pl-wax", "p6"],
  s12: ["br-labels", "b9"],
  s13: ["br-pack", "b13"],
  l6: ["cm-pricing", "m15"],
};

function tasks(): Task[] {
  const combined = combinedTasks();
  const company = combined.filter((task) => task.workstream === "company");
  const rest = combined.filter((task) => task.workstream !== "company");
  return [
    ...company,
    ...productLabTracks(),
    ...rest,
    t("r1", "File new evidence into the discovery worksheet", "research", "NOT STARTED", "NEXT", "Notes", {
      relatedDocument: "doc-discovery",
    }),
    ...afterLaunchTasks(),
  ];
}

function decisions(): Decision[] {
  const d = (
    id: string,
    date: string,
    decision: string,
    category: string,
    status: Decision["status"],
    reason: string,
    evidence: string,
    revisitWhen: string,
    workstreams: Workstream[],
  ): Decision => ({ id, date, decision, category, status, reason, evidence, revisitWhen, workstreams });

  return [
    d("d1", "2026-06-02", "Peculiar will have both Reclaimed and Recycled collections.", "Product", "DECIDED", "Reclaimed carries the story. Recycled gives predictable inventory, simpler testing, and a reliable gift.", "Working business model.", "If reclaimed supply cannot support a launch.", ["product-lab", "commerce"]),
    d("d2", "2026-06-02", "Reclaimed customers choose size, scent, and vessel preference — not the exact vessel.", "Vessel", "DECIDED", "Peculiar chooses the vessel. The variation is the product.", "Buying-flow decision in the discovery worksheet.", "If customer tests reject the mystery.", ["commerce", "product-lab"]),
    d("d3", "2026-06-08", "Vessel preferences are Clear, Color, or Surprise Me.", "Vessel", "WORKING ASSUMPTION", "Three choices may be enough without turning the shop into a vessel catalog.", "Internal preference model. Not yet tested with customers.", "After the mystery-vessel customer test.", ["commerce", "launch"]),
    d("d4", "2026-06-08", "Working sizes are Small 8–10 oz, Medium 12–16 oz, and Large 17–20 oz.", "Product", "WORKING ASSUMPTION", "Bands leave room for reclaimed variation while staying shoppable.", "Current vessel stock, not a finished spec.", "After inventory is measured.", ["product-lab", "commerce"]),
    d("d5", "2026-06-12", "Reclaimed vessels are also classified internally by diameter and profile.", "Vessel", "DECIDED", "Safe, repeatable wicking cannot follow the shopper’s size label alone.", "Wick behavior depends on diameter more than ounce weight.", "If testing shows fewer profiles are manageable.", ["product-lab"]),
    d("d6", "2026-07-01", "Soy-coconut, or a soy-dominant coconut blend, is the leading wax.", "Wax", "WORKING ASSUMPTION", "Plant-based positioning, a creamier look, and a better chance of fragrance performance.", "Direction only. Candidates are not yet compared.", "After side-by-side wax tests.", ["product-lab"]),
    d("d7", "2026-07-01", "Launch wax will likely be undyed.", "Wax", "WORKING ASSUMPTION", "Fewer variables, lower cost, and the glass already supplies the color.", "Cost and testing plan.", "If an undyed pour looks unfinished in the vessel.", ["product-lab", "brand"]),
    d("d8", "2026-07-04", "Essential-oil-only is no longer required.", "Fragrance", "DECIDED", "Hot throw and consistency matter more than an oil-only rule. Essential oils stay where they improve a blend.", "Fragrance direction review.", "If a specific claim later requires a narrower palette.", ["product-lab"]),
    d("d9", "2026-07-04", "About five permanent signature scents are planned.", "Fragrance", "WORKING ASSUMPTION", "Enough range to feel like a house, few enough to test properly.", "Scent architecture.", "If development cannot support five at launch.", ["product-lab", "brand"]),
    d("d10", "2026-07-04", "A sixth experimental or seasonal scent may rotate.", "Fragrance", "WORKING ASSUMPTION", "Keeps a slot for the lab without forcing it into the permanent line.", "Scent architecture.", "Before launch, decide if 06 ships or waits.", ["product-lab"]),
    d("d11", "2026-07-15", "The working fragrance load is about 6% by wax weight.", "Fragrance", "WORKING ASSUMPTION", "A single starting point so tests are comparable. Example: 10 oz wax × 6% = 0.6 oz fragrance.", "Planning ratio only.", "Each finished scent sets its own load.", ["product-lab"]),
    d("d12", "2026-05-20", "Sustainability claims must be specific, not vague.", "Brand", "DECIDED", "The product has to be desirable before the circular story is explained.", "Brand purpose.", "Any time copy drifts into general green language.", ["brand", "commerce"]),
    d("d13", "2026-05-20", "Reclaimed vessel variation is a feature, not a defect.", "Vessel", "DECIDED", "The draw is that Peculiar chooses the object.", "Three months of sourcing and repouring.", "If variation breaks wicking or shipping.", ["product-lab", "brand"]),
    d("d14", "2026-08-01", "Cork plus a beeswax detail is the leading closure.", "Closure", "WORKING ASSUMPTION", "Fits the material palette. Not yet proven in heat or transit.", "Concept preference.", "After the closure prototype and a shipping test.", ["product-lab", "brand"]),
    d("d15", "2026-05-18", "Desirability leads. Sustainability supports it.", "Brand", "DECIDED", "The buyer is paying for scent, object, and story — not the cheapest candle.", "Customer hypothesis.", "If interviews show the opposite.", ["brand", "launch"]),
    d("d16", "2026-06-20", "Batch production is preferred over one-off pours.", "Production", "DECIDED", "Cure, QC, inventory release, and traceability need batches.", "Production model.", "If a custom line is added later.", ["product-lab"]),
    d("d17", "2026-08-12", "A local vessel-return pilot comes before national reverse logistics.", "Circularity", "DECIDED", "The return credit has to be proven nearby before it becomes a system.", "Circular model.", "After the local pilot has real numbers.", ["commerce", "launch"]),
    d("d18", "2026-08-20", "Price bands are Small $34–40, Medium $42–50, Large $52–64.", "Pricing", "WORKING ASSUMPTION", "A planning range, not a price. Contribution target is about $20–25.", "Hypothesis only. Costs are still estimates.", "After real costs and customer price tests.", ["commerce"]),
    d("d19", "2026-08-20", "Aesthetic returns apply only while a candle is unused and unburned.", "Policy", "WORKING ASSUMPTION", "A burned or used candle cannot come back as a clean vessel credit.", "Return concept. The window is not set.", "When the return policy is written.", ["commerce"]),
    d("d20", "2026-04-01", "Channels are the owned storefront, TikTok, Instagram, and selected local markets.", "Channel", "DECIDED", "Direct first. Wholesale is out of scope for this version.", "Channel decision.", "If a museum or shop account appears before launch.", ["launch", "commerce"]),
  ];
}

function experiments(): Experiment[] {
  return [
    {
      id: "exp-wax",
      name: "Soy-coconut wax test",
      hypothesis: "A soy-coconut or soy-dominant coconut wax will give a creamier pour and a stronger throw than a straight soy at the same load.",
      method: "Order small lots of two or three candidate waxes. Pour the same vessel profile, wick, and 6% load. Compare finish, cold throw, hot throw, and cure.",
      materials: "Candidate waxes not yet ordered. No fragrance locked.",
      startDate: "",
      result: "",
      cost: "",
      nextAction: "Choose the candidates and place the sample order.",
      status: "PLANNING",
      workstream: "product-lab",
      photoNote: "",
    },
    {
      id: "exp-scent",
      name: "Scent 01 development",
      hypothesis: "The bright / fresh slot can feel like sun-warmed linen in an old apartment without collapsing into a generic clean scent.",
      method: "Write the brief first. Then sample materials against cold and hot throw, not against the name.",
      materials: "No samples ordered.",
      startDate: "",
      result: "",
      cost: "",
      nextAction: "Lock the five roles, then write the 01 brief.",
      status: "NOT STARTED",
      workstream: "product-lab",
      photoNote: "",
    },
    {
      id: "exp-vessel",
      name: "Reclaimed vessel profile system",
      hypothesis: "A short list of diameter profiles — narrow, standard, wide inside each size band — is enough to wick safely without a unique wick per jar.",
      method: "Measure current stock. Record fill, diameter, and profile. Reject anything that cannot take a repeatable wick.",
      materials: "Vessels already sourced and repoured over roughly three months.",
      startDate: "2026-07-01",
      result: "Sourcing is real. Classification is not finished.",
      cost: "",
      nextAction: "Measure and tag the current inventory.",
      status: "IN PROGRESS",
      workstream: "product-lab",
      photoNote: "",
    },
    {
      id: "exp-cork",
      name: "Cork and beeswax closure",
      hypothesis: "A cork closure with a beeswax detail can survive packing and a warm shipment without becoming costume.",
      method: "Prototype on one small and one medium vessel. Then a drop test and a heat check.",
      materials: "Cork and beeswax not yet in hand as a finished closure.",
      startDate: "",
      result: "",
      cost: "",
      nextAction: "Make the first physical prototype.",
      status: "PLANNING",
      workstream: "product-lab",
      photoNote: "",
    },
    {
      id: "exp-mystery",
      name: "Mystery vessel customer test",
      hypothesis: "Design-conscious buyers will accept Clear, Color, or Surprise Me if the gallery shows the quality of what might arrive.",
      method: "Show the preference and a vessel gallery to target customers. Record whether they want more control, and what they would pay.",
      materials: "No interview guide yet.",
      startDate: "",
      result: "",
      cost: "",
      nextAction: "Draft five interview questions and a vessel gallery.",
      status: "NOT STARTED",
      workstream: "launch",
      photoNote: "",
    },
  ];
}

/** The six signature scents. Formulas are untested starting blends from the Candle Lab sheet. */
export function scents(): Scent[] {
  const base = {
    inspiration: "",
    supplier: "CandleScience",
    load: "8%",
    coldThrow: "",
    hotThrow: "",
    approved: false,
    costPerCandle: "About $2.55 Regular, $3.43 Large (oil at $3.70/oz, 8% load)",
  };
  return [
    {
      ...base,
      slot: "01",
      workingName: "Off the Record",
      role: "Cozy / warm / elevated",
      mood: "Behind an unmarked door, the night is just getting started. Worn leather, juniper and cracked peppercorn, softened by cashmere and warm amber. What's said here stays here.",
      keyNotes: "Leather · Juniper · Cashmere",
      materials: "Speakeasy (3 × 1 oz), Cashmere Musk (2 × 1 oz)",
      formula: "60% Speakeasy, 40% Cashmere Musk (6 g + 4 g per 10 g trial)",
      notes: "Expected: botanical leather softened by amber, musk and a powdery finish. If too leathery, test 50/50. Was Cashmere Woods.",
    },
    {
      ...base,
      slot: "02",
      workingName: "Art Class Soap",
      role: "Fresh / aquatic / nostalgic",
      mood: "That soap at the art room sink. Honeydew and pear with clean linen and a breath of sea salt, like washing the paint off your hands before the bell rings.",
      keyNotes: "Melon · Linen · Sea salt",
      materials: "Honeydew Melon (2 × 1 oz), Fresh Linen Odor Eliminator (2 × 1 oz), Sel de Mer (1 oz), Orchard Pear (1 oz)",
      formula: "40% Honeydew Melon, 30% Fresh Linen Odor Eliminator, 20% Sel de Mer, 10% Orchard Pear (4 / 3 / 2 / 1 g)",
      notes: "Expected: melon-and-pear soap, clean linen and mineral air. Honeydew Melon and Orchard Pear are CleanScents without the + badge, the agreed exception.",
    },
    {
      ...base,
      slot: "03",
      workingName: "Legend Has It",
      role: "Grounded / outdoorsy",
      mood: "Deep in the redwoods, where the old stories began. Damp moss, cedar and forest floor, with the last embers of a fire still telling tall tales.",
      keyNotes: "Redwood · Moss · Ember",
      materials: "Redwoods and Moss (4 oz), Bonfire Embers (2 × 1 oz)",
      formula: "75% Redwoods and Moss, 25% Bonfire Embers (7.5 g + 2.5 g)",
      notes: "Expected: damp forest, cedar and moss with a restrained campfire finish. If too smoky, test 85/15. Was Woodsy / Earth.",
    },
    {
      ...base,
      slot: "04",
      workingName: "Haute Vanilla",
      role: "Familiar but peculiar",
      mood: "Vanilla, dressed up. Rich vanilla bean over warm white oak with a creamy, never-too-sweet finish. The expensive upgrade to your everyday vanilla.",
      keyNotes: "Vanilla · White oak · Cream",
      materials: "White Oak and Vanilla (4 oz), Very Vanilla (2 × 1 oz)",
      formula: "75% White Oak and Vanilla, 25% Very Vanilla (7.5 g + 2.5 g)",
      notes: "Expected: warm oak and vanilla with a restrained creamy sweetness. Very Vanilla's cake notes need a light hand. Was Bespoke Vanilla.",
    },
    {
      ...base,
      slot: "05",
      workingName: "Streetlights On",
      role: "Nostalgic / abstract / emotional",
      mood: "Running home as the streetlights flicker on, cheeks cold from the open air. Lavender and cedar with a soft powder finish, like clean pajamas at the end of a perfect day.",
      keyNotes: "Mountain air · Lavender · Powder",
      materials: "Serene Summit (4 oz + 1 oz), Baby Powder (1 oz)",
      formula: "85% Serene Summit, 15% Baby Powder (8.5 g + 1.5 g)",
      notes: "Expected: fresh outdoor air, lavender and cedar with a soft powder finish. Was Childhood Memories.",
    },
    {
      ...base,
      slot: "06",
      workingName: "Butterfly Conservatory",
      role: "Luxury floral",
      mood: "Behind the glass, everything is in bloom. Peony and magnolia open over crisp apple and bamboo, warmed by a touch of soft amber.",
      keyNotes: "Peony · Magnolia · Green apple",
      materials: "Azura (4 oz), Magnolia and Peony (2 × 1 oz)",
      formula: "75% Azura, 25% Magnolia and Peony (7.5 g + 2.5 g)",
      notes: "Expected: fresh apple and bamboo opening, a fuller spring floral heart and soft amber. Compare with Azura alone. Was Luxury Floral.",
    },
  ];
}

function vessels(): Vessel[] {
  const row = (
    id: string,
    vesselId: string,
    sizeClass: Vessel["sizeClass"],
    diameter: string,
    profile: string,
    color: string,
    pigment: Vessel["pigment"],
    acceptance: Vessel["acceptance"],
    notes: string,
  ): Vessel => ({
    id,
    vesselId,
    sizeClass,
    diameter,
    profile,
    color,
    pigment,
    source: "Reclaimed — example row",
    cost: "",
    condition: "Used, needs measuring",
    acceptance,
    wick: "",
    testStatus: acceptance === "Needs Testing" ? "Unmeasured" : acceptance,
    notes,
  });
  return [
    row("vs1", "R-014", "Regular", "", "S-Standard", "Clear", "Clear", "Needs Testing", "Replace with a measured jar. This row is a placeholder."),
    row("vs2", "R-018", "Regular", "", "S-Wide", "Amber", "Color", "Needs Testing", "Placeholder until diameter is recorded."),
    row("vs3", "R-022", "Large", "", "M-Narrow", "Pale green", "Color", "Needs Testing", "Placeholder."),
    row("vs4", "R-027", "Large", "", "M-Standard", "Clear", "Clear", "Accepted", "Example of an accepted profile. Confirm before relying on it."),
    row("vs5", "R-031", "Large", "", "M-Wide", "Smoke", "Color", "Needs Testing", "Placeholder."),
    row("vs6", "R-040", "Large", "", "L-Standard", "Clear", "Clear", "Needs Testing", "Placeholder."),
    row("vs7", "R-044", "Large", "", "L-Wide", "Olive", "Color", "Rejected", "Example rejection: too wide for a stable wick. Confirm with a real measurement."),
  ];
}

function tests(): BurnTest[] {
  return [
    {
      id: "bt1",
      testId: "BT-001",
      batch: "",
      vesselProfile: "",
      vesselDimensions: "",
      wax: "",
      wick: "",
      scent: "",
      fragranceLoad: "6%",
      pourDate: "",
      testDate: "",
      cureDays: "",
      flame: "",
      meltPool: "",
      soot: "",
      mushrooming: "",
      glass: "",
      hotThrow: "",
      endResult: "",
      passFail: "UNTESTED",
      notes: "Blank record so the burn sheet exists before the first pour. Do not treat this as a result.",
      photoNote: "",
    },
  ];
}

function suppliers(): Supplier[] {
  const s = (
    id: string,
    category: Supplier["category"],
    name: string,
    product: string,
    notes: string,
  ): Supplier => ({
    id,
    category,
    name,
    product,
    website: "",
    sampleOrdered: false,
    approved: false,
    moq: "",
    unitCost: "",
    shipping: "",
    landedCost: "",
    leadTime: "",
    safetyDocs: "Not on file",
    notes,
    backup: "",
  });
  return [
    s("sup-wax", "Wax", "Unchosen", "Soy-coconut container wax", "Name the candidates when the sample order is placed."),
    s("sup-frag", "Fragrance", "Unchosen", "Candle fragrance materials", "Pick suppliers from the scent briefs, not from a generic catalog."),
    s("sup-wick", "Wicks", "Unchosen", "Wick sampler", "Families still need to be chosen before the order."),
    s("sup-glass", "Recycled Glass", "Unchosen", "Wholesale recycled-glass vessels", "Needed for the standardized Recycled line."),
    s("sup-cork", "Closures", "Unchosen", "Cork and beeswax detail", "Prototype before approving a supplier."),
    s("sup-label", "Labels", "Unchosen", "Front and safety labels", "Depends on the label design."),
    s("sup-pack", "Packaging", "Unchosen", "One-candle and multi-candle mailers", "Must protect uneven reclaimed glass."),
    s("sup-ship", "Shipping", "Unchosen", "Parcel carrier", "Compare zones after packed weight is known."),
  ];
}

/**
 * Regular is the 10 oz recycled jar (about 8.6 oz of wax); Large is the 13.5 oz (about 11.6 oz).
 * Wax, fragrance, and vessel come from the October orders. Everything else is still an estimate.
 */
export function economics(): SizeModel[] {
  const actual = (amount: number): MoneyCell => ({ amount, source: "ACTUAL" });
  const regular = model("Regular", "8–12 oz", 32, {
    wax: 0,
    fragrance: 0,
    wick: 0.22,
    vessel: 0,
    prepLabor: 2.8,
    closure: 1.1,
    labels: 0.55,
    packaging: 1.6,
    paymentFees: 1.45,
    shippingMaterials: 0.7,
    defectAllowance: 0.45,
    labor: 1.13,
  });
  const large = model("Large", "13–16 oz", 38, {
    wax: 0,
    fragrance: 0,
    wick: 0.3,
    vessel: 0,
    prepLabor: 3.5,
    closure: 1.2,
    labels: 0.7,
    packaging: 2.4,
    paymentFees: 1.9,
    shippingMaterials: 1,
    defectAllowance: 0.8,
    labor: 2.2,
  });
  regular.lines.wax = actual(1.77);
  regular.lines.fragrance = actual(2.55);
  regular.lines.vessel = actual(3.4);
  large.lines.wax = actual(2.39);
  large.lines.fragrance = actual(3.43);
  large.lines.vessel = actual(3.57);
  return [regular, large];
}

function budget(): BudgetLine[] {
  const line = (id: string, label: string, estimated: number, workstreams: Workstream[]): BudgetLine => ({
    id,
    label,
    estimated,
    actual: 0,
    paid: 0,
    workstreams,
  });
  return [
    line("bud-form", "Formation", 275, ["company"]),
    line("bud-ins", "Insurance", 900, ["company"]),
    line("bud-equip", "Equipment", 350, ["product-lab"]),
    line("bud-wax", "Wax", 180, ["product-lab"]),
    line("bud-frag", "Fragrance", 320, ["product-lab"]),
    line("bud-wick", "Wicks", 60, ["product-lab"]),
    line("bud-vessel", "Vessels", 150, ["product-lab"]),
    line("bud-label", "Labels", 120, ["brand"]),
    line("bud-pack", "Packaging", 200, ["commerce", "launch"]),
    line("bud-web", "Website", 0, ["commerce"]),
    line("bud-photo", "Photography", 250, ["brand", "launch"]),
    line("bud-market", "Market fees", 100, ["launch"]),
    line("bud-cont", "Contingency", 500, ["company", "commerce"]),
  ];
}

export function skus(): LaunchSku[] {
  const sku = (id: string, scent: string, size: LaunchSku["size"], planned: number): LaunchSku => ({
    id,
    scent,
    size,
    planned,
    poured: 0,
    curing: 0,
    ready: 0,
    sold: 0,
  });
  // Batch 01: 38 jars. Each scent gets three Regular and three Large; Streetlights On gets a fourth Large.
  // One more Regular goes to Haute Vanilla, Legend Has It, or Butterfly Conservatory once that's decided.
  const names = ["01 Off the Record", "02 Art Class Soap", "03 Legend Has It", "04 Haute Vanilla", "05 Streetlights On", "06 Butterfly Conservatory"];
  return names.flatMap((name, at) => [
    sku(`sku${at * 2 + 1}`, name, "Regular", 3),
    sku(`sku${at * 2 + 2}`, name, "Large", name.startsWith("05") ? 4 : 3),
  ]);
}

function content(): ContentItem[] {
  const c = (
    id: string,
    title: string,
    pillar: ContentItem["pillar"],
    platform: string,
    footage: string,
  ): ContentItem => ({
    id,
    title,
    pillar,
    platform,
    status: "NOT STARTED",
    footage,
    caption: "",
    publishDate: "",
    result: "",
  });
  return [
    c("ct1", "Where this jar came from", "Vessel Sourcing", "TikTok", "Sourcing walk, hands, the find"),
    c("ct2", "Same wax, different past", "Before / After", "Instagram", "Before and after stills"),
    c("ct3", "Brief for scent 01", "Scent Lab", "Instagram", "Notes, blotters, the room"),
    c("ct4", "First compared pour", "Pour Process", "TikTok", "Two waxes, one profile"),
    c("ct5", "What a burn test is actually looking at", "Testing / QC", "Instagram", "Flame, melt pool, notes"),
    c("ct6", "Clear, color, or surprise", "Mystery Vessel Reveals", "TikTok", "Three vessels, one choice"),
    c("ct7", "What we mean by circular", "Circularity", "Instagram", "A specific vessel, not a slogan"),
    c("ct8", "Filing the company on a weekday", "Founder Journey", "TikTok", "The admin, kept short"),
    c("ct9", "Linen, glass, cork", "Styling", "Instagram", "Table styling, no props that fight the object"),
    c("ct10", "Leave room for the first unboxing", "Customer Unboxings", "Instagram", "Nothing to film until someone receives one"),
  ];
}

function questions(): ResearchQuestion[] {
  const q = (
    id: string,
    question: string,
    category: string,
    why: string,
    evidenceNeeded: string,
    decisionAffected: string,
    workstreams: Workstream[],
    due = "",
  ): ResearchQuestion => ({
    id,
    question,
    category,
    why,
    evidenceNeeded,
    link: "",
    owner: "Founder",
    due,
    status: "NOT STARTED",
    decisionAffected,
    workstreams,
  });
  return [
    q("q1", "Which soy-coconut wax performs best?", "Wax", "The launch wax is still a direction.", "Side-by-side finish, throw, and cure notes.", "Soy-coconut is the leading wax.", ["product-lab"], "2026-10-24"),
    q("q2", "What return credit is financially viable?", "Circularity", "A credit that loses money is not a program.", "Vessel cost, prep labor, and a ceiling per return.", "Local return pilot.", ["commerce"]),
    q("q3", "How many vessel profiles are manageable?", "Vessels", "Too many profiles means too many wick tests.", "Measured inventory and a wick matrix.", "Internal profile system.", ["product-lab"]),
    q("q4", "What price feels justified to the target customer?", "Pricing", "The bands are a hypothesis.", "Interviews against Small, Medium, and Large.", "Price bands.", ["commerce", "launch"], "2026-10-31"),
    q("q5", "Is Clear / Color / Surprise Me enough control?", "Vessel", "The buying flow depends on it.", "Customer reactions, including objections.", "Vessel preference model.", ["launch"]),
    q("q6", "Is sustainability the reason they buy, or the reason they feel fine buying?", "Customer", "Copy and claims follow the answer.", "Interview notes, not a survey slogan.", "Desirability leads.", ["launch", "brand"]),
    q("q7", "Will someone buy a scent online without smelling it?", "Fragrance", "The storefront cannot assume a sniff.", "Reactions to names, descriptions, and a sample plan.", "Scent selling model.", ["commerce", "launch"]),
    q("q8", "What cure age is required before a candle can be sold?", "Safety", "Shipping an under-cured candle wastes the test work.", "Supplier guidance plus Peculiar’s own burn notes.", "Cure standard.", ["product-lab"]),
    q("q9", "Which recycled-glass supplier can hit the size bands?", "Supply", "The Recycled line needs a predictable vessel.", "Samples, MOQ, landed cost, lead time.", "Recycled collection.", ["commerce", "product-lab"]),
    q("q10", "Is a business card useful before there is revenue?", "Finance", "Credit is not a plan.", "Quotes, fees, and what the card would actually buy.", "Financing stays unresolved.", ["company"]),
    q("q11", "What is the exact unused-candle return window?", "Policy", "The principle is set. The window is not.", "A number that operations can keep.", "Aesthetic returns while unused.", ["commerce"]),
    q("q12", "Does every candle need the cork closure?", "Closure", "A closure on every unit changes cost and the gift feel.", "Prototype cost and a customer read.", "Cork and beeswax concept.", ["product-lab"]),
  ];
}

function documents(): DocLink[] {
  return [
    { id: "doc-discovery", title: "Business plan discovery worksheet", group: "Planning", detail: "Google Doc. Working assumptions live here.", url: "", workstreams: ["research", "company"] },
    { id: "doc-model", title: "Working business model", group: "Planning", detail: "Separate model from the discovery notes.", url: "", workstreams: ["commerce", "company"] },
    { id: "doc-store", title: "Storefront build instructions", group: "Commerce", detail: "Brief for the customer site. That site is not this one.", url: "", workstreams: ["commerce"] },
    { id: "doc-ins", title: "Insurance", group: "Company", detail: "Quotes and binders, when they exist.", url: "", workstreams: ["company"] },
    { id: "doc-form", title: "Formation documents", group: "Company", detail: "Articles, EIN letter, operating notes.", url: "", workstreams: ["company"] },
    { id: "doc-safe", title: "Safety documents", group: "Lab", detail: "Standards, SDS, IFRA, usage rates.", url: "", workstreams: ["product-lab"] },
    { id: "doc-sup", title: "Supplier documentation", group: "Supply", detail: "Spec sheets, MOQs, invoices.", url: "", workstreams: ["commerce", "product-lab"] },
    { id: "doc-pack", title: "Packaging specs", group: "Commerce", detail: "Box sizes, dielines, drop-test notes.", url: "", workstreams: ["commerce", "launch"] },
    { id: "doc-brand", title: "Brand assets", group: "Brand", detail: "Logo files, color, type, early board.", url: "", workstreams: ["brand"] },
  ];
}

function blockers(): Blocker[] {
  return [
    { id: "bl1", title: "Waiting on wax samples", detail: "No soy-coconut candidate has been ordered, so finish and throw cannot be compared.", resolved: false },
    { id: "bl2", title: "No insurance quote yet", detail: "Product liability is unpriced. Do not sell without it.", resolved: false },
    { id: "bl3", title: "Mystery vessel is untested with customers", detail: "Clear / Color / Surprise Me is still an assumption.", resolved: false },
    { id: "bl4", title: "No passing burn test", detail: "There is a blank test sheet and no cured candle in it.", resolved: false },
    { id: "bl5", title: "Prices rest on estimates", detail: "Every unit cost is marked estimate until a quote or invoice replaces it.", resolved: false },
  ];
}
