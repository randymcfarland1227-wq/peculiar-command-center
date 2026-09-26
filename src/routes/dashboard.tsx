import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { countComplete, stepProgress, usePeculiar } from "@/lib/peculiar/store";
import type { Decision, Experiment, Task } from "@/lib/peculiar/types";
import { DecisionChip, StatusChip } from "@/components/status-chip";

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

  const company = tasks.filter((task) => task.workstream === "company");
  const research = tasks.filter((task) => task.workstream === "research");
  const lab = tasks.filter((task) => task.workstream === "product-lab");
  const brand = tasks.filter((task) => task.workstream === "brand");
  const commerce = tasks.filter((task) => task.workstream === "commerce");
  const launch = tasks.filter((task) => task.workstream === "launch");

  const operate = countComplete([...company, ...research]);
  const make = countComplete([...lab, ...brand]);
  const sell = countComplete([...commerce, ...launch]);

  return (
    <div>
      <header className="mb-6">
        <p className="text-xs tracking-widest text-olive">Overview</p>
        <h1 className="mt-2 font-serif text-4xl text-ink md:text-5xl">Command Center</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          Each percent is tasks marked complete, divided by every task in that group. Planning and in progress still count as open, so a new workspace sits at 0 until you check something off.
        </p>
      </header>
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <Column title="Operate" count={operate}>
          <TaskBlock title="Company" href="/company" tasks={company} />
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
          <TaskBlock title="Research" href="/research" tasks={research} />
          <article className="border border-line bg-sheet p-4">
            <BlockHead title="Open questions" href="/research" aside={`${questions.length}`} />
            <ul>
              {questions.map((item) => (
                <li key={item.id} className="border-t border-line py-2 text-sm">
                  {item.question}
                </li>
              ))}
            </ul>
          </article>
        </Column>

        <Column title="Make" count={make}>
          <TaskBlock title="Product Lab" href="/product-lab" tasks={lab} />
          <article className="border border-line bg-sheet p-4">
            <BlockHead title="Scent lab" href="/product-lab" aside={`${scents.filter((item) => item.approved).length} of ${scents.length} approved`} />
            <ul>
              {scents.map((scent) => (
                <li key={scent.slot} className="flex items-baseline justify-between gap-3 border-t border-line py-2 text-sm">
                  <span>
                    <span className="mr-2 font-serif text-olive">{scent.slot}</span>
                    {scent.workingName || scent.role}
                  </span>
                  <span className="text-xs tracking-widest text-muted">{scent.approved ? "Approved" : "Open"}</span>
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
          <TaskBlock title="Brand" href="/brand" tasks={brand} />
        </Column>

        <Column title="Sell" count={sell}>
          <TaskBlock title="Commerce" href="/commerce" tasks={commerce} />
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
                <li key={item.id} className="border-t border-line py-2 text-sm">
                  <span className="text-xs tracking-widest text-muted">{item.category}</span>
                  <span className="mt-1 block">{item.name}</span>
                </li>
              ))}
            </ul>
          </article>
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
    </div>
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
  const sections = [...new Set(tasks.map((task) => task.section))];
  return (
    <article className="border border-line bg-sheet p-4">
      <BlockHead title={title} href={href} aside={`${count.percent}% · ${count.done}/${count.total}`} />
      {sections.map((section) => (
        <div key={section} className="mt-3">
          {tasks.some((task) => task.section === section && task.title !== section) ? (
            <h3 className="text-xs tracking-widest text-olive">{section}</h3>
          ) : null}
          <ul>
            {tasks
              .filter((task) => task.section === section)
              .map((task) => (task.steps?.length ? <StepLine key={task.id} task={task} /> : <TaskLine key={task.id} task={task} />))}
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
      <button type="button" onClick={() => setOpenTask(task.id)} className={cn("py-2 text-left text-sm", done && "text-muted line-through")}>
        {task.title}
      </button>
    </li>
  );
}

/** A stepped task on the overview: one row of segments, filled left to right. */
function StepLine({ task }: { task: Task }) {
  const setOpenTask = usePeculiar((s) => s.setOpenTask);
  const progress = stepProgress(task);
  const done = task.status === "COMPLETE";
  return (
    <li className="border-t border-line py-2">
      <button type="button" onClick={() => setOpenTask(task.id)} className="flex w-full items-baseline justify-between gap-3 text-left">
        <span className={cn("text-sm", done && "text-muted line-through")}>{task.title}</span>
        <span className="text-xs tabular-nums tracking-widest text-muted">
          {progress.done}/{progress.total}
        </span>
      </button>
      <div className="mt-2 flex gap-1" aria-hidden="true">
        {(task.steps ?? []).map((item) => (
          <span
            key={item.id}
            title={item.label}
            className={cn("h-2 flex-1", item.value.trim() ? "bg-forest" : item === progress.next ? "bg-sage" : "bg-cream")}
          />
        ))}
      </div>
      {progress.next && !done ? <p className="mt-1 text-xs text-muted">Next: {progress.next.label}</p> : null}
    </li>
  );
}

function DecisionLine({ item }: { item: Decision }) {
  return (
    <li className="border-t border-line py-2">
      <DecisionChip status={item.status} />
      <p className="mt-1 text-sm">{item.decision}</p>
    </li>
  );
}

function ExperimentLine({ item }: { item: Experiment }) {
  return (
    <li className="flex items-start justify-between gap-3 border-t border-line py-2">
      <span className="text-sm">{item.name}</span>
      <StatusChip status={item.status} />
    </li>
  );
}
