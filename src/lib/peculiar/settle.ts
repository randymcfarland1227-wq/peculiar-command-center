import type { Task, TaskStatus, TaskStep } from "./types.ts";

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

export function settle(task: Task): Task {
  const status = statusFromSteps(task.status, task.steps ?? []);
  const done = status === "COMPLETE";
  return {
    ...task,
    status,
    completedDate: done ? task.completedDate || today() : "",
    completedAt: done ? task.completedAt || (task.status === "COMPLETE" ? undefined : new Date().toISOString()) : undefined,
  };
}
