import { cn } from "@/lib/cn";
import type { DecisionStatus, Priority, TaskStatus } from "@/lib/peculiar/types";

const statusClass: Record<TaskStatus, string> = {
  "NOT STARTED": "bg-cream text-muted",
  PLANNING: "bg-cream text-ink",
  "IN PROGRESS": "bg-sage/30 text-forest",
  WAITING: "border border-olive bg-sheet text-olive",
  TESTING: "bg-sage/30 text-forest",
  DECIDED: "bg-forest text-paper",
  ORDERED: "bg-olive text-paper",
  COMPLETE: "bg-forest text-paper",
  BLOCKED: "bg-olive text-paper",
};

export function StatusChip({ status }: { status: TaskStatus }) {
  return (
    <span className={cn("inline-flex h-6 items-center px-2 text-xs tracking-widest", statusClass[status])}>
      {status}
    </span>
  );
}

const decisionClass: Record<DecisionStatus, string> = {
  DECIDED: "bg-forest text-paper",
  "WORKING ASSUMPTION": "bg-cream text-ink",
  SUPERSEDED: "border border-line bg-sheet text-muted line-through",
};

export function DecisionChip({ status }: { status: DecisionStatus }) {
  return (
    <span className={cn("inline-flex h-6 items-center px-2 text-xs tracking-widest", decisionClass[status])}>
      {status}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: Priority }) {
  const cls =
    priority === "NOW"
      ? "bg-forest text-paper"
      : priority === "NEXT"
        ? "bg-cream text-ink"
        : "border border-line text-muted";
  return <span className={cn("inline-flex h-6 items-center px-2 text-xs tracking-widest", cls)}>{priority}</span>;
}

export function SourceChip({ source }: { source: "ESTIMATE" | "QUOTE" | "ACTUAL" }) {
  const cls =
    source === "ACTUAL" ? "bg-forest text-paper" : source === "QUOTE" ? "bg-olive text-paper" : "bg-cream text-ink";
  return <span className={cn("inline-flex h-6 items-center px-2 text-xs tracking-widest", cls)}>{source}</span>;
}
