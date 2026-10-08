import { Check, Clock } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { prettyDate } from "@/lib/peculiar/format";
import { stepProgress, usePeculiar } from "@/lib/peculiar/store";
import { isClosed, isPostLaunch } from "@/lib/peculiar/status";
import type { Task } from "@/lib/peculiar/types";
import { PriorityChip, StatusChip } from "@/components/status-chip";
import { DeleteButton } from "@/components/fields";

/** Task ids named in a stepped task's dependencies that are not complete (or post launch) yet. */
export function useWaitingOn(task: Task) {
  const tasks = usePeculiar((s) => s.tasks);
  const ids = task.dependencies
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return tasks.filter((item) => ids.includes(item.id) && !isClosed(item.status));
}

/** A component task shown as one column card. Its fields run top to bottom, in order. */
export function StepTrack({ task, index }: { task: Task; index?: number }) {
  const updateStep = usePeculiar((s) => s.updateStep);
  const updateTask = usePeculiar((s) => s.updateTask);
  const removeTask = usePeculiar((s) => s.removeTask);
  const removeStep = usePeculiar((s) => s.removeStep);
  const setOpenTask = usePeculiar((s) => s.setOpenTask);
  const progress = stepProgress(task);
  const waitingOn = useWaitingOn(task);
  const steps = task.steps ?? [];
  const nextIndex = progress.next ? steps.indexOf(progress.next) : -1;
  const done = task.status === "COMPLETE";
  const parked = isPostLaunch(task.status);
  const [howOpen, setHowOpen] = useState<string | null>(null);

  return (
    <article
      className={cn(
        "flex w-72 shrink-0 snap-start flex-col border border-line bg-sheet p-4 lg:w-auto lg:min-w-44 lg:flex-1",
        waitingOn.length > 0 && !done && !parked && "bg-paper",
        parked && "border-dashed border-forest",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {index !== undefined ? <span className="block font-serif text-2xl tabular-nums text-olive">{String(index).padStart(2, "0")}</span> : null}
          <button type="button" onClick={() => setOpenTask(task.id)} className={cn("text-left font-serif text-2xl", done && "text-muted line-through", parked && "text-muted")}>
            {task.title}
          </button>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <button
            type="button"
            aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
            onClick={() => updateTask(task.id, { status: done ? "IN PROGRESS" : "COMPLETE" })}
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center border",
              done ? "border-forest bg-forest text-paper" : parked ? "border-dashed border-forest bg-paper text-forest" : "border-line bg-paper",
            )}
            title={parked ? "Post launch. Check to mark it fully complete." : undefined}
          >
            {parked ? <Clock className="size-4" /> : <Check className="size-4" />}
          </button>
          <DeleteButton compact label={`Delete ${task.title}`} onConfirm={() => removeTask(task.id)} />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <PriorityChip priority={task.priority} />
        <StatusChip status={task.status} />
      </div>
      {task.due ? <p className="mt-2 text-xs tracking-widest text-muted">Due {prettyDate(task.due)}</p> : null}
      <div className="mt-3 flex gap-1" aria-hidden="true">
        {steps.map((item) => (
          <span key={item.id} className={cn("h-1 flex-1", item.value.trim() ? "bg-forest" : "bg-cream")} />
        ))}
      </div>
      {waitingOn.length > 0 && !done && !parked ? (
        <p className="mt-3 text-xs tracking-widest text-olive">Starts after {waitingOn.map((item) => item.title).join(" · ")}</p>
      ) : null}
      {task.notes ? <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted">{task.notes}</p> : null}

      <ol className="mt-4 flex flex-col gap-3">
        {steps.map((item, at) => {
          const filled = Boolean(item.value.trim());
          const isNext = at === nextIndex;
          const later = !filled && nextIndex >= 0 && at > nextIndex;
          return (
            <li key={item.id} className={cn(later && "opacity-60 focus-within:opacity-100")}>
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
                {item.how?.length ? (
                  <button
                    type="button"
                    aria-expanded={howOpen === item.id}
                    onClick={(event) => {
                      event.preventDefault();
                      setHowOpen(howOpen === item.id ? null : item.id);
                    }}
                    className="ml-auto -my-3 flex h-11 items-center px-2 text-xs tracking-widest text-olive underline underline-offset-4"
                  >
                    {howOpen === item.id ? "Hide" : "How"}
                  </button>
                ) : null}
              </label>
              {howOpen === item.id && item.how ? <HowList steps={item.how} /> : null}
              <div className="mt-1 flex gap-1">
              <input
                id={`${task.id}-${item.id}`}
                value={item.value}
                onChange={(event) => updateStep(task.id, item.id, event.target.value)}
                placeholder={item.hint}
                title={item.hint}
                className={cn(
                  "h-11 w-full min-w-0 border bg-paper px-2 text-sm text-ink placeholder:text-muted",
                  isNext ? "border-forest" : "border-line",
                )}
              />
              <DeleteButton compact label={`Delete field ${item.label}`} onConfirm={() => removeStep(task.id, item.id)} />
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

/** Stepped tasks laid out side by side, scrolling sideways when they don't fit. */
export function StepTrackRow({ tasks, numbered }: { tasks: Task[]; numbered?: boolean }) {
  return (
    <div className="-mx-4 flex snap-x items-start gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0">
      {tasks.map((task, at) => (
        <StepTrack key={task.id} task={task} index={numbered ? at + 1 : undefined} />
      ))}
    </div>
  );
}

/** The numbered how-to for one field. */
export function HowList({ steps }: { steps: string[] }) {
  return (
    <ol className="mt-2 list-decimal space-y-1 border-l-2 border-olive bg-paper py-2 pl-7 pr-2 text-sm leading-relaxed text-ink">
      {steps.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ol>
  );
}
