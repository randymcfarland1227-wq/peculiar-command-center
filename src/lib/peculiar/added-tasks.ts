import type { Task } from "./types.ts";

/**
 * Tasks added after launch of the command center. Saved browsers keep their own task list,
 * so new seed tasks reach them through a one-time update (see updates.ts) that inserts each
 * task only if its id is missing. Nothing already saved is changed.
 */
export const STRIPE_TASK_ID = "cm-stripe";

export function stripeIntegrationTask(): Task {
  return {
    id: STRIPE_TASK_ID,
    title: "Stripe backend to frontend integration",
    workstream: "commerce",
    status: "NOT STARTED",
    priority: "NOW",
    section: "Storefront",
    due: "2026-10-09",
    notes: [
      "Do Fri Oct 9. Connect Stripe to Peculiar Floor: test mode first, then live.",
      "1) Stripe dashboard, Test mode on > Developers > Webhooks > Add endpoint: https://peculiar-floor.randymcfarland1227.workers.dev/api/stripe/webhook",
      "2) Events: checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.async_payment_failed, charge.refunded. Copy the signing secret (whsec_...).",
      "3) Developers > API keys > Create restricted key 'Peculiar Floor read': Checkout Sessions, Products, Charges (and Prices if listed) = Read; everything else None. Copy the rk_test_... key.",
      "4) Ask New Bot for the secure boxes and enter both there. Never paste them in chat.",
      "5) Test purchase on peculiarcandle.com in test mode with card 4242 4242 4242 4242, then refund it. New Bot confirms the logs.",
      "6) Repeat 1–4 in live mode (whsec_ + rk_live_), then place one small real order and fully refund it before shipping anything.",
      "7) Decide: charge shipping? Collect Maryland 6% sales tax? Is the shop's Stripe key live or test?",
    ].join("\n"),
    dependencies: "",
    link: "https://dashboard.stripe.com/test/webhooks",
    cost: "",
    owner: "Founder",
    completedDate: "",
    relatedExperiment: "",
    relatedSupplier: "",
    relatedDocument: "",
    launchArea: "Storefront",
  };
}

/** Inserts `task` after the task with id `afterId` (or first), only when its id isn't saved yet. */
export function addTaskIfMissing(tasks: Task[], task: Task, afterId?: string): Task[] {
  if (tasks.some((item) => item.id === task.id)) return tasks;
  const at = afterId ? tasks.findIndex((item) => item.id === afterId) : -1;
  if (at < 0) return [task, ...tasks];
  return [...tasks.slice(0, at + 1), task, ...tasks.slice(at + 1)];
}
