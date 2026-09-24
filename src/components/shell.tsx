import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Plus, Search, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { WORKSTREAM_LABEL, type Workstream } from "@/lib/peculiar/types";
import { usePeculiar, PECULIAR_STORAGE_KEY } from "@/lib/peculiar/store";
import { LifeHubBridge } from "@/components/life-hub-bridge";
import { TaskDrawer } from "@/components/task-drawer";

const NAV: { href: string; label: string; group: string }[] = [
  { href: "/company", label: "Company", group: "Operate" },
  { href: "/decisions", label: "Decisions", group: "Operate" },
  { href: "/research", label: "Research", group: "Operate" },
  { href: "/product-lab", label: "Product Lab", group: "Make" },
  { href: "/inventory", label: "Inventory", group: "Make" },
  { href: "/tests", label: "Burn tests", group: "Make" },
  { href: "/brand", label: "Brand", group: "Make" },
  { href: "/commerce", label: "Commerce", group: "Sell" },
  { href: "/costs", label: "Costs", group: "Sell" },
  { href: "/suppliers", label: "Suppliers", group: "Sell" },
  { href: "/launch", label: "Launch", group: "Sell" },
  { href: "/content", label: "Content", group: "Sell" },
  { href: "/documents", label: "Documents", group: "Record" },
];

const GROUPS = ["Operate", "Make", "Sell", "Record"];
const OVERVIEW = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/acquiring", label: "Acquiring" },
];

function workstreamFor(path: string): Workstream {
  if (path.startsWith("/company")) return "company";
  if (path.startsWith("/brand")) return "brand";
  if (path.startsWith("/commerce") || path.startsWith("/acquiring") || path.startsWith("/suppliers") || path.startsWith("/costs")) return "commerce";
  if (path.startsWith("/launch") || path.startsWith("/content")) return "launch";
  if (path.startsWith("/research") || path.startsWith("/decisions") || path.startsWith("/documents")) return "research";
  return "product-lab";
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const startDraft = usePeculiar((s) => s.startDraft);

  useEffect(() => {
    void usePeculiar.persist.rehydrate();
    // Another tab (or Life Hub's embedded copy) saved changes — reload them before this tab can
    // save its older copy over them.
    const onStorage = (event: StorageEvent) => {
      if (event.key === PECULIAR_STORAGE_KEY) void usePeculiar.persist.rehydrate();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    setMenu(false);
  }, [path]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (event.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (event.key === "/" || ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k")) {
        event.preventDefault();
        setSearch(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <LifeHubBridge />
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-forest text-paper md:flex">
          <Brand />
          <Nav path={path} />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-paper px-4 md:px-8">
            <button
              type="button"
              className="flex h-11 w-11 items-center justify-center md:hidden"
              aria-label="Open navigation"
              onClick={() => setMenu(true)}
            >
              <Menu className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => setSearch(true)}
              className="flex h-11 min-w-0 flex-1 items-center gap-2 border border-line bg-sheet px-3 text-left text-sm text-muted md:max-w-sm"
            >
              <Search className="size-4 shrink-0" />
              <span className="truncate">Search the studio</span>
            </button>
            <button
              type="button"
              className="flex h-11 items-center gap-2 bg-forest px-3 text-sm text-paper"
              onClick={() => startDraft({ workstream: workstreamFor(path) })}
            >
              <Plus className="size-4" />
              <span className="hidden sm:inline">Add task</span>
            </button>
            <span className="hidden text-xs tracking-widest text-olive lg:inline">Pre-launch</span>
          </header>
          <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-10">{children}</main>
        </div>
      </div>
      {menu ? <MobileNav path={path} onClose={() => setMenu(false)} /> : null}
      {search ? <SearchDialog onClose={() => setSearch(false)} /> : null}
      <TaskDrawer />
    </div>
  );
}

function Brand() {
  return (
    <div className="border-b border-paper/15 px-5 py-6">
      <p className="font-serif text-2xl tracking-wide">Peculiar</p>
      <p className="mt-1 text-xs tracking-widest text-paper/70">Command Center</p>
    </div>
  );
}

function Nav({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4">
      <div className="mb-4">
        {OVERVIEW.map((item) => (
          <NavLink key={item.href} item={item} path={path} onNavigate={onNavigate} />
        ))}
      </div>
      {GROUPS.map((group) => (
        <div key={group} className="mb-4">
          <p className="px-2 pb-1 text-xs tracking-widest text-paper/50">{group}</p>
          {NAV.filter((item) => item.group === group).map((item) => (
            <NavLink key={item.href} item={item} path={path} onNavigate={onNavigate} />
          ))}
        </div>
      ))}
    </nav>
  );
}

function NavLink({
  item,
  path,
  onNavigate,
}: {
  item: { href: string; label: string };
  path: string;
  onNavigate?: () => void;
}) {
  const active = path === item.href;
  return (
    <Link
      to={item.href}
      onClick={onNavigate}
      className={cn("flex h-11 items-center px-2 text-sm text-paper/80", active && "bg-paper/10 text-paper")}
    >
      {item.label}
    </Link>
  );
}

function MobileNav({ path, onClose }: { path: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-forest text-paper md:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <p className="font-serif text-xl">Peculiar</p>
        <button type="button" className="flex h-11 w-11 items-center justify-center" aria-label="Close navigation" onClick={onClose}>
          <X className="size-5" />
        </button>
      </div>
      <Nav path={path} onNavigate={onClose} />
    </div>
  );
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const tasks = usePeculiar((s) => s.tasks);
  const decisions = usePeculiar((s) => s.decisions);
  const experiments = usePeculiar((s) => s.experiments);
  const suppliers = usePeculiar((s) => s.suppliers);
  const questions = usePeculiar((s) => s.questions);
  const documents = usePeculiar((s) => s.documents);
  const scents = usePeculiar((s) => s.scents);
  const acquisitions = usePeculiar((s) => s.acquisitions);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: { href: string; label: string; meta: string }[] = [];
    const hit = (text: string) => !q || text.toLowerCase().includes(q);
    for (const task of tasks) {
      if (hit(task.title)) items.push({ href: "/dashboard", label: task.title, meta: `Task · ${WORKSTREAM_LABEL[task.workstream]}` });
    }
    for (const decision of decisions) {
      if (hit(decision.decision)) items.push({ href: "/decisions", label: decision.decision, meta: "Decision" });
    }
    for (const experiment of experiments) {
      if (hit(experiment.name)) items.push({ href: "/product-lab", label: experiment.name, meta: "Experiment" });
    }
    for (const supplier of suppliers) {
      if (hit(`${supplier.name} ${supplier.product} ${supplier.category}`)) {
        items.push({ href: "/suppliers", label: `${supplier.category}: ${supplier.name}`, meta: supplier.product });
      }
    }
    for (const question of questions) {
      if (hit(question.question)) items.push({ href: "/research", label: question.question, meta: "Open question" });
    }
    for (const doc of documents) {
      if (hit(doc.title)) items.push({ href: "/documents", label: doc.title, meta: "Document" });
    }
    for (const scent of scents) {
      if (hit(`${scent.slot} ${scent.role} ${scent.workingName} ${scent.inspiration}`)) {
        items.push({ href: "/product-lab", label: `Scent ${scent.slot} ${scent.workingName || scent.role}`, meta: "Scent lab" });
      }
    }
    for (const item of acquisitions) {
      if (hit(`${item.name} ${item.category} ${item.purpose}`)) {
        items.push({ href: "/acquiring", label: item.name, meta: `Acquiring · ${item.category}` });
      }
    }
    return items.slice(0, 12);
  }, [query, tasks, decisions, experiments, suppliers, questions, documents, scents, acquisitions]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 px-4 pt-16" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="w-full max-w-xl border border-line bg-sheet shadow-pop"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-line px-3">
          <Search className="size-4 text-muted" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") onClose();
            }}
            placeholder="Tasks, decisions, scents, suppliers"
            className="h-12 w-full bg-transparent text-sm text-ink outline-none"
          />
          <button type="button" className="flex h-11 w-11 items-center justify-center" aria-label="Close search" onClick={onClose}>
            <X className="size-4" />
          </button>
        </div>
        <ul className="max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted">Nothing matches.</li>
          ) : (
            results.map((item) => (
              <li key={`${item.meta}-${item.label}`}>
                <Link to={item.href} onClick={onClose} className="block border-b border-line px-4 py-3 hover:bg-cream">
                  <span className="block text-sm text-ink">{item.label}</span>
                  <span className="text-xs tracking-widest text-muted">{item.meta}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
