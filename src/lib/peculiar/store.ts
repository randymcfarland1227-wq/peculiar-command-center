import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { seedData } from "./seed";
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
  Vessel,
  Acquisition,
} from "./types";

interface UiState {
  openTaskId: string | null;
  draft: Task | null;
}

interface Actions {
  updateTask: (id: string, patch: Partial<Task>) => void;
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
      name: "peculiar-command-center-v1",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<Store>;
        return {
          ...current,
          ...saved,
          acquisitions: mergeAcquisitions(saved.acquisitions, current.acquisitions),
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

export function variableCost(row: Store["economics"][number]) {
  return Object.values(row.lines).reduce((sum, cell) => sum + (Number(cell.amount) || 0), 0);
}

export function countComplete(tasks: Task[]) {
  const total = tasks.length;
  const done = tasks.filter((task) => task.status === "COMPLETE").length;
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
