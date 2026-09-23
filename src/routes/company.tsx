import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SectionTitle } from "@/components/fields";
import { DecisionChip } from "@/components/status-chip";
import { TaskList } from "@/components/task-list";
import { usePeculiar } from "@/lib/peculiar/store";

export const Route = createFileRoute("/company")({
  component: CompanyPage,
});

function CompanyPage() {
  const allTasks = usePeculiar((s) => s.tasks);
  const allDecisions = usePeculiar((s) => s.decisions);
  const allQuestions = usePeculiar((s) => s.questions);
  const allBudget = usePeculiar((s) => s.budget);
  const tasks = allTasks.filter((task) => task.workstream === "company");
  const decisions = allDecisions.filter((item) => item.workstreams.includes("company"));
  const questions = allQuestions.filter((item) => item.workstreams.includes("company"));
  const budget = allBudget.filter((item) => item.workstreams.includes("company"));

  return (
    <div>
      <PageIntro
        index="01"
        kicker="Company"
        title="Admin before the first sale"
        lede="Peculiar is not formed yet. The working path is an LLC, an EIN, Maryland tax accounts, business checking, and product-liability coverage. Credit is unresolved on purpose."
      />
      <section className="mb-10">
        <SectionTitle title="Already decided" />
        {decisions.length === 0 ? (
          <p className="border border-dashed border-line px-4 py-6 text-sm text-muted">
            Formation, banking, tax, and insurance are still open. Do not treat the name as a filed company.
          </p>
        ) : (
          <ul className="border-t border-line">
            {decisions.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center gap-2 border-b border-line py-3">
                <DecisionChip status={item.status} />
                <p className="font-serif text-lg">{item.decision}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="mb-10">
        <SectionTitle title="Open work" aside="Legal, finance, insurance" />
        <TaskList tasks={tasks} />
      </section>
      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <SectionTitle title="Open questions" />
          <ul className="border-t border-line">
            {questions.map((item) => (
              <li key={item.id} className="border-b border-line py-3">
                <p className="font-serif text-lg">{item.question}</p>
                <p className="mt-1 text-sm text-muted">{item.why}</p>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <SectionTitle title="Related costs" aside="Still estimates" />
          <ul className="border-t border-line">
            {budget.map((item) => (
              <li key={item.id} className="flex items-baseline justify-between border-b border-line py-3">
                <span>{item.label}</span>
                <span className="tabular-nums">${item.estimated}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
