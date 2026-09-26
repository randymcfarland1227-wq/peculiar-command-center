import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { countComplete, stepProgress, usePeculiar } from "@/lib/peculiar/store";
import type { Decision, Experiment, Task } from "@/lib/peculiar/types";
import { DecisionChip, StatusChip } from "@/components/status-chip";
import { DeleteButton } from "@/components/fields";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const tasks = usePeculiar((s) => s.tasks);
  const decisions = usePeculiar((s) => s.decisions);
  const experiments = usePeculiar((s) => s.experiments);
  const scents = usePeculiar((s) => s.scents);
  const vessels = usePeculiar((s) => s.vessels);
  const tests = usePeculiar((s) => s.tests);
  const suppliers = usePeculiar((s) => s.suppliers);
  const content = usePeculiar((s) => s.content);
  const questions = usePeculiar((s) => s.questions);
  const economics = usePeculiar((s) => s.economics);
  const removeQuestion = usePeculiar((s) => s.removeQuestion);
  const removeScent = usePeculiar((s) => s.removeScent);
  const removeSupplier = usePeculiar((s) => s.removeSupplier);

  const company = tasks.filter((task) => task.workstream === "company");
  const research = tasks.filter((task) => task.workstream === "research");
  const lab = tasks.filter((task) => task.workstream === "product-lab");
  const brand = tasks.filter((task) => task.workstream === "brand");
  const commerce = tasks.filter((task) => task.workstream === "commerce");
  const launch = tasks.filter((task) => task.workstream === "launch");

  const operate = countComplete([...company, ...research]);
  const make = countComplete([...lab, ...brand]);
  const sell = countComplete([...commerce, ...launch]);

  const [view, setView] = useState<"dashboard" | "data">("dashboard");
  useEffect(() => {
    const sync = () => setView(window.location.hash === "#data" ? "data" : "dashboard");
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  const choose = (next: "dashboard" | "data") => {
    setView(next);
    window.history.replaceState(null, "", next === "data" ? "#data" : window.location.pathname + window.location.search);
  };

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs tracking-widest text-olive">Overview</p>
        <h1 className="mt-2 font-serif text-4xl text-ink md:text-5xl">Command Center</h1>
        <div className="mt-4 inline-flex border border-line" role="tablist" aria-label="Overview view">
          {(
            [
              ["dashboard", "Dashboard"],
              ["data", "Data"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={view === key}
              onClick={() => choose(key)}
              className={cn("h-11 px-5 text-sm", view === key ? "bg-forest text-paper" : "bg-sheet text-ink")}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          {view === "dashboard"
            ? "The work still to do. Each percent is tasks marked complete, divided by every task in that group."
            : "What you have decided, measured, and sourced so far. Nothing here is a task."}
        </p>
      </header>

      {view === "dashboard" ? (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <Column title="Operate" count={operate}>
            <TaskBlock title="Company" href="/company" tasks={company} />
            <TaskBlock title="Research" href="/research" tasks={research} />
          </Column>
          <Column title="Make" count={make}>
            <TaskBlock title="Product Lab" href="/product-lab" tasks={lab} />
            <TaskBlock title="Brand" href="/brand" tasks={brand} />
          </Column>
          <Column title="Sell" count={sell}>
            <TaskBlock title="Commerce" href="/commerce" tasks={commerce} />
            <TaskBlock title="Launch" href="/launch" tasks={launch} />
            <article className="border border-line bg-sheet p-4">
              <BlockHead title="Content" href="/content" aside={`${content.filter((item) => item.status === "COMPLETE").length} of ${content.length}`} />
              <ul>
                {content.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 border-t border-line py-2 text-sm">
                    <span>{item.title}</span>
                    <StatusChip status={item.status} />
                  </li>
                ))}
              </ul>
            </article>
          </Column>
        </div>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <DataColumn title="Operate">
            <article className="border border-line bg-sheet p-4">
              <BlockHead title="Decisions" href="/decisions" aside={`${decisions.filter((item) => item.status === "DECIDED").length} decided`} />
              <ul className="mt-2">
                {decisions.slice(0, 8).map((item) => (
                  <DecisionLine key={item.id} item={item} />
                ))}
              </ul>
              {decisions.length > 8 ? (
                <Link to="/decisions" className="mt-2 inline-flex h-11 items-center text-sm text-olive">
                  {decisions.length - 8} more
                </Link>
              ) : null}
            </article>
            <article className="border border-line bg-sheet p-4">
              <BlockHead title="Open questions" href="/research" aside={`${questions.length}`} />
              <ul>
                {questions.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 border-t border-line py-1 text-sm">
                    <span>{item.question}</span>
                    <DeleteButton compact label="Delete question" onConfirm={() => removeQuestion(item.id)} />
                  </li>
                ))}
              </ul>
            </article>
          </DataColumn>
          <DataColumn title="Make">
            <article className="border border-line bg-sheet p-4">
              <BlockHead title="Scent lab" href="/product-lab" aside={`${scents.filter((item) => item.approved).length} of ${scents.length} approved`} />
              <ul>
                {scents.map((scent) => (
                  <li key={scent.slot} className="flex items-center justify-between gap-3 border-t border-line py-1 text-sm">
                    <span className="flex-1">
                      <span className="mr-2 font-serif text-olive">{scent.slot}</span>
                      {scent.workingName || scent.role}
                    </span>
                    <span className="text-xs tracking-widest text-muted">{scent.approved ? "Approved" : "Open"}</span>
                    <DeleteButton compact label={`Delete scent ${scent.slot}`} onConfirm={() => removeScent(scent.slot)} />
                  </li>
                ))}
              </ul>
            </article>
            <article className="border border-line bg-sheet p-4">
              <BlockHead title="Experiments" href="/product-lab" aside={`${experiments.length}`} />
              <ul>
                {experiments.map((item) => (
                  <ExperimentLine key={item.id} item={item} />
                ))}
              </ul>
            </article>
            <article className="border border-line bg-sheet p-4">
              <BlockHead title="Inventory" href="/inventory" aside={`${vessels.length} vessels`} />
              <p className="text-sm text-muted">
                {vessels.filter((item) => item.acceptance === "Accepted").length} accepted ·{" "}
                {vessels.filter((item) => item.acceptance === "Needs Testing").length} need testing ·{" "}
                {vessels.filter((item) => item.acceptance === "Rejected").length} rejected
              </p>
            </article>
            <article className="border border-line bg-sheet p-4">
              <BlockHead title="Burn tests" href="/tests" aside={`${tests.length} records`} />
              <p className="text-sm text-muted">
                {tests.filter((item) => item.passFail === "PASS").length} passing ·{" "}
                {tests.filter((item) => item.passFail === "FAIL").length} failed ·{" "}
                {tests.filter((item) => item.passFail === "UNTESTED").length} untested
              </p>
            </article>
          </DataColumn>
          <DataColumn title="Sell">
            <article className="border border-line bg-sheet p-4">
              <BlockHead title="Costs" href="/costs" aside="Estimates" />
              <ul>
                {economics.map((row) => (
                  <li key={row.size} className="flex justify-between border-t border-line py-2 text-sm">
                    <span>{row.size}</span>
                    <span className="tabular-nums">${row.retail.amount}</span>
                  </li>
                ))}
              </ul>
            </article>
            <article className="border border-line bg-sheet p-4">
              <BlockHead title="Suppliers" href="/suppliers" aside={`${suppliers.filter((item) => item.approved).length} approved`} />
              <ul>
                {suppliers.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 border-t border-line py-1 text-sm">
                    <span>
                      <span className="text-xs tracking-widest text-muted">{item.category}</span>
                      <span className="mt-1 block">{item.name}</span>
                    </span>
                    <DeleteButton compact label={`Delete ${item.name}`} onConfirm={() => removeSupplier(item.id)} />
                  </li>
                ))}
              </ul>
            </article>
          </DataColumn>
        </div>
      )}
    </div>
  );
}

function DataColumn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-3 border-b border-line pb-3">
        <h2 className="font-serif text-3xl">{title}</h2>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function Column({
  title,
  count,
  children,
}: {
  title: string;
  count: { done: number; total: number; percent: number };
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 border-b border-line pb-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-serif text-3xl">{title}</h2>
          <p className="font-serif text-2xl tabular-nums">{count.percent}%</p>
        </div>
        <div className="mt-2 h-1 bg-cream">
          <div className="h-1 bg-forest" style={{ width: `${count.percent}%` }} />
        </div>
        <p className="mt-2 text-xs tracking-widest text-muted">
          {count.done} of {count.total} complete
        </p>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function TaskBlock({ title, href, tasks }: { title: string; href: string; tasks: Task[] }) {
  const count = countComplete(tasks);
  const stepped = tasks.filter((task) => task.steps?.length);
  const plain = tasks.filter((task) => !task.steps?.length);
  const sections = [...new Set(plain.map((task) => task.section))];
  return (
    <article className="border border-line bg-sheet p-4">
      <BlockHead title={title} href={href} aside={`${count.percent}% · ${count.done}/${count.total}`} />
      {stepped.length ? (
        <ul className="mt-3 flex flex-wrap gap-2">
          {stepped.map((task) => (
            <StepTile key={task.id} task={task} />
          ))}
        </ul>
      ) : null}
      {sections.map((section) => (
        <div key={section} className="mt-3">
          <h3 className="text-xs tracking-widest text-olive">{section}</h3>
          <ul>
            {plain
              .filter((task) => task.section === section)
              .map((task) => (
                <TaskLine key={task.id} task={task} />
              ))}
          </ul>
        </div>
      ))}
    </article>
  );
}

function BlockHead({ title, href, aside }: { title: string; href: string; aside: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <Link to={href} className="font-serif text-xl">
        {title}
      </Link>
      <span className="text-xs tracking-widest text-muted">{aside}</span>
    </div>
  );
}

function TaskLine({ task }: { task: Task }) {
  const updateTask = usePeculiar((s) => s.updateTask);
  const removeTask = usePeculiar((s) => s.removeTask);
  const setOpenTask = usePeculiar((s) => s.setOpenTask);
  const done = task.status === "COMPLETE";
  return (
    <li className="flex items-center gap-2 border-t border-line">
      <button
        type="button"
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        onClick={() => updateTask(task.id, { status: done ? "IN PROGRESS" : "COMPLETE" })}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center border",
          done ? "border-forest bg-forest text-paper" : "border-line bg-paper",
        )}
      >
        <Check className="size-4" />
      </button>
      <button type="button" onClick={() => setOpenTask(task.id)} className={cn("flex-1 py-2 text-left text-sm", done && "text-muted line-through")}>
        {task.title}
      </button>
      <DeleteButton compact label={`Delete ${task.title}`} onConfirm={() => removeTask(task.id)} />
    </li>
  );
}

/** A stepped task on the overview: one chip, checked off like any other task. */
function StepTile({ task }: { task: Task }) {
  const updateTask = usePeculiar((s) => s.updateTask);
  const setOpenTask = usePeculiar((s) => s.setOpenTask);
  const progress = stepProgress(task);
  const done = task.status === "COMPLETE";
  const next = progress.next && !done ? `Next: ${progress.next.label}` : undefined;
  return (
    <li className={cn("flex h-11 items-stretch border", done ? "border-forest" : "border-line bg-paper")}>
      <button
        type="button"
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        onClick={() => updateTask(task.id, { status: done ? "IN PROGRESS" : "COMPLETE" })}
        className={cn("flex w-10 items-center justify-center border-r", done ? "border-forest bg-forest text-paper" : "border-line bg-sheet")}
      >
        <Check className="size-4" />
      </button>
      <button type="button" title={next} onClick={() => setOpenTask(task.id)} className={cn("px-3 text-left text-sm", done && "text-muted line-through")}>
        {task.title}
      </button>
    </li>
  );
}

function DecisionLine({ item }: { item: Decision }) {
  const removeDecision = usePeculiar((s) => s.removeDecision);
  return (
    <li className="flex items-start justify-between gap-3 border-t border-line py-2">
      <div>
        <DecisionChip status={item.status} />
        <p className="mt-1 text-sm">{item.decision}</p>
      </div>
      <DeleteButton compact label="Delete decision" onConfirm={() => removeDecision(item.id)} />
    </li>
  );
}

function ExperimentLine({ item }: { item: Experiment }) {
  const removeExperiment = usePeculiar((s) => s.removeExperiment);
  return (
    <li className="flex items-center justify-between gap-3 border-t border-line py-1">
      <span className="flex-1 text-sm">{item.name}</span>
      <StatusChip status={item.status} />
      <DeleteButton compact label={`Delete ${item.name}`} onConfirm={() => removeExperiment(item.id)} />
    </li>
  );
}
