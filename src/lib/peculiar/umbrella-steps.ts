import type { PeculiarData, Task, TaskStep, Workstream } from "./types.ts";
import { addTaskIfMissing } from "./added-tasks.ts";
import { settle } from "./settle.ts";

/**
 * 2026-10-22: Randy's Peculiar umbrella groupings, made into stepped tasks so Life Hub shows what's
 * left on each as subtasks. Groupings that already had a task get the missing steps added; the rest
 * are new tasks; the return-vessel credit (sf8) comes forward from after launch. Additive only: a
 * step or task already saved (or a task deleted) is left as it is.
 */
const step = (id: string, label: string, hint = ""): TaskStep => ({ id, label, hint, value: "" });

function task(id: string, title: string, workstream: Workstream, section: string, launchArea: Task["launchArea"], notes: string, steps: TaskStep[]): Task {
  return {
    id,
    title,
    workstream,
    status: "NOT STARTED",
    priority: "NEXT",
    section,
    due: "",
    notes,
    dependencies: "",
    link: "",
    cost: "",
    owner: "Founder",
    completedDate: "",
    relatedExperiment: "",
    relatedSupplier: "",
    relatedDocument: "",
    launchArea,
    steps,
  };
}

export const NEW_UMBRELLA_TASKS: [Task, string][] = [
  [
    task("cm-brand-offer", "Storefront brand offering", "commerce", "Storefront", "Storefront", "The site has to say reclaimed vessels are safe, tested, ornate and one of a kind — never cheap.", [
      step("bo1", "Safety said plainly", "Every reclaimed vessel is cleaned, inspected and burn-tested"),
      step("bo2", "Show it", "Before/after vessel photos and a \"what might arrive\" gallery"),
      step("bo3", "Value story", "One of a kind, ornate, saves a vessel from the landfill (specific, not vague green talk)"),
      step("bo4", "Safety line near the product", "Tested wick, wax and fire-safety label"),
      step("bo5", "Tone check", "Homepage, collections, builder and About page — no discount feel"),
      step("bo6", "Phone read-through", "Read the whole site on a phone as a first-time buyer"),
      step("bo7", "First-glance promise", "Headline, one-line promise, first screen"),
    ]),
    "cm-store",
  ],
  [
    task("cm-ingredients", "Storefront ingredient story", "commerce", "Storefront", "Storefront", "100% soy wax and clean-science fragrance are expensive — it is a luxury product. Make it known without plastering it everywhere.", [
      step("ig1", "Wax named", "100% soy, said once, clearly"),
      step("ig2", "Fragrance named", "Clean-science fragrance oils"),
      step("ig3", "What's in it block", "One short block on each scent page"),
      step("ig4", "About and FAQ", "There, not on every banner"),
      step("ig5", "Matches the records", "Same wording as the label and the SDS / IFRA records"),
    ]),
    "cm-brand-offer",
  ],
  [
    task("la-channels", "Marketing channels", "launch", "Content", "Content", "Decide where Peculiar shows up first and how — channels, cadence and what each one is for.", [
      step("mc1", "Launch channels", "Owned storefront, TikTok, Instagram, local markets (wholesale is out for now)"),
      step("mc2", "Each channel's job", "Its job, how often you post, and who it is for"),
      step("mc3", "First posts per channel", "Process, vessel reveals, before/afters"),
      step("mc4", "Channel budget", "Organic only, or any paid"),
      step("mc5", "Waitlist on the profiles", "Same signup as the storefront waitlist"),
      step("mc6", "Content bank and launch-week schedule"),
    ]),
    "la-content",
  ],
  [
    task("cm-backend-sweep", "Backend sweep", "commerce", "Storefront", "Admin", "Walk through the whole owner backend (Peculiar Floor) once and fix what is off.", [
      step("bk1", "Orders, stock and ingredients"),
      step("bk2", "Stripe connection and webhook"),
      step("bk3", "Expenses and the ledger"),
      step("bk4", "Vessel and pour/test/cure pages"),
      step("bk5", "Broken or missing: listed and fixed"),
    ]),
    "cm-stripe",
  ],
];

/** Steps added to tasks that already cover a grouping. */
export const UMBRELLA_STEPS: Record<string, TaskStep[]> = {
  "sf8": [
    step("rc1", "Credit amount", "Credit or refund, and how much"),
    step("rc2", "Return window", "Only while the candle is unused and unburned"),
    step("rc3", "Local pilot", "Towson / Baltimore before anything national"),
    step("rc4", "Policy line", "For the storefront and checkout"),
    step("rc5", "Return-program card"),
    step("rc6", "Customer interest", "Ask interview customers whether the credit interests them"),
  ],
  "sa-burn": [
    step("s-std", "Standard written down", "Pick the candle fire-safety standard to follow"),
    step("s-photos", "Photos per burn", "At start, one hour, and end of every test"),
    step("s-backfill", "Past burns back-filled", "Dates, photos, results for burns already done"),
  ],
  "la-content": [
    step("ph1", "Shot guide", "Photos per item and angles: front, 45°, top, detail, label, scale"),
    step("ph2", "Shot types", "Solo, group, combinations, in-use / lifestyle"),
    step("ph3", "Lighting and backdrop", "Same light, backdrop and props for every item"),
    step("ph4", "Items to stage", "List every object and item"),
    step("ph5", "Files named and sorted", "So the site can use them"),
    step("ph6", "Photos on the storefront", "Collections, scent pages, builder"),
  ],
  "co-insurance": [
    step("in1", "Quotes", "Fire / product liability"),
    step("in2", "Affordable?", "What fits, and whether to launch before it's in place"),
  ],
  "pl-vessels": [
    step("vs1", "Sorted by size", "Diameter and profile"),
    step("vs2", "Reclaimed vs recycled split"),
    step("vs3", "Prep process", "Clean and prep written down, with time per jar"),
    step("vs4", "First batch count", "Sellable vessels needed, plus a replacement reserve"),
    step("vs5", "Sourcing plan for more"),
  ],
  "cm-shopping": [step("sh-tissue", "Tissue paper")],
  "cm-shipping": [
    step("k11", "Shipping agent", "Choose the shipping agent"),
    step("k12", "Agent in the backend", "Connect the shipping agent to Peculiar Floor"),
  ],
};

export function umbrellaSteps(data: PeculiarData): PeculiarData {
  let tasks = data.tasks.map((t) => {
    const extra = UMBRELLA_STEPS[t.id];
    if (!extra) return t;
    const have = new Set((t.steps ?? []).map((s) => s.id));
    const add = extra.filter((s) => !have.has(s.id));
    if (!add.length && !(t.id === "sf8" && t.afterLaunch)) return t;
    const next: Task = { ...t, steps: [...(t.steps ?? []), ...add] };
    if (t.id === "sf8") {
      next.afterLaunch = false;
      if (next.priority === "LATER") next.priority = "NEXT";
    }
    return settle(next);
  });
  for (const [t, after] of NEW_UMBRELLA_TASKS) tasks = addTaskIfMissing(tasks, t, after);
  return { ...data, tasks };
}
