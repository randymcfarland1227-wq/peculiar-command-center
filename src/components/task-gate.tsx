import { Lock } from "lucide-react";
import { usePeculiar } from "@/lib/peculiar/store";
import { isClosed, waitingOn, type Waiting } from "@/lib/peculiar/status";
import type { Task } from "@/lib/peculiar/types";

/** What holds a task back: whether it's locked, what it waits on, and the task it's folded into. */
export function useTaskGate(task: Task) {
  const tasks = usePeculiar((s) => s.tasks);
  const waiting = isClosed(task.status) ? [] : waitingOn(task, tasks);
  const parent = task.partOf ? tasks.find((item) => item.id === task.partOf) : undefined;
  return { locked: waiting.length > 0, waiting, parent };
}

/** "Unlocks after A · B · C and 4 more". */
export function unlockText(waiting: Waiting[], max = 3) {
  const names = waiting.slice(0, max).map((item) => item.label);
  const more = waiting.length - names.length;
  return `Unlocks after ${names.join(" · ")}${more > 0 ? ` and ${more} more` : ""}`;
}

/** Chips for a task outside the open count: locked, optional, or folded into another task. */
export function GateChips({ task }: { task: Task }) {
  const { locked, parent } = useTaskGate(task);
  return (
    <>
      {locked ? (
        <span className="inline-flex h-6 items-center gap-1 border border-line bg-sheet px-2 text-xs tracking-widest text-muted">
          <Lock className="size-3" aria-hidden="true" />
          LOCKED
        </span>
      ) : null}
      {task.optional ? (
        <span className="inline-flex h-6 items-center border border-dashed border-line px-2 text-xs tracking-widest text-muted">
          OPTIONAL
        </span>
      ) : null}
      {parent ? (
        <span className="inline-flex h-6 items-center border border-line px-2 text-xs tracking-widest text-muted">
          IN {parent.title.toUpperCase()}
        </span>
      ) : null}
    </>
  );
}

/** The line under a locked task saying what it waits on. */
export function LockNote({ task, className }: { task: Task; className?: string }) {
  const { locked, waiting } = useTaskGate(task);
  if (!locked) return null;
  return <p className={className ?? "mt-2 text-xs tracking-widest text-olive"}>{unlockText(waiting)}</p>;
}
