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
      dependencies: "pl-vessels, pl-wax, pl-fragrance",
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
      dependencies: "pl-vessels",
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

function tasks(): Task[] {
  return [
    t("c1", "Form LLC / EIN / business banking structure", "company", "NOT STARTED", "NOW", "Legal", {
      due: "2026-10-15",
      notes: "File the LLC, then EIN, then business checking. A credit card is a later decision, not part of this action.",
      launchArea: "Admin",
    }),
    t("c2", "Confirm business name availability", "company", "NOT STARTED", "NEXT", "Legal"),
    t("c3", "Confirm domain", "company", "NOT STARTED", "NEXT", "Legal"),
    t("c4", "Confirm social handles", "company", "NOT STARTED", "NEXT", "Legal"),
    t("c5", "Review trademark availability", "company", "NOT STARTED", "LATER", "Legal"),
    t("c6", "Get EIN", "company", "NOT STARTED", "NEXT", "Legal", { dependencies: "LLC filed" }),
    t("c7", "Open business checking account", "company", "NOT STARTED", "NEXT", "Finance", { dependencies: "EIN" }),
    t("c8", "Evaluate business credit card options", "company", "NOT STARTED", "LATER", "Finance", {
      notes: "Financing strategy is unresolved. Do not treat credit as startup cash.",
    }),
    t("c9", "Decide bootstrap budget", "company", "NOT STARTED", "NEXT", "Finance"),
    t("c10", "Register for Maryland sales tax", "company", "NOT STARTED", "LATER", "Legal", { launchArea: "Admin" }),
    t("c11", "Confirm local or home-business requirements", "company", "NOT STARTED", "NEXT", "Legal"),
    t("c12", "Get product liability insurance quotes", "company", "WAITING", "NEXT", "Insurance", {
      notes: "Need quotes before the first sale.",
      launchArea: "Admin",
    }),
    t("c13", "Confirm general business insurance needs", "company", "NOT STARTED", "LATER", "Insurance"),
    t("c14", "Set up bookkeeping structure", "company", "NOT STARTED", "LATER", "Finance"),
    t("c15", "Create business expense categories", "company", "NOT STARTED", "LATER", "Finance"),
    t("c16", "Create tax reserve process", "company", "NOT STARTED", "LATER", "Finance"),

    ...productLabTracks(),

    t("s1", "Gather applicable candle safety standards", "product-lab", "NOT STARTED", "NEXT", "Safety", { launchArea: "Safety" }),
    t("s2", "Gather supplier SDS, IFRA, and usage documents", "product-lab", "NOT STARTED", "NEXT", "Safety", { launchArea: "Safety" }),
    t("s3", "Build burn-test template", "product-lab", "IN PROGRESS", "NEXT", "Safety", {
      notes: "Working record is the Tests page. Pass/fail criteria are still open.",
      launchArea: "Safety",
    }),
    t("s4", "Create vessel test matrix", "product-lab", "NOT STARTED", "NEXT", "Safety"),
    t("s5", "Create wax, wick, and fragrance test records", "product-lab", "IN PROGRESS", "NEXT", "Safety"),
    t("s6", "Define pass/fail burn criteria", "product-lab", "NOT STARTED", "NEXT", "Safety", { launchArea: "Safety" }),
    t("s7", "Define minimum cure age before testing", "product-lab", "NOT STARTED", "NEXT", "Safety"),
    t("s8", "Define minimum cure age before sale", "product-lab", "NOT STARTED", "NEXT", "Safety", { launchArea: "Product" }),
    t("s9", "Create batch code system", "product-lab", "NOT STARTED", "LATER", "Safety"),
    t("s10", "Create QC checklist", "product-lab", "NOT STARTED", "LATER", "Safety"),
    t("s11", "Create finished-product release checklist", "product-lab", "NOT STARTED", "LATER", "Safety"),
    t("s12", "Design fire-safety label", "product-lab", "NOT STARTED", "NEXT", "Safety", { launchArea: "Safety" }),
    t("s13", "Write candle-care instructions", "product-lab", "NOT STARTED", "NEXT", "Safety"),
    t("s14", "Create incident and complaint log", "product-lab", "NOT STARTED", "LATER", "Safety"),
    t("s15", "Create stop-sale and recall procedure", "product-lab", "NOT STARTED", "LATER", "Safety"),
    t("s16", "Confirm insurance requirements against the product", "product-lab", "NOT STARTED", "NEXT", "Safety"),

    t("b1", "Refine primary Peculiar logo", "brand", "NOT STARTED", "NEXT", "Logo", {
      notes: "Refine the existing mark. Do not start over.",
    }),
    t("b2", "Create simplified wordmark", "brand", "NOT STARTED", "NEXT", "Logo"),
    t("b3", "Create small icon", "brand", "NOT STARTED", "NEXT", "Logo"),
    t("b4", "Create maker’s mark", "brand", "NOT STARTED", "LATER", "Logo"),
    t("b5", "Finalize brand color tokens", "brand", "PLANNING", "NEXT", "Color", {
      notes: "Direction is muted sage, cream, deep forest, olive, and earth. Tokens are not locked.",
    }),
    t("b6", "Finalize typography system", "brand", "PLANNING", "NEXT", "Typography", {
      notes: "Expressive serif for display. Clean sans for utility.",
    }),
    t("b7", "Create scent-number system", "brand", "NOT STARTED", "NEXT", "Labels"),
    t("b8", "Design front product label", "brand", "NOT STARTED", "NEXT", "Labels"),
    t("b9", "Design bottom / safety label", "brand", "NOT STARTED", "NEXT", "Labels"),
    t("b10", "Design reclaimed vessel identifier", "brand", "NOT STARTED", "NEXT", "Labels"),
    t("b11", "Design recycled collection label", "brand", "NOT STARTED", "NEXT", "Labels"),
    t("b12", "Design cork and beeswax closure treatment", "brand", "NOT STARTED", "NEXT", "Packaging"),
    t("b13", "Design candle-care card", "brand", "NOT STARTED", "LATER", "Packaging"),
    t("b14", "Design thank-you insert", "brand", "NOT STARTED", "LATER", "Packaging"),
    t("b15", "Design packaging sticker and tape system", "brand", "NOT STARTED", "LATER", "Packaging"),
    t("b16", "Design shipping box treatment", "brand", "NOT STARTED", "LATER", "Packaging"),
    t("b17", "Create photo styling guide", "brand", "NOT STARTED", "NEXT", "Photography"),
    t("b18", "Create social templates", "brand", "NOT STARTED", "LATER", "Photography"),
    t("b19", "Create market and pop-up signage", "brand", "NOT STARTED", "LATER", "Photography"),
    t("b20", "Create return-program card", "brand", "NOT STARTED", "LATER", "Packaging"),

    t("m1", "Replace estimated unit costs with supplier costs", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m2", "Calculate landed wax cost", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m3", "Calculate fragrance cost per candle", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m4", "Calculate wick cost", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m5", "Calculate vessel cost", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m6", "Calculate reclaimed cleaning and prep labor", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m7", "Calculate closure cost", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m8", "Calculate label cost", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m9", "Calculate packaging cost", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m10", "Calculate shipping-material cost", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m11", "Calculate platform and payment fees", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m12", "Assign founder labor rate", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m13", "Set defect and breakage allowance from real loss", "commerce", "NOT STARTED", "LATER", "Pricing"),
    t("m14", "Calculate true cost by size", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m15", "Finalize retail price by size", "commerce", "NOT STARTED", "LATER", "Pricing", { launchArea: "Product" }),
    t("m16", "Calculate contribution margin by product", "commerce", "NOT STARTED", "NEXT", "Pricing"),
    t("m17", "Calculate average order value targets", "commerce", "NOT STARTED", "LATER", "Pricing"),
    t("m18", "Calculate monthly fixed costs", "commerce", "NOT STARTED", "LATER", "Pricing"),
    t("m19", "Calculate break-even units and orders", "commerce", "NOT STARTED", "LATER", "Pricing"),
    t("m20", "Finalize startup budget", "commerce", "NOT STARTED", "NEXT", "Budget"),
    t("m21", "Determine launch inventory budget", "commerce", "NOT STARTED", "NEXT", "Budget", { launchArea: "Inventory" }),
    t("m22", "Determine working-capital reserve", "commerce", "NOT STARTED", "LATER", "Budget"),
    t("m23", "Decide how much credit is safe to use", "commerce", "NOT STARTED", "LATER", "Budget"),

    t("sf1", "Build the first storefront prototype", "commerce", "NOT STARTED", "NOW", "Storefront", {
      due: "2026-10-20",
      notes: "The customer storefront is a separate site. Track it here. Do not build it inside the command center.",
      launchArea: "Storefront",
    }),
    t("sf2", "Build storefront homepage", "commerce", "NOT STARTED", "LATER", "Storefront", { launchArea: "Storefront" }),
    t("sf3", "Build Reclaimed and Recycled collections", "commerce", "NOT STARTED", "LATER", "Storefront", { launchArea: "Storefront" }),
    t("sf4", "Build scent library and scent pages", "commerce", "NOT STARTED", "LATER", "Storefront", { launchArea: "Storefront" }),
    t("sf5", "Build Reclaimed builder: size, scent, Clear / Color / Surprise Me", "commerce", "NOT STARTED", "LATER", "Storefront", {
      launchArea: "Storefront",
    }),
    t("sf6", "Build the “what might arrive” gallery", "commerce", "NOT STARTED", "LATER", "Storefront"),
    t("sf7", "Build Our Circle, About, care, safety, and FAQ", "commerce", "NOT STARTED", "LATER", "Storefront"),
    t("sf8", "Build return-program framework", "commerce", "NOT STARTED", "LATER", "Storefront"),
    t("sf9", "Build cart behavior and mobile layouts", "commerce", "NOT STARTED", "LATER", "Storefront"),
    t("sf10", "Add email and waitlist capture", "commerce", "NOT STARTED", "NEXT", "Storefront", { launchArea: "Content" }),
    t("sf11", "Add analytics and policy placeholders", "commerce", "NOT STARTED", "LATER", "Storefront"),
    t("sf12", "Connect commerce backend when ready", "commerce", "NOT STARTED", "LATER", "Storefront"),

    t("k1", "Order one-candle shipping box samples", "commerce", "NOT STARTED", "NEXT", "Packaging", {
      relatedSupplier: "sup-pack",
      launchArea: "Packaging",
    }),
    t("k2", "Order multi-candle box samples", "commerce", "NOT STARTED", "NEXT", "Packaging", { launchArea: "Packaging" }),
    t("k3", "Test protection for variable reclaimed shapes", "commerce", "NOT STARTED", "NEXT", "Packaging"),
    t("k4", "Decide padding, tape, and inserts", "commerce", "NOT STARTED", "LATER", "Packaging"),
    t("k5", "Test drop resistance and breakage", "commerce", "NOT STARTED", "LATER", "Packaging"),
    t("k6", "Determine packed weights and dimensions", "commerce", "NOT STARTED", "LATER", "Packaging"),
    t("k7", "Compare carriers and estimate zone costs", "commerce", "NOT STARTED", "LATER", "Packaging", { relatedSupplier: "sup-ship" }),
    t("k8", "Decide whether the customer pays shipping", "commerce", "NOT STARTED", "LATER", "Packaging"),
    t("k9", "Develop hot-weather shipping policy", "commerce", "NOT STARTED", "LATER", "Packaging"),
    t("k10", "Develop damaged-order process", "commerce", "NOT STARTED", "LATER", "Packaging"),

    t("n1", "Photograph current reclaimed vessels", "launch", "NOT STARTED", "NEXT", "Content", { launchArea: "Content" }),
    t("n2", "Photograph before-and-after transformations", "launch", "NOT STARTED", "NEXT", "Content", { launchArea: "Content" }),
    t("n3", "Film sourcing, cleaning, scent work, and pours", "launch", "NOT STARTED", "LATER", "Content"),
    t("n4", "Film curing, QC, and mystery reveals", "launch", "NOT STARTED", "LATER", "Content"),
    t("n5", "Create circularity explainer", "launch", "NOT STARTED", "NEXT", "Content", { launchArea: "Content" }),
    t("n6", "Create founder build-in-public content", "launch", "NOT STARTED", "NEXT", "Content"),
    t("n7", "Build launch content bank", "launch", "NOT STARTED", "LATER", "Content"),
    t("n8", "Create launch-week posting schedule", "launch", "NOT STARTED", "LATER", "Content"),
    t("n9", "Create email signup content", "launch", "NOT STARTED", "NEXT", "Content"),
    t("n10", "Create initial product photography", "launch", "NOT STARTED", "LATER", "Content", { launchArea: "Content" }),

    t("v1", "Interview target customers", "launch", "NOT STARTED", "NEXT", "Validation", {
      relatedExperiment: "exp-mystery",
      launchArea: "Customer Validation",
    }),
    t("v2", "Validate Small, Medium, and Large prices", "launch", "NOT STARTED", "NEXT", "Validation", { launchArea: "Customer Validation" }),
    t("v3", "Test mystery-vessel appeal", "launch", "NOT STARTED", "NEXT", "Validation", { relatedExperiment: "exp-mystery" }),
    t("v4", "Test whether Clear / Color / Surprise Me is enough", "launch", "NOT STARTED", "NEXT", "Validation", {
      relatedExperiment: "exp-mystery",
    }),
    t("v5", "Test reaction to the vessel gallery", "launch", "NOT STARTED", "LATER", "Validation"),
    t("v6", "Test scent concepts before full production", "launch", "NOT STARTED", "NEXT", "Validation", { launchArea: "Customer Validation" }),
    t("v7", "Test willingness to buy scent online", "launch", "NOT STARTED", "LATER", "Validation"),
    t("v8", "Test gifting appeal", "launch", "NOT STARTED", "LATER", "Validation"),
    t("v9", "Test whether sustainability leads or supports", "launch", "NOT STARTED", "NEXT", "Validation"),
    t("v10", "Test return-credit interest", "launch", "NOT STARTED", "LATER", "Validation"),
    t("v11", "Collect objections and adjust copy", "launch", "NOT STARTED", "LATER", "Validation"),

    t("l1", "Finalize launch scents", "launch", "NOT STARTED", "LATER", "Readiness", { launchArea: "Product" }),
    t("l2", "Finalize launch wax", "launch", "NOT STARTED", "LATER", "Readiness", { launchArea: "Product" }),
    t("l3", "Finalize tested wick and profile system", "launch", "NOT STARTED", "LATER", "Readiness", { launchArea: "Product" }),
    t("l4", "Finalize vessel supply", "launch", "NOT STARTED", "LATER", "Readiness", { launchArea: "Inventory" }),
    t("l5", "Finalize packaging", "launch", "NOT STARTED", "LATER", "Readiness", { launchArea: "Packaging" }),
    t("l6", "Finalize retail prices", "launch", "NOT STARTED", "LATER", "Readiness", { launchArea: "Product" }),
    t("l7", "Produce first 30–50 sellable candles", "launch", "NOT STARTED", "LATER", "Readiness", { launchArea: "Inventory" }),
    t("l8", "Produce burn-test and photography units", "launch", "NOT STARTED", "LATER", "Readiness", { launchArea: "Product" }),
    t("l9", "Hold a replacement reserve", "launch", "NOT STARTED", "LATER", "Readiness", { launchArea: "Inventory" }),
    t("l10", "Create the waitlist", "launch", "NOT STARTED", "NEXT", "Readiness", { launchArea: "Content" }),
    t("l11", "Set the launch date", "launch", "NOT STARTED", "LATER", "Readiness"),
    t("l12", "Test checkout, shipping, and customer emails", "launch", "NOT STARTED", "LATER", "Readiness", { launchArea: "Storefront" }),
    t("l13", "Finalize customer policies", "launch", "NOT STARTED", "LATER", "Readiness", { launchArea: "Admin" }),
    t("l14", "Open the first launch", "launch", "NOT STARTED", "LATER", "Readiness"),
    t("l15", "Hold the post-launch review", "launch", "NOT STARTED", "LATER", "Readiness"),
    t("r1", "File new evidence into the discovery worksheet", "research", "NOT STARTED", "NEXT", "Notes", {
      relatedDocument: "doc-discovery",
    }),
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

function scents(): Scent[] {
  const base = {
    keyNotes: "",
    supplier: "",
    materials: "",
    formula: "",
    load: "6%",
    coldThrow: "",
    hotThrow: "",
    approved: false,
    costPerCandle: "",
  };
  return [
    { ...base, slot: "01", workingName: "Cashmere Woods", role: "Cozy / warm / elevated", mood: "", inspiration: "Inspired by Glade Cashmere Woods, but more expensive-feeling: soft woods, amber, musk, cashmere-type warmth.", notes: "" },
    { ...base, slot: "02", workingName: "Rainy Clean / Art-Class Soap", role: "Fresh / aquatic / nostalgic", mood: "", inspiration: "Rain, clean air, watery freshness — with that distinctive clear aquarium/sea-creature hand soap from childhood art class as a possible inspiration.", notes: "" },
    { ...base, slot: "03", workingName: "Woodsy Earth", role: "Grounded / outdoorsy", mood: "", inspiration: "Piney, earthy, forest-like, possibly cedar/resin/moss/soil notes. Less “Christmas tree,” more grounded nature.", notes: "" },
    { ...base, slot: "04", workingName: "Bespoke Vanilla", role: "Familiar but peculiar", mood: "", inspiration: "Vanilla as the approachable scent, but paired with something unexpected so it doesn't feel like a basic vanilla candle.", notes: "" },
    { ...base, slot: "05", workingName: "Childhood Memory", role: "Nostalgic / abstract / emotional", mood: "", inspiration: "A scent that makes someone go “I don't know what this is, but I remember this.” Built around shared Gen Z/millennial childhood sensory memories rather than an obvious fragrance category.", notes: "" },
    { ...base, slot: "06", workingName: "???", role: "Open slot", mood: "", inspiration: "Not decided yet — this is the one we still need to discover.", notes: "" },
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
    row("vs1", "R-014", "Small", "", "S-Standard", "Clear", "Clear", "Needs Testing", "Replace with a measured jar. This row is a placeholder."),
    row("vs2", "R-018", "Small", "", "S-Wide", "Amber", "Color", "Needs Testing", "Placeholder until diameter is recorded."),
    row("vs3", "R-022", "Medium", "", "M-Narrow", "Pale green", "Color", "Needs Testing", "Placeholder."),
    row("vs4", "R-027", "Medium", "", "M-Standard", "Clear", "Clear", "Accepted", "Example of an accepted profile. Confirm before relying on it."),
    row("vs5", "R-031", "Medium", "", "M-Wide", "Smoke", "Color", "Needs Testing", "Placeholder."),
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

function economics(): SizeModel[] {
  return [
    model("Small", "8–10 oz", 37, {
      wax: 1.2,
      fragrance: 1.6,
      wick: 0.22,
      vessel: 2.2,
      prepLabor: 2.8,
      closure: 1.1,
      labels: 0.55,
      packaging: 1.6,
      paymentFees: 1.45,
      shippingMaterials: 0.7,
      defectAllowance: 0.45,
      labor: 1.13,
    }),
    model("Medium", "12–16 oz", 46, {
      wax: 2.2,
      fragrance: 2.8,
      wick: 0.3,
      vessel: 4,
      prepLabor: 3.5,
      closure: 1.2,
      labels: 0.7,
      packaging: 2.4,
      paymentFees: 1.9,
      shippingMaterials: 1,
      defectAllowance: 0.8,
      labor: 2.2,
    }),
    model("Large", "17–20 oz", 58, {
      wax: 3.2,
      fragrance: 4.2,
      wick: 0.4,
      vessel: 5.5,
      prepLabor: 4,
      closure: 1.4,
      labels: 0.9,
      packaging: 3.2,
      paymentFees: 2.4,
      shippingMaterials: 1.4,
      defectAllowance: 1.2,
      labor: 5.2,
    }),
  ];
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

function skus(): LaunchSku[] {
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
  return [
    sku("sku1", "01 Bright / Fresh", "Small", 6),
    sku("sku2", "01 Bright / Fresh", "Medium", 4),
    sku("sku3", "02 Green / Botanical", "Small", 4),
    sku("sku4", "02 Green / Botanical", "Medium", 4),
    sku("sku5", "03 Woody / Dark", "Small", 4),
    sku("sku6", "03 Woody / Dark", "Medium", 4),
    sku("sku7", "03 Woody / Dark", "Large", 2),
    sku("sku8", "04 Warm / Gourmand", "Medium", 6),
    sku("sku9", "05 Clean / Atmospheric", "Small", 4),
    sku("sku10", "05 Clean / Atmospheric", "Medium", 4),
  ];
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
