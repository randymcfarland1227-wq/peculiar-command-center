import { createFileRoute, Link } from "@tanstack/react-router";
import { Note, PageIntro, SectionTitle } from "@/components/fields";
import { TaskList } from "@/components/task-list";
import { money } from "@/lib/peculiar/format";
import { usePeculiar, variableCost } from "@/lib/peculiar/store";

export const Route = createFileRoute("/commerce")({
  component: CommercePage,
});

function CommercePage() {
  const economics = usePeculiar((s) => s.economics);
  const allTasks = usePeculiar((s) => s.tasks);
  const allQuestions = usePeculiar((s) => s.questions);
  const tasks = allTasks.filter((task) => task.workstream === "commerce");
  const questions = allQuestions.filter((item) => item.workstreams.includes("commerce"));

  return (
    <div>
      <PageIntro
        index="04"
        kicker="Commerce"
        title="Price is still a hypothesis"
        lede="Small, Medium, and Large have planning ranges. Every cost behind them is an estimate until a supplier quote replaces it. The customer storefront is a separate site — this page tracks the work, it does not edit that site."
      />
      <Note>Do not build the storefront here. The prototype stays its own project.</Note>
      <section className="my-8 grid gap-3 md:grid-cols-3">
        {economics.map((row) => {
          const cost = variableCost(row);
          const margin = row.retail.amount - cost;
          return (
            <article key={row.size} className="border border-line bg-sheet p-4">
              <p className="text-xs tracking-widest text-muted">{row.size}</p>
              <p className="font-serif text-3xl tabular-nums">{money(row.retail.amount)}</p>
              <p className="text-sm text-muted">{row.band}</p>
              <p className="mt-3 text-sm">
                Contribution {money(margin)} <span className="text-muted">on estimated cost</span>
              </p>
            </article>
          );
        })}
      </section>
      <p className="mb-10 text-sm">
        <Link to="/costs" className="text-olive">
          Edit the full unit model and startup budget
        </Link>
      </p>
      <section className="mb-10">
        <SectionTitle title="Open questions" />
        <ul className="border-t border-line">
          {questions.map((item) => (
            <li key={item.id} className="border-b border-line py-3">
              <p className="font-serif text-lg">{item.question}</p>
              <p className="text-sm text-muted">{item.evidenceNeeded}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <SectionTitle title="Work" aside="Pricing, storefront, packaging" />
        <TaskList tasks={tasks} />
      </section>
    </div>
  );
}
