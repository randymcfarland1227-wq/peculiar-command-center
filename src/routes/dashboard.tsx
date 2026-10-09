import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Lock } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { countComplete, stepProgress, usePeculiar } from "@/lib/peculiar/store";
import { isClosed, isPostLaunch } from "@/lib/peculiar/status";
import { WORKSTREAM_LABEL, type Decision, type Experiment, type Task } from "@/lib/peculiar/types";
import { DecisionChip, StatusChip } from "@/components/status-chip";
import { DeleteButton } from "@/components/fields";
import { unlockText, useTaskGate } from "@/components/task-gate";

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

  const parked = tasks.filter((task) => task.afterLaunch);
  const postLaunch = tasks.filter((task) => !task.afterLaunch && isPostLaunch(task.status));
  const company = tasks.filter((task) => task.workstream === "company");
  const research = tasks.filter((task) => task.workstream === "research");
  const lab = tasks.filter((task) => task.workstream === "product-lab");
  const brand = tasks.filter((task) => task.workstream === "brand");
  const commerce = tasks.filter((task) => task.workstream === "commerce");
  const launch = tasks.filter((task) => task.workstream === "launch");

  const operate = countComplete([...company, ...research], tasks);
  const make = countComplete([...lab, ...brand], tasks);
  const sell = countComplete([...commerce, ...launch], tasks);

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
            ? "The work still to do. Each percent is tasks marked complete or post launch, divided by every task in that group."
            : "What you have decided, measured, and sourced so far. Nothing here is a task."}
        </p>
      </header>

      {view === "dashboard" ? (
        <>
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
              <BlockHead title="Content" href="/content" aside={`${content.filter((item) => isClosed(item.status)).length} of ${content.length}`} />
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
        {postLaunch.length ? <PostLaunch tasks={postLaunch} /> : null}
        {parked.length ? <AfterLaunch tasks={parked} /> : null}
        </>
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
  count: ReturnType<typeof countComplete>;
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
          {count.done} of {count.total} complete · {count.open} open
          {count.locked ? ` · ${count.locked} locked` : ""}
          {count.blocked ? ` · ${count.blocked} blocked` : ""}
          {count.postLaunch ? ` · ${count.postLaunch} post launch` : ""}
        </p>
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function TaskBlock({ title, href, tasks: all }: { title: string; href: string; tasks: Task[] }) {
  const everyTask = usePeculiar((s) => s.tasks);
  const tasks = all.filter((task) => !task.afterLaunch);
  const count = countComplete(tasks, everyTask);
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

/**
 * Tasks marked Post launch: tentatively complete, so they count as done above and leave every
 * active list. Closed by default; each can be reopened or checked off as fully complete.
 */
function PostLaunch({ tasks }: { tasks: Task[] }) {
  const updateTask = usePeculiar((s) => s.updateTask);
  const setOpenTask = usePeculiar((s) => s.setOpenTask);
  const groups = [...new Set(tasks.map((task) => task.workstream))];
  return (
    <details className="mt-8 border border-dashed border-forest bg-sheet">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3">
        <span className="font-serif text-xl">Post launch</span>
        <span className="text-xs tracking-widest text-muted">{tasks.length} tentatively done</span>
      </summary>
      <div className="border-t border-line px-4 pb-4">
        <p className="mt-3 text-sm text-muted">
          Counted as done for launch and kept off the active lists. Check one off when it is fully done, or reopen it.
        </p>
        {groups.map((workstream) => (
          <div key={workstream} className="mt-4">
            <h3 className="text-xs tracking-widest text-olive">{WORKSTREAM_LABEL[workstream]}</h3>
            <ul>
              {tasks
                .filter((task) => task.workstream === workstream)
                .map((task) => (
                  <li key={task.id} className="flex items-center gap-2 border-t border-line">
                    <button type="button" onClick={() => setOpenTask(task.id)} className="min-h-11 flex-1 py-2 text-left text-sm">
                      {task.title}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateTask(task.id, { status: "IN PROGRESS" })}
                      className="h-11 shrink-0 border border-line bg-paper px-3 text-sm"
                    >
                      Reopen
                    </button>
                    <button
                      type="button"
                      aria-label={`Complete ${task.title}`}
                      onClick={() => updateTask(task.id, { status: "COMPLETE" })}
                      className="flex h-11 w-11 shrink-0 items-center justify-center border border-forest bg-paper text-forest"
                    >
                      <Check className="size-4" />
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}

/** Tasks parked until after launch: closed by default, out of every count above. */
function AfterLaunch({ tasks }: { tasks: Task[] }) {
  const updateTask = usePeculiar((s) => s.updateTask);
  const removeTask = usePeculiar((s) => s.removeTask);
  const groups = [...new Set(tasks.map((task) => task.workstream))];
  return (
    <details className="mt-8 border border-line bg-sheet">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-3">
        <span className="font-serif text-xl">After launch</span>
        <span className="text-xs tracking-widest text-muted">{tasks.length} parked</span>
      </summary>
      <div className="border-t border-line px-4 pb-4">
        <p className="mt-3 text-sm text-muted">Kept for later and left out of every count. Bring one back when it matters.</p>
        {groups.map((workstream) => (
          <div key={workstream} className="mt-4">
            <h3 className="text-xs tracking-widest text-olive">{WORKSTREAM_LABEL[workstream]}</h3>
            <ul>
              {tasks
                .filter((task) => task.workstream === workstream)
                .map((task) => (
                  <li key={task.id} className="flex items-center gap-2 border-t border-line">
                    <span className="flex-1 py-2 text-sm">{task.title}</span>
                    <button
                      type="button"
                      onClick={() => updateTask(task.id, { afterLaunch: false })}
                      className="h-11 shrink-0 border border-line bg-paper px-3 text-sm"
                    >
                      Bring back
                    </button>
                    <DeleteButton compact label={`Delete ${task.title}`} onConfirm={() => removeTask(task.id)} />
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
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
  const parked = isPostLaunch(task.status);
  const { locked, waiting } = useTaskGate(task);
  return (
    <li className="flex items-center gap-2 border-t border-line">
      <button
        type="button"
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        onClick={() => updateTask(task.id, { status: done ? "IN PROGRESS" : "COMPLETE" })}
        disabled={locked}
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center border",
          done ? "border-forest bg-forest text-paper" : parked ? "border-dashed border-forest bg-paper text-forest" : "border-line bg-paper",
          locked && "cursor-not-allowed text-muted",
        )}
        title={locked ? unlockText(waiting) : parked ? "Post launch. Check to mark it fully complete." : undefined}
      >
        {locked ? <Lock className="size-4" /> : parked ? <Clock className="size-4" /> : <Check className="size-4" />}
      </button>
      <button
        type="button"
        title={locked ? unlockText(waiting) : undefined}
        onClick={() => setOpenTask(task.id)}
        className={cn("flex-1 py-2 text-left text-sm", done && "text-muted line-through", (parked || locked) && "text-muted")}
      >
        {task.title}
        {parked ? <span className="ml-2 whitespace-nowrap text-xs tracking-widest text-forest">Post launch</span> : null}
        <GateLabel task={task} locked={locked} />
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
  const parked = isPostLaunch(task.status);
  const { locked, waiting } = useTaskGate(task);
  const next = locked
    ? unlockText(waiting)
    : parked
      ? "Post launch"
      : progress.next && !done
        ? `Next: ${progress.next.label}`
        : undefined;
  return (
    <li
      className={cn(
        "flex h-11 items-stretch border",
        done ? "border-forest" : parked ? "border-dashed border-forest bg-paper" : locked ? "border-dashed border-line bg-paper" : "border-line bg-paper",
      )}
    >
      <button
        type="button"
        aria-label={done ? `Reopen ${task.title}` : `Complete ${task.title}`}
        onClick={() => updateTask(task.id, { status: done ? "IN PROGRESS" : "COMPLETE" })}
        disabled={locked}
        title={locked ? next : undefined}
        className={cn(
          "flex w-10 items-center justify-center border-r",
          done ? "border-forest bg-forest text-paper" : parked ? "border-dashed border-forest bg-sheet text-forest" : "border-line bg-sheet",
          locked && "cursor-not-allowed text-muted",
        )}
      >
        {locked ? <Lock className="size-4" /> : parked ? <Clock className="size-4" /> : <Check className="size-4" />}
      </button>
      <button
        type="button"
        title={next}
        onClick={() => setOpenTask(task.id)}
        className={cn("px-3 text-left text-sm", done && "text-muted line-through", (parked || locked) && "text-muted")}
      >
        {task.title}
        {parked ? <span className="ml-2 whitespace-nowrap text-xs tracking-widest text-forest">Post launch</span> : null}
        <GateLabel task={task} locked={locked} />
      </button>
    </li>
  );
}

/** A short word after a task's name when it sits outside the open count. */
function GateLabel({ task, locked }: { task: Task; locked: boolean }) {
  const word = locked ? "Locked" : task.status === "BLOCKED" ? "Blocked" : task.optional ? "Optional" : task.partOf ? "In list" : "";
  return word ? <span className="ml-2 whitespace-nowrap text-xs tracking-widest text-muted">{word}</span> : null;
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
