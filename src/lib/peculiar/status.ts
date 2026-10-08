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

/** Still active work: not closed, and not parked with the separate "After launch" switch. */
export function isOpenTask(task: Pick<Task, "status" | "afterLaunch">) {
  return !isClosed(task.status) && !task.afterLaunch;
}

/**
 * Done out of total, leaving out tasks parked until after launch.
 * Post launch tasks count toward done (they no longer block launch); `postLaunch` says how many.
 */
export function countComplete(all: Task[]) {
  const tasks = all.filter((task) => !task.afterLaunch);
  const total = tasks.length;
  const done = tasks.filter((task) => isClosed(task.status)).length;
  const postLaunch = tasks.filter((task) => isPostLaunch(task.status)).length;
  return { done, total, postLaunch, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function nextActions(tasks: Task[], limit = 5) {
  const rank = { NOW: 0, NEXT: 1, LATER: 2 };
  return tasks
    .filter((task) => isOpenTask(task) && task.priority !== "LATER")
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
 * Whether a task list row shows. "Now and next" hides LATER and closed work. Picking a closed
 * status (POST LAUNCH or COMPLETE) in the filter shows every task with it, from either view,
 * so parked work is always one click away.
 */
export function showInTaskList(
  task: Task,
  view: { scope: "active" | "all"; priority: "ALL" | Task["priority"]; status: "ALL" | TaskStatus; query: string },
) {
  if (task.afterLaunch) return false;
  if (view.status !== "ALL" && task.status !== view.status) return false;
  const closedFilter = view.status !== "ALL" && isClosed(view.status);
  if (view.scope === "active" && !closedFilter) {
    if (task.priority === "LATER" || isClosed(task.status)) return false;
  }
  if (view.priority !== "ALL" && task.priority !== view.priority) return false;
  const q = view.query.trim().toLowerCase();
  if (q && !`${task.title} ${task.notes} ${task.section}`.toLowerCase().includes(q)) return false;
  return true;
}
