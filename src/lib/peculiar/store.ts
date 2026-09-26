import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { productLabTracks, seedData } from "./seed";
import type {
  Blocker,
  BudgetLine,
  BurnTest,
  ContentItem,
  CostKey,
  Decision,
  DocLink,
  Experiment,
  LaunchSku,
  MoneyCell,
  PeculiarData,
  ResearchQuestion,
  Scent,
  Size,
  Supplier,
  Task,
  TaskStatus,
  TaskStep,
  Vessel,
  Acquisition,
} from "./types";

interface UiState {
  openTaskId: string | null;
  draft: Task | null;
}

interface Actions {
  updateTask: (id: string, patch: Partial<Task>) => void;
  updateStep: (taskId: string, stepId: string, value: string) => void;
  addTask: (task: Task) => void;
  removeTask: (id: string) => void;
  startDraft: (partial?: Partial<Task>) => void;
  updateDraft: (patch: Partial<Task>) => void;
  commitDraft: () => void;
  cancelDraft: () => void;
  setOpenTask: (id: string | null) => void;
  updateDecision: (id: string, patch: Partial<Decision>) => void;
  addDecision: (decision: Decision) => void;
  removeDecision: (id: string) => void;
  updateExperiment: (id: string, patch: Partial<Experiment>) => void;
  updateScent: (slot: string, patch: Partial<Scent>) => void;
  updateVessel: (id: string, patch: Partial<Vessel>) => void;
  addVessel: (vessel: Vessel) => void;
  removeVessel: (id: string) => void;
  updateTest: (id: string, patch: Partial<BurnTest>) => void;
  addTest: (test: BurnTest) => void;
  removeTest: (id: string) => void;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  addSupplier: (supplier: Supplier) => void;
  removeSupplier: (id: string) => void;
  setCost: (size: Size, key: "retail" | CostKey, patch: Partial<MoneyCell>) => void;
  updateBudget: (id: string, patch: Partial<BudgetLine>) => void;
  updateSku: (id: string, patch: Partial<LaunchSku>) => void;
  updateContent: (id: string, patch: Partial<ContentItem>) => void;
  addContent: (item: ContentItem) => void;
  removeContent: (id: string) => void;
  updateQuestion: (id: string, patch: Partial<ResearchQuestion>) => void;
  addQuestion: (question: ResearchQuestion) => void;
  removeQuestion: (id: string) => void;
  updateDocument: (id: string, patch: Partial<DocLink>) => void;
  updateBlocker: (id: string, patch: Partial<Blocker>) => void;
  addBlocker: (blocker: Blocker) => void;
  updateAcquisition: (id: string, patch: Partial<Acquisition>) => void;
  addAcquisition: (item: Acquisition) => void;
  removeAcquisition: (id: string) => void;
  reset: () => void;
}

export type Store = PeculiarData & UiState & Actions;

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function blankTask(partial: Partial<Task> = {}): Task {
  return {
    id: uid("t"),
    title: "",
    workstream: "product-lab",
    status: "NOT STARTED",
    priority: "NEXT",
    section: "General",
    due: "",
    notes: "",
    dependencies: "",
    link: "",
    cost: "",
    owner: "Founder",
    completedDate: "",
    relatedExperiment: "",
    relatedSupplier: "",
    relatedDocument: "",
    launchArea: "",
    ...partial,
  };
}

function withComplete(task: Task, patch: Partial<Task>): Task {
  const next = { ...task, ...patch };
  if (patch.status === "COMPLETE") {
    next.completedDate = task.completedDate || today();
  } else if (patch.status) {
    next.completedDate = "";
  }
  return next;
}

const dataKeys: (keyof PeculiarData)[] = [
  "tasks",
  "decisions",
  "experiments",
  "scents",
  "vessels",
  "tests",
  "suppliers",
  "economics",
  "budget",
  "skus",
  "content",
  "questions",
  "documents",
  "blockers",
  "acquisitions",
];

/** localStorage key for the studio data (shared with Life Hub's embedded copy). */
export const PECULIAR_STORAGE_KEY = "peculiar-command-center-v1";

export const usePeculiar = create<Store>()(
  persist(
    (set) => ({
      ...seedData(),
      openTaskId: null,
      draft: null,
      updateTask: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((task) => (task.id === id ? withComplete(task, patch) : task)),
        })),
      updateStep: (taskId, stepId, value) =>
        set((s) => ({
          tasks: s.tasks.map((task) => {
            if (task.id !== taskId || !task.steps) return task;
            const steps = task.steps.map((item) => (item.id === stepId ? { ...item, value } : item));
            return withComplete({ ...task, steps }, { status: statusFromSteps(task.status, steps) });
          }),
        })),
      addTask: (task) => set((s) => ({ tasks: [task, ...s.tasks], draft: null, openTaskId: task.id })),
      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((task) => task.id !== id),
          openTaskId: s.openTaskId === id ? null : s.openTaskId,
        })),
      startDraft: (partial) => set({ draft: blankTask(partial), openTaskId: null }),
      updateDraft: (patch) =>
        set((s) => ({ draft: s.draft ? { ...s.draft, ...patch } : s.draft })),
      commitDraft: () =>
        set((s) => {
          if (!s.draft || !s.draft.title.trim()) return s;
          const task = withComplete(s.draft, {});
          return { tasks: [task, ...s.tasks], draft: null, openTaskId: null };
        }),
      cancelDraft: () => set({ draft: null }),
      setOpenTask: (id) => set({ openTaskId: id, draft: null }),
      updateDecision: (id, patch) =>
        set((s) => ({
          decisions: s.decisions.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addDecision: (decision) => set((s) => ({ decisions: [decision, ...s.decisions] })),
      removeDecision: (id) => set((s) => ({ decisions: s.decisions.filter((item) => item.id !== id) })),
      updateExperiment: (id, patch) =>
        set((s) => ({
          experiments: s.experiments.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      updateScent: (slot, patch) =>
        set((s) => ({
          scents: s.scents.map((item) => (item.slot === slot ? { ...item, ...patch } : item)),
        })),
      updateVessel: (id, patch) =>
        set((s) => ({
          vessels: s.vessels.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addVessel: (vessel) => set((s) => ({ vessels: [vessel, ...s.vessels] })),
      removeVessel: (id) => set((s) => ({ vessels: s.vessels.filter((item) => item.id !== id) })),
      updateTest: (id, patch) =>
        set((s) => ({
          tests: s.tests.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addTest: (test) => set((s) => ({ tests: [test, ...s.tests] })),
      removeTest: (id) => set((s) => ({ tests: s.tests.filter((item) => item.id !== id) })),
      updateSupplier: (id, patch) =>
        set((s) => ({
          suppliers: s.suppliers.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addSupplier: (supplier) => set((s) => ({ suppliers: [supplier, ...s.suppliers] })),
      removeSupplier: (id) => set((s) => ({ suppliers: s.suppliers.filter((item) => item.id !== id) })),
      setCost: (size, key, patch) =>
        set((s) => ({
          economics: s.economics.map((row) => {
            if (row.size !== size) return row;
            if (key === "retail") return { ...row, retail: { ...row.retail, ...patch } };
            return { ...row, lines: { ...row.lines, [key]: { ...row.lines[key], ...patch } } };
          }),
        })),
      updateBudget: (id, patch) =>
        set((s) => ({
          budget: s.budget.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      updateSku: (id, patch) =>
        set((s) => ({
          skus: s.skus.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      updateContent: (id, patch) =>
        set((s) => ({
          content: s.content.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addContent: (item) => set((s) => ({ content: [item, ...s.content] })),
      removeContent: (id) => set((s) => ({ content: s.content.filter((item) => item.id !== id) })),
      updateQuestion: (id, patch) =>
        set((s) => ({
          questions: s.questions.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addQuestion: (question) => set((s) => ({ questions: [question, ...s.questions] })),
      removeQuestion: (id) => set((s) => ({ questions: s.questions.filter((item) => item.id !== id) })),
      updateDocument: (id, patch) =>
        set((s) => ({
          documents: s.documents.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      updateBlocker: (id, patch) =>
        set((s) => ({
          blockers: s.blockers.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addBlocker: (blocker) => set((s) => ({ blockers: [blocker, ...s.blockers] })),
      updateAcquisition: (id, patch) =>
        set((s) => ({
          acquisitions: s.acquisitions.map((item) => (item.id === id ? { ...item, ...patch } : item)),
        })),
      addAcquisition: (item) => set((s) => ({ acquisitions: [item, ...s.acquisitions] })),
      removeAcquisition: (id) => set((s) => ({ acquisitions: s.acquisitions.filter((item) => item.id !== id) })),
      reset: () => set({ ...seedData(), openTaskId: null, draft: null }),
    }),
    {
      name: PECULIAR_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Store>;
        return {
          ...current,
          ...saved,
          acquisitions: mergeAcquisitions(saved.acquisitions, current.acquisitions),
          tasks: mergeProductLabTracks(saved.tasks, current.tasks),
          scents: mergeScents(saved.scents, current.scents),
        };
      },
      partialize: (state) => {
        const data: Partial<PeculiarData> = {};
        for (const key of dataKeys) data[key] = state[key] as never;
        return data as Store;
      },
    },
  ),
);

/** A stepped task is complete once every field is filled, and in progress once any is. */
function statusFromSteps(current: TaskStatus, steps: TaskStep[]): TaskStatus {
  const filled = steps.filter((item) => item.value.trim()).length;
  if (filled === steps.length) return "COMPLETE";
  if (current === "COMPLETE") return "IN PROGRESS";
  if (filled > 0 && (current === "NOT STARTED" || current === "PLANNING")) return "IN PROGRESS";
  return current;
}

/** Notes the old seed shipped with. Their content now lives in the step hints. */
const ORIGINAL_STEP_NOTES = new Set([
  "Places, memories, objects, atmospheres. Not vanilla, lavender, lemon, or sandalwood.",
  "6% by wax weight is only the starting test point.",
  "Classify by fill range, diameter, and profile. Example rows in Inventory are placeholders until measured.",
]);

/**
 * Folds the old one-task-per-step Product Lab lists (p1–p35) into the five stepped tasks.
 * A step the old list had checked off keeps its notes as the entry, or "Done".
 * Notes on steps still open move into the new task's notes so nothing is lost.
 */
function mergeProductLabTracks(saved: Task[] | undefined, fresh: Task[]): Task[] {
  if (!Array.isArray(saved)) return fresh;
  const tracks = productLabTracks();
  if (saved.some((task) => task.id === tracks[0].id)) return saved;
  const old = new Map(saved.map((task) => [task.id, task]));
  const oldIds = new Set(tracks.flatMap((track) => track.steps?.map((item) => item.id) ?? []));
  const migrated = tracks.map((track) => {
    const carried: string[] = [];
    const steps = (track.steps ?? []).map((item) => {
      const was = old.get(item.id);
      if (!was) return item;
      if (was.status === "COMPLETE") return { ...item, value: was.notes.trim() || "Done" };
      if (was.notes.trim() && !ORIGINAL_STEP_NOTES.has(was.notes.trim())) carried.push(`${item.label}: ${was.notes.trim()}`);
      return item;
    });
    const notes = [track.notes, ...carried].filter(Boolean).join("\n");
    return withComplete({ ...track, steps, notes }, { status: statusFromSteps(track.status, steps) });
  });
  const firstAt = saved.findIndex((task) => oldIds.has(task.id));
  const kept = saved.filter((task) => !oldIds.has(task.id));
  const at = firstAt < 0 ? kept.length : saved.slice(0, firstAt).filter((task) => !oldIds.has(task.id)).length;
  return [...kept.slice(0, at), ...migrated, ...kept.slice(at)];
}

function mergeAcquisitions(saved: Acquisition[] | undefined, fresh: Acquisition[]): Acquisition[] {
  if (!Array.isArray(saved)) return fresh;
  const seedById = new Map(fresh.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const merged = saved.map((item) => {
    seen.add(item.id);
    const seed = seedById.get(item.id);
    const filled: Acquisition = {
      ...item,
      price: item.price ?? "",
      thoughts: item.thoughts ?? "",
      details: item.details || item.notes || "",
      notes: item.notes ?? "",
    };
    if (!seed || item.url || item.status !== "NEED") return filled;
    return { ...filled, name: seed.name, category: seed.category, purpose: seed.purpose, details: filled.details || seed.details };
  });
  for (const item of fresh) {
    if (!seen.has(item.id)) merged.push(item);
  }
  return merged;
}

/** Roles from the original seed. A saved slot still carrying one (and no name) gets the current concept. */
const ORIGINAL_SCENT_ROLES: Record<string, string> = {
  "01": "Bright / Fresh",
  "02": "Green / Botanical",
  "03": "Woody / Dark",
  "04": "Warm / Gourmand",
  "05": "Clean / Atmospheric",
  "06": "Experimental / Seasonal",
};

function mergeScents(saved: Scent[] | undefined, fresh: Scent[]): Scent[] {
  if (!Array.isArray(saved)) return fresh;
  const seedBySlot = new Map(fresh.map((item) => [item.slot, item]));
  return saved.map((item) => {
    const seed = seedBySlot.get(item.slot);
    if (!seed || item.workingName || item.role !== ORIGINAL_SCENT_ROLES[item.slot]) return item;
    const { workingName, role, mood, inspiration, notes } = seed;
    return { ...item, workingName, role, mood, inspiration, notes };
  });
}

export function variableCost(row: Store["economics"][number]) {
  return Object.values(row.lines).reduce((sum, cell) => sum + (Number(cell.amount) || 0), 0);
}

/** Filled fields out of all fields on a stepped task, and the first one still open. */
export function stepProgress(task: Task) {
  const steps = task.steps ?? [];
  const done = steps.filter((item) => item.value.trim()).length;
  const next = steps.find((item) => !item.value.trim()) ?? null;
  return { done, total: steps.length, next };
}

/** Each field of a stepped task counts as one unit, so a half-filled component shows as half done. */
export function countComplete(tasks: Task[]) {
  let total = 0;
  let done = 0;
  for (const task of tasks) {
    if (task.steps?.length) {
      const progress = stepProgress(task);
      total += progress.total;
      done += task.status === "COMPLETE" ? progress.total : progress.done;
    } else {
      total += 1;
      if (task.status === "COMPLETE") done += 1;
    }
  }
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 };
}

export function nextActions(tasks: Task[], limit = 5) {
  const rank = { NOW: 0, NEXT: 1, LATER: 2 };
  return tasks
    .filter((task) => task.status !== "COMPLETE" && task.priority !== "LATER")
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
