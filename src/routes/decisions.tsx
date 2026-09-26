import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AreaInput, Field, PageIntro, SolidButton, TextInput, DeleteButton } from "@/components/fields";
import { DecisionChip } from "@/components/status-chip";
import { prettyDate } from "@/lib/peculiar/format";
import { uid, usePeculiar } from "@/lib/peculiar/store";
import { DECISION_STATUSES, type Decision, type DecisionStatus } from "@/lib/peculiar/types";

export const Route = createFileRoute("/decisions")({
  component: DecisionsPage,
});

function DecisionsPage() {
  const decisions = usePeculiar((s) => s.decisions);
  const updateDecision = usePeculiar((s) => s.updateDecision);
  const addDecision = usePeculiar((s) => s.addDecision);
  const removeDecision = usePeculiar((s) => s.removeDecision);
  const [filter, setFilter] = useState<"ALL" | DecisionStatus>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ decision: "", reason: "", category: "Product" });

  const shown = useMemo(
    () =>
      decisions
        .filter((item) => filter === "ALL" || item.status === filter)
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date)),
    [decisions, filter],
  );

  return (
    <div>
      <PageIntro
        index="07"
        kicker="Decisions"
        title="What is already settled"
        lede="A working assumption can change when the revisit trigger hits. A decided item should not be relitigated because the checklist is long."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Filter on={filter === "ALL"} onClick={() => setFilter("ALL")}>
          All
        </Filter>
        {DECISION_STATUSES.map((status) => (
          <Filter key={status} on={filter === status} onClick={() => setFilter(status)}>
            {status}
          </Filter>
        ))}
        <SolidButton type="button" onClick={() => setAdding((value) => !value)}>
          Record a decision
        </SolidButton>
      </div>
      {adding ? (
        <form
          className="mb-6 grid gap-3 border border-line bg-sheet p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.decision.trim()) return;
            const decision: Decision = {
              id: uid("d"),
              date: new Date().toISOString().slice(0, 10),
              decision: draft.decision.trim(),
              category: draft.category,
              reason: draft.reason,
              evidence: "",
              status: "WORKING ASSUMPTION",
              revisitWhen: "",
              workstreams: ["research"],
            };
            addDecision(decision);
            setDraft({ decision: "", reason: "", category: "Product" });
            setAdding(false);
          }}
        >
          <Field label="Decision">
            <TextInput value={draft.decision} onChange={(event) => setDraft({ ...draft, decision: event.target.value })} />
          </Field>
          <Field label="Reason">
            <AreaInput value={draft.reason} onChange={(event) => setDraft({ ...draft, reason: event.target.value })} />
          </Field>
          <SolidButton type="submit">Save as working assumption</SolidButton>
        </form>
      ) : null}
      <ul className="border-t border-line">
        {shown.map((item) => {
          const open = openId === item.id;
          return (
            <li key={item.id} className="border-b border-line py-4">
              <button type="button" className="w-full text-left" onClick={() => setOpenId(open ? null : item.id)}>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-xs tracking-widest text-muted">{prettyDate(item.date)}</span>
                  <span className="text-xs tracking-widest text-muted">{item.category}</span>
                  <DecisionChip status={item.status} />
                </span>
                <span className="mt-2 block font-serif text-xl">{item.decision}</span>
              </button>
              {open ? (
                <div className="mt-4 grid gap-3">
                  <Field label="Reason">
                    <AreaInput value={item.reason} onChange={(event) => updateDecision(item.id, { reason: event.target.value })} />
                  </Field>
                  <Field label="Evidence">
                    <TextInput value={item.evidence} onChange={(event) => updateDecision(item.id, { evidence: event.target.value })} />
                  </Field>
                  <Field label="Revisit when">
                    <TextInput value={item.revisitWhen} onChange={(event) => updateDecision(item.id, { revisitWhen: event.target.value })} />
                  </Field>
                  <Field label="Status">
                    <select
                      value={item.status}
                      onChange={(event) => updateDecision(item.id, { status: event.target.value as DecisionStatus })}
                      className="h-11 w-full border border-line bg-sheet px-3 text-sm"
                    >
                      {DECISION_STATUSES.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                  </Field>
                  <DeleteButton label="Delete decision" onConfirm={() => removeDecision(item.id)} />
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted">{item.reason}</p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Filter({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={on ? "h-11 bg-forest px-3 text-sm text-paper" : "h-11 border border-line bg-sheet px-3 text-sm"}>
      {children}
    </button>
  );
}
