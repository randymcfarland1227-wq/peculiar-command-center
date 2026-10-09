import type { Task, TaskStatus } from "./types.ts";

/**
 * "Post launch": the item can wait until after launch, so it counts as done for launch
 * (tentatively complete) and drops off every active list. It stays visible with its own
 * chip in the full list, the status filter, and the Post launch drawer on the dashboard,
 * and it is never mixed up with COMPLETE.
 */
export const POST_LAUNCH = "POST LAUNCH" satisfies TaskStatus;

export function isPostLaunch(status: TaskStatus) {
  return status === POST_LAUNCH;
}

/** Finished for launch purposes: really complete, or tentatively complete as post launch. */
export function isClosed(status: TaskStatus) {
  return status === "COMPLETE" || status === POST_LAUNCH;
}

/**
 * Whether a task counts toward progress at all. Parked, optional, and folded-in tasks
 * (`partOf`, counted through the task they belong to) are shown but never counted.
 */
export function isCounted(task: Pick<Task, "afterLaunch" | "optional" | "partOf">) {
  return !task.afterLaunch && !task.optional && !task.partOf;
}

/** Workstreams the "*" dependency leaves out: launch itself, and research, which never ends. */
const NOT_BEFORE_LAUNCH = new Set<Task["workstream"]>(["launch", "research"]);

export type Waiting = { id: string; label: string };

/**
 * What a task still waits on, from its `dependencies` (comma separated):
 * - `task-id`: that task is complete or post launch.
 * - `task-id:step-id`: that field on the task is filled in (or the whole task is closed).
 * - `*`: every counted task outside Launch and Research is closed.
 * A dependency on a task that no longer exists, or on an optional one, never holds anything up.
 */
export function waitingOn(task: Pick<Task, "id" | "dependencies">, all: Task[]): Waiting[] {
  const byId = new Map(all.map((item) => [item.id, item]));
  const out: Waiting[] = [];
  const seen = new Set<string>();
  const add = (id: string, label: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    out.push({ id, label });
  };
  for (const raw of (task.dependencies ?? "").split(",")) {
    const ref = raw.trim();
    if (!ref) continue;
    if (ref === "*") {
      for (const item of all) {
        if (item.id === task.id || NOT_BEFORE_LAUNCH.has(item.workstream)) continue;
        if (isCounted(item) && !isClosed(item.status)) add(item.id, item.title);
      }
      continue;
    }
    const [taskId, stepId] = ref.split(":").map((part) => part.trim());
    const dep = byId.get(taskId);
    if (!dep || dep.optional || isClosed(dep.status)) continue;
    if (stepId) {
      const step = dep.steps?.find((item) => item.id === stepId);
      if (!step || step.value.trim()) continue;
      add(ref, `${dep.title}: ${step.label}`);
    } else {
      add(dep.id, dep.title);
    }
  }
  return out;
}

/** Locked: not finished, and something it depends on isn't either. It can't be worked yet. */
export function isLocked(task: Task, all: Task[]) {
  return !isClosed(task.status) && waitingOn(task, all).length > 0;
}

/** Can't move until something outside the plan changes (money, a reply). Not open work. */
export function isBlocked(task: Pick<Task, "status">) {
  return task.status === "BLOCKED";
}

/**
 * Open work: counted, not closed, not blocked, and not locked behind another task.
 * Without the full task list, dependencies can't be checked and are ignored.
 */
export function isOpenTask(task: Task, all: Task[] = []) {
  return isCounted(task) && !isClosed(task.status) && !isBlocked(task) && !isLocked(task, all);
}

/**
 * Done out of total, over the counted tasks in `group` (see isCounted). Locked and blocked tasks
 * are still in the total, since launch needs them, but not in `open`. `postLaunch` says how many
 * of the done ones are post launch. Pass every task as `all` so locks across groups resolve.
 */
export function countComplete(group: Task[], all: Task[] = group) {
  const tasks = group.filter(isCounted);
  const total = tasks.length;
  const done = tasks.filter((task) => isClosed(task.status)).length;
  const postLaunch = tasks.filter((task) => isPostLaunch(task.status)).length;
  const open = tasks.filter((task) => isOpenTask(task, all)).length;
  const blocked = tasks.filter((task) => !isClosed(task.status) && isBlocked(task)).length;
  const locked = tasks.filter((task) => !isBlocked(task) && isLocked(task, all)).length;
  return { done, total, postLaunch, open, locked, blocked, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function nextActions(tasks: Task[], limit = 5) {
  const rank = { NOW: 0, NEXT: 1, LATER: 2 };
  return tasks
    .filter((task) => isOpenTask(task, tasks) && task.priority !== "LATER")
    .slice()
    .sort((a, b) => {
      const byPriority = rank[a.priority] - rank[b.priority];
      if (byPriority !== 0) return byPriority;
      if (a.due && b.due) return a.due.localeCompare(b.due);
      if (a.due) return -1;
      if (b.due) return 1;
      return a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}

/**
 * Whether a task list row shows. "Now and next" shows only work that can be done now: it hides
 * LATER, closed, optional, blocked, and locked tasks. Picking a closed status (POST LAUNCH or
 * COMPLETE) in the filter shows every task with it, from either view, so parked work is always
 * one click away. Pass `all` so locks can be checked.
 */
export function showInTaskList(
  task: Task,
  view: { scope: "active" | "all"; priority: "ALL" | Task["priority"]; status: "ALL" | TaskStatus; query: string },
  all: Task[] = [],
) {
  if (task.afterLaunch) return false;
  if (view.status !== "ALL" && task.status !== view.status) return false;
  const closedFilter = view.status !== "ALL" && isClosed(view.status);
  const statusFilter = view.status !== "ALL";
  if (view.scope === "active" && !closedFilter) {
    if (task.priority === "LATER" || isClosed(task.status)) return false;
    if (!statusFilter && (task.optional || isBlocked(task) || isLocked(task, all))) return false;
  }
  if (view.priority !== "ALL" && task.priority !== view.priority) return false;
  const q = view.query.trim().toLowerCase();
  if (q && !`${task.title} ${task.notes} ${task.section}`.toLowerCase().includes(q)) return false;
  return true;
}
