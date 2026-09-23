import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Field, GhostButton, PageIntro, SectionTitle, SolidButton, TextInput, AreaInput } from "@/components/fields";
import { StatusChip } from "@/components/status-chip";
import { uid, usePeculiar } from "@/lib/peculiar/store";
import { STATUSES, type ResearchQuestion, type TaskStatus } from "@/lib/peculiar/types";

export const Route = createFileRoute("/research")({
  component: ResearchPage,
});

function ResearchPage() {
  const questions = usePeculiar((s) => s.questions);
  const updateQuestion = usePeculiar((s) => s.updateQuestion);
  const addQuestion = usePeculiar((s) => s.addQuestion);
  const removeQuestion = usePeculiar((s) => s.removeQuestion);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ question: "", why: "", evidenceNeeded: "", category: "Lab" });

  return (
    <div>
      <PageIntro
        index="06"
        kicker="Research"
        title="Open questions stay open"
        lede="This is not the decision log. A question lives here until there is evidence. Moving it into Decisions is a separate act."
      />
      <div className="mb-6">
        <SolidButton type="button" onClick={() => setOpen((value) => !value)}>
          {open ? "Close" : "Add a question"}
        </SolidButton>
      </div>
      {open ? (
        <form
          className="mb-8 grid gap-3 border border-line bg-sheet p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.question.trim()) return;
            const question: ResearchQuestion = {
              id: uid("q"),
              question: draft.question.trim(),
              category: draft.category,
              why: draft.why,
              evidenceNeeded: draft.evidenceNeeded,
              link: "",
              owner: "Founder",
              due: "",
              status: "NOT STARTED",
              decisionAffected: "",
              workstreams: ["research"],
            };
            addQuestion(question);
            setDraft({ question: "", why: "", evidenceNeeded: "", category: "Lab" });
            setOpen(false);
          }}
        >
          <Field label="Question">
            <TextInput value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })} />
          </Field>
          <Field label="Why it matters">
            <AreaInput value={draft.why} onChange={(event) => setDraft({ ...draft, why: event.target.value })} />
          </Field>
          <Field label="Evidence needed">
            <TextInput value={draft.evidenceNeeded} onChange={(event) => setDraft({ ...draft, evidenceNeeded: event.target.value })} />
          </Field>
          <SolidButton type="submit">Save question</SolidButton>
        </form>
      ) : null}
      <SectionTitle title="Tracker" aside={`${questions.filter((item) => item.status !== "DECIDED" && item.status !== "COMPLETE").length} still open`} />
      <ul className="flex flex-col gap-3">
        {questions.map((item) => (
          <li key={item.id} className="border border-line bg-sheet p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-serif text-xl">{item.question}</h2>
              <StatusChip status={item.status} />
            </div>
            <p className="mt-2 text-sm text-muted">{item.why}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label="Evidence needed">
                <TextInput value={item.evidenceNeeded} onChange={(event) => updateQuestion(item.id, { evidenceNeeded: event.target.value })} />
              </Field>
              <Field label="Decision affected">
                <TextInput value={item.decisionAffected} onChange={(event) => updateQuestion(item.id, { decisionAffected: event.target.value })} />
              </Field>
              <Field label="Link or source">
                <TextInput value={item.link} onChange={(event) => updateQuestion(item.id, { link: event.target.value })} />
              </Field>
              <Field label="Status">
                <select
                  value={item.status}
                  onChange={(event) => updateQuestion(item.id, { status: event.target.value as TaskStatus })}
                  className="h-11 w-full border border-line bg-paper px-3 text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs tracking-widest text-muted">
              <span>
                {item.category} · {item.owner}
                {item.due ? ` · due ${item.due}` : ""}
              </span>
              <GhostButton type="button" onClick={() => removeQuestion(item.id)}>
                Remove
              </GhostButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
