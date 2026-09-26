import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { prettyDate } from "@/lib/peculiar/format";
import { usePeculiar } from "@/lib/peculiar/store";
import { PRIORITIES, STATUSES, WORKSTREAM_LABEL, type Priority, type Task, type TaskStatus } from "@/lib/peculiar/types";
import { PriorityChip, StatusChip } from "@/components/status-chip";
import { StepTrackRow } from "@/components/step-track";
import { DeleteButton } from "@/components/fields";

export function TaskList({ tasks, empty }: { tasks: Task[]; empty?: string }) {
  const [scope, setScope] = useState<"active" | "all">("active");
  const [priority, setPriority] = useState<"ALL" | Priority>("ALL");
  const [status, setStatus] = useState<"ALL" | TaskStatus>("ALL");
  const [query, setQuery] = useState("");
  const updateTask = usePeculiar((s) => s.updateTask);
  const setOpenTask = usePeculiar((s) => s.setOpenTask);
  const removeTask = usePeculiar((s) => s.removeTask);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks
      .filter((task) => {
        if (scope === "active" && (task.priority === "LATER" || task.status === "COMPLETE")) return false;
        if (priority !== "ALL" && task.priority !== priority) return false;
        if (status !== "ALL" && task.status !== status) return false;
        if (q && !`${task.title} ${task.notes} ${task.section}`.toLowerCase().includes(q)) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        const rank = { NOW: 0, NEXT: 1, LATER: 2 };
        return rank[a.priority] - rank[b.priority] || a.section.localeCompare(b.section);
      });
  }, [tasks, scope, priority, status, query]);

  const groups = new Map<string, Task[]>();
  for (const task of shown) {
    const list = groups.get(task.section) ?? [];
    list.push(task);
    groups.set(task.section, list);
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter tasks"
          className="h-11 w-full border border-line bg-sheet px-3 text-sm sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-2">
          <Filter on={scope === "active"} onClick={() => setScope("active")}>
            Now and next
          </Filter>
          <Filter on={scope === "all"} onClick={() => setScope("all")}>
            Full list
          </Filter>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as typeof priority)}
            className="h-11 border border-line bg-sheet px-2 text-sm"
            aria-label="Priority"
          >
            <option value="ALL">Any priority</option>
            {PRIORITIES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="h-11 border border-line bg-sheet px-2 text-sm"
            aria-label="Status"
          >
            <option value="ALL">Any status</option>
            {STATUSES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="border border-dashed border-line px-4 py-8 text-sm text-muted">
          {empty ?? "Nothing in this view. Open the full list, or add a task."}
        </p>
      ) : (
        [...groups.entries()].map(([section, items]) => (
          <section key={section} className="mb-6">
            <h3 className="mb-2 text-xs tracking-widest text-olive">{section}</h3>
            {items.some((task) => task.steps?.length) ? (
              <div className="mb-3">
                <StepTrackRow tasks={items.filter((task) => task.steps?.length)} />
              </div>
            ) : null}
            <ul className="border-t border-line">
              {items.filter((task) => !task.steps?.length).map((task) => (
                <li key={task.id} className="grid grid-cols-[auto_1fr_auto] items-start gap-3 border-b border-line py-3">
                  <button
                    type="button"
                    aria-label={task.status === "COMPLETE" ? `Reopen ${task.title}` : `Complete ${task.title}`}
                    onClick={() =>
                      updateTask(task.id, { status: task.status === "COMPLETE" ? "IN PROGRESS" : "COMPLETE" })
                    }
                    className={cn(
                      "mt-1 flex h-11 w-11 items-center justify-center border",
                      task.status === "COMPLETE" ? "border-forest bg-forest text-paper" : "border-line bg-sheet",
                    )}
                  >
                    <Check className="size-4" />
                  </button>
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => setOpenTask(task.id)}
                      className={cn(
                        "text-left font-serif text-xl leading-snug",
                        task.status === "COMPLETE" && "text-muted line-through",
                      )}
                    >
                      {task.title}
                    </button>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <PriorityChip priority={task.priority} />
                      <StatusChip status={task.status} />
                      <span className="text-xs tracking-widest text-muted">{WORKSTREAM_LABEL[task.workstream]}</span>
                      {task.due ? <span className="text-xs tracking-widest text-muted">Due {prettyDate(task.due)}</span> : null}
                    </div>
                    {task.notes ? <p className="mt-2 text-sm leading-relaxed text-muted">{task.notes}</p> : null}
                  </div>
                  <DeleteButton compact className="mt-1" label={`Delete ${task.title}`} onConfirm={() => removeTask(task.id)} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function Filter({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("h-11 px-3 text-sm", on ? "bg-forest text-paper" : "border border-line bg-sheet text-ink")}
    >
      {children}
    </button>
  );
}
