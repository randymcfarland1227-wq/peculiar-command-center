import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { prettyDate } from "@/lib/peculiar/format";
import { stepProgress, usePeculiar } from "@/lib/peculiar/store";
import type { Task } from "@/lib/peculiar/types";
import { PriorityChip, StatusChip } from "@/components/status-chip";

/** Task ids named in a stepped task's dependencies that are not complete yet. */
export function useWaitingOn(task: Task) {
  const tasks = usePeculiar((s) => s.tasks);
  const ids = task.dependencies
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return tasks.filter((item) => ids.includes(item.id) && item.status !== "COMPLETE");
}

/** A component task shown as one row of fields, filled in left to right. */
export function StepTrack({ task, index }: { task: Task; index?: number }) {
  const updateStep = usePeculiar((s) => s.updateStep);
  const setOpenTask = usePeculiar((s) => s.setOpenTask);
  const progress = stepProgress(task);
  const waitingOn = useWaitingOn(task);
  const steps = task.steps ?? [];
  const nextIndex = progress.next ? steps.indexOf(progress.next) : -1;
  const done = task.status === "COMPLETE";

  return (
    <article className={cn("min-w-0 border border-line bg-sheet p-4", waitingOn.length > 0 && !done && "bg-paper")}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
        <div className="flex items-baseline gap-3">
          {index !== undefined ? <span className="font-serif text-2xl tabular-nums text-olive">{String(index).padStart(2, "0")}</span> : null}
          <button type="button" onClick={() => setOpenTask(task.id)} className={cn("text-left font-serif text-2xl", done && "text-muted")}>
            {task.title}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PriorityChip priority={task.priority} />
          <StatusChip status={task.status} />
          {task.due ? <span className="text-xs tracking-widest text-muted">Due {prettyDate(task.due)}</span> : null}
          <span className="text-xs tabular-nums tracking-widest text-muted">
            {progress.done} of {progress.total}
          </span>
        </div>
      </div>
      <div className="mt-2 h-1 bg-cream">
        <div className="h-1 bg-forest" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
      </div>
      {waitingOn.length > 0 && !done ? (
        <p className="mt-3 text-xs tracking-widest text-olive">Starts after {waitingOn.map((item) => item.title).join(" · ")}</p>
      ) : null}
      {task.notes ? <p className="mt-3 text-sm leading-relaxed text-muted whitespace-pre-line">{task.notes}</p> : null}

      <ol className="-mx-4 mt-4 flex snap-x gap-2 overflow-x-auto px-4 pb-2">
        {steps.map((item, at) => {
          const filled = Boolean(item.value.trim());
          const isNext = at === nextIndex;
          const later = !filled && nextIndex >= 0 && at > nextIndex;
          return (
            <li
              key={item.id}
              className={cn(
                "flex w-44 shrink-0 snap-start flex-col border p-3 sm:w-auto sm:min-w-40 sm:flex-1",
                filled ? "border-forest bg-paper" : isNext ? "border-forest bg-sheet" : "border-line bg-paper",
                later && "opacity-60 focus-within:opacity-100",
              )}
            >
              <label htmlFor={`${task.id}-${item.id}`} className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center text-[10px] tabular-nums",
                    filled ? "bg-forest text-paper" : isNext ? "border border-forest text-forest" : "border border-line text-muted",
                  )}
                >
                  {filled ? <Check className="size-3" /> : at + 1}
                </span>
                <span className="text-xs tracking-widest text-ink">{item.label}</span>
              </label>
              <span className="mt-1 min-h-8 text-xs leading-snug text-muted">{isNext ? "Up next · " : ""}{item.hint}</span>
              <input
                id={`${task.id}-${item.id}`}
                value={item.value}
                onChange={(event) => updateStep(task.id, item.id, event.target.value)}
                placeholder={item.label}
                className="mt-2 h-11 w-full border border-line bg-sheet px-2 text-sm text-ink placeholder:text-muted"
              />
            </li>
          );
        })}
      </ol>
    </article>
  );
}
