/** Life Hub postMessage bridge — source id `candle`. See frontier LIFE_HUB.md. */

import { WORKSTREAM_LABEL, type PeculiarData, type Task } from "@/lib/peculiar/types";

/** Allowed Life Hub parent origins (GitHub Pages primary + legacy Worker). */
export const LIFE_HUB_ORIGINS = [
  "https://randymcfarland1227-wq.github.io",
  "https://frontier-work-room.randymcfarland1227.workers.dev",
] as const;
export const LIFE_HUB_ORIGIN = LIFE_HUB_ORIGINS[0];
export const CANDLE_SOURCE = "candle" as const;
const ORIGIN_URL = "https://randymcfarland1227-wq.github.io/peculiar-command-center/";
const STAR_KEY = "peculiar-candle.lifeHubStars";

export function isLifeHubOrigin(origin: string) {
  return (LIFE_HUB_ORIGINS as readonly string[]).includes(origin);
}

export type LifeHubFeatured = {
  id: string;
  title: string;
  detail: string;
  meta: string;
  originUrl?: string;
  completable?: boolean;
};

export type LifeHubTask = {
  id: string;
  title: string;
  detail?: string;
  status?: string;
  due?: string;
  starred?: boolean;
  originUrl?: string;
};

export type LifeHubSnapshot = {
  source: typeof CANDLE_SOURCE;
  metrics: Record<string, number>;
  featured: LifeHubFeatured[];
  tasks: LifeHubTask[];
  refreshedAt: string;
};

type StarStore = Record<string, boolean>;

function readStars(): StarStore {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STAR_KEY) || "{}") as StarStore;
  } catch {
    return {};
  }
}

function writeStars(stars: StarStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STAR_KEY, JSON.stringify(stars));
}

export function isCandleStarred(id: string) {
  return Boolean(readStars()[id]);
}

export function setCandleStarred(id: string, starred: boolean) {
  const stars = readStars();
  if (starred) stars[id] = true;
  else delete stars[id];
  writeStars(stars);
}

function isOpenTask(task: Task) {
  return task.status !== "COMPLETE";
}

function taskStatusLabel(task: Task) {
  if (task.status === "BLOCKED" || task.status === "WAITING") return "blocked";
  return "open";
}

function taskMeta(task: Task) {
  const stream = WORKSTREAM_LABEL[task.workstream] || task.workstream;
  return task.section ? `${stream} · ${task.section}` : stream;
}

/** Snapshot slice the bridge needs from the Peculiar store. */
export type CandleBridgeData = Pick<PeculiarData, "tasks" | "vessels" | "skus">;

export function buildCandleSnapshot(data: CandleBridgeData): LifeHubSnapshot {
  const stars = readStars();
  const open = data.tasks.filter(isOpenTask);
  const openStudioTasks = open.length;
  const acceptedVessels = data.vessels.filter((v) => v.acceptance === "Accepted").length;
  const skusDefined = data.skus.length;

  const tasks: LifeHubTask[] = open.map((task) => ({
    id: task.id,
    title: task.title,
    detail: task.notes || undefined,
    status: taskStatusLabel(task),
    due: task.due || undefined,
    starred: Boolean(stars[task.id]),
    originUrl: ORIGIN_URL,
  }));

  const featured: LifeHubFeatured[] = open
    .filter((task) => stars[task.id])
    .map((task) => ({
      id: task.id,
      title: task.title,
      detail: task.notes || taskMeta(task),
      meta: taskMeta(task),
      originUrl: ORIGIN_URL,
      completable: true,
    }));

  return {
    source: CANDLE_SOURCE,
    metrics: {
      openStudioTasks,
      acceptedVessels,
      skusDefined,
    },
    featured,
    tasks,
    refreshedAt: new Date().toISOString(),
  };
}

export function postCandleSnapshot(
  data: CandleBridgeData,
  target?: MessageEventSource | null,
  origin: string = LIFE_HUB_ORIGIN,
) {
  const message = { type: "randys-workroom:snapshot" as const, payload: buildCandleSnapshot(data) };
  const fanout = origin === LIFE_HUB_ORIGIN ? [...LIFE_HUB_ORIGINS] : [origin];
  try {
    if (target && "postMessage" in target) {
      (target as Window).postMessage(message, { targetOrigin: origin });
    }
  } catch {
    /* ignore closed targets */
  }
  for (const o of fanout) {
    try {
      if (window.opener && !window.opener.closed) window.opener.postMessage(message, o);
    } catch {
      /* ignore */
    }
    try {
      if (window.parent !== window) window.parent.postMessage(message, o);
    } catch {
      /* ignore */
    }
  }
}

type BridgeHandlers = {
  getData: () => CandleBridgeData | null;
  completeTask: (id: string) => void | Promise<void>;
  onSnapshot?: () => void;
};

/** Listen for Life Hub request / complete / star. Returns cleanup. */
export function attachCandleLifeHubBridge(handlers: BridgeHandlers) {
  const onMessage = (event: MessageEvent) => {
    if (!isLifeHubOrigin(event.origin)) return;
    const type = event.data?.type;
    if (type === "randys-workroom:request") {
      const data = handlers.getData();
      if (data) postCandleSnapshot(data, event.source, event.origin);
      return;
    }
    const payload = event.data?.payload || {};
    if (payload.source && payload.source !== CANDLE_SOURCE) return;
    const id = String(payload.id || "");
    if (!id) return;

    if (type === "randys-workroom:star") {
      const want = typeof payload.starred === "boolean" ? payload.starred : !isCandleStarred(id);
      setCandleStarred(id, want);
      const data = handlers.getData();
      if (data) postCandleSnapshot(data, event.source, event.origin);
      handlers.onSnapshot?.();
      return;
    }

    if (type === "randys-workroom:complete") {
      const source = event.source;
      const origin = event.origin;
      void Promise.resolve(handlers.completeTask(id)).then(() => {
        setCandleStarred(id, false);
        const data = handlers.getData();
        if (data) postCandleSnapshot(data, source, origin);
        handlers.onSnapshot?.();
      });
    }
  };

  window.addEventListener("message", onMessage);
  return () => window.removeEventListener("message", onMessage);
}
