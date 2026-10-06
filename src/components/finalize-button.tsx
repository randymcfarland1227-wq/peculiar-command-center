import { Lock } from "lucide-react";
import { cn } from "@/lib/cn";
import { usePeculiar } from "@/lib/peculiar/store";
import { isDone, type Task } from "@/lib/peculiar/types";

/** What a task's check button sets: done for now when open, back in progress when done. */
export function toggledDone(task: Task) {
  return isDone(task.status) ? "IN PROGRESS" : "COMPLETE";
}

export function checkLabel(task: Task) {
  return isDone(task.status) ? `Reopen ${task.title}` : `Complete ${task.title}`;
}

/**
 * Second layer after the check: locks a complete task in as FINALIZED, or unlocks it.
 * Only shows once a task is done, so open tasks keep a single button.
 */
export function FinalizeButton({ task, className }: { task: Task; className?: string }) {
  const updateTask = usePeculiar((s) => s.updateTask);
  if (!isDone(task.status)) return null;
  const finalized = task.status === "FINALIZED";
  return (
    <button
      type="button"
      aria-label={finalized ? `Unfinalize ${task.title}` : `Finalize ${task.title}`}
      title={finalized ? "Finalized. Click to set back to complete." : "Complete for now. Finalize once the call is locked in."}
      onClick={() => updateTask(task.id, { status: finalized ? "COMPLETE" : "FINALIZED" })}
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center border",
        finalized ? "border-forest bg-forest text-paper" : "border-forest bg-paper text-forest",
        className,
      )}
    >
      <Lock className="size-4" />
    </button>
  );
}
