import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AreaInput, Field, Note, PageIntro, SectionTitle, TextInput } from "@/components/fields";
import { StatusChip } from "@/components/status-chip";
import { StepTrackRow } from "@/components/step-track";
import { TaskList } from "@/components/task-list";
import { usePeculiar } from "@/lib/peculiar/store";
import { STATUSES } from "@/lib/peculiar/types";

export const Route = createFileRoute("/product-lab")({
  component: ProductLabPage,
});


function ProductLabPage() {
  const allTasks = usePeculiar((s) => s.tasks);
  const allExperiments = usePeculiar((s) => s.experiments);
  const updateExperiment = usePeculiar((s) => s.updateExperiment);
  const scents = usePeculiar((s) => s.scents);
  const updateScent = usePeculiar((s) => s.updateScent);
  const allDecisions = usePeculiar((s) => s.decisions);
  const tasks = allTasks.filter((task) => task.workstream === "product-lab");
  const experiments = allExperiments.filter((item) => item.workstream === "product-lab");
  const decisions = allDecisions.filter((item) => item.workstreams.includes("product-lab"));
  const tracks = tasks.filter((task) => task.steps?.length);
  const [openSlot, setOpenSlot] = useState("01");

  return (
    <div>
      <PageIntro
        index="02"
        kicker="Product Lab"
        title="Wax, scent, wick, vessel"
        lede="Launch depends on a tested soy-coconut wax, five signature scents, a diameter-based wick system, and a closure that survives shipping. Reclaimed glass has been sourced for about three months. It still needs to be measured."
      />

      <section className="mb-10">
        <SectionTitle title="Build sequence" aside={`${tracks.filter((task) => task.status === "COMPLETE").length} of ${tracks.length} complete`} />
        <Note>Left to right is build order. Fill each task's fields top to bottom. A task completes when every field has an answer, or when you check it off.</Note>
        <div className="mt-4">
          <StepTrackRow tasks={tracks} numbered />
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle title="Safety" />
        <TaskList tasks={tasks.filter((task) => !task.steps?.length)} />
      </section>

      <section className="mb-12">
        <SectionTitle title="Scent lab" aside="Six slots" />
        <Note>Nothing here is locked. Open a slot to rename it or change its direction.</Note>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {scents.map((scent) => {
            const open = openSlot === scent.slot;
            return (
              <article key={scent.slot} className="border border-line bg-sheet p-4">
                <button type="button" className="flex w-full items-start justify-between gap-3 text-left" onClick={() => setOpenSlot(open ? "" : scent.slot)}>
                  <span>
                    <span className="font-serif text-3xl tabular-nums text-olive">{scent.slot}</span>
                    <span className="mt-1 block font-serif text-xl">{scent.workingName || scent.role}</span>
                    <span className="mt-1 block text-xs tracking-widest text-muted">{scent.role}</span>
                  </span>
                  <span className={scent.approved ? "bg-forest px-2 py-1 text-xs tracking-widest text-paper" : "bg-cream px-2 py-1 text-xs tracking-widest text-ink"}>
                    {scent.approved ? "Approved" : "Open"}
                  </span>
                </button>
                {open ? (
                  <div className="mt-4 grid gap-3">
                    <Field label="Working name">
                      <TextInput value={scent.workingName} onChange={(event) => updateScent(scent.slot, { workingName: event.target.value })} />
                    </Field>
                    <Field label="Role">
                      <TextInput value={scent.role} onChange={(event) => updateScent(scent.slot, { role: event.target.value })} />
                    </Field>
                    <Field label="Mood">
                      <TextInput value={scent.mood} onChange={(event) => updateScent(scent.slot, { mood: event.target.value })} />
                    </Field>
                    <Field label="Direction">
                      <AreaInput value={scent.inspiration} onChange={(event) => updateScent(scent.slot, { inspiration: event.target.value })} />
                    </Field>
                    <Field label="Key notes">
                      <TextInput value={scent.keyNotes} onChange={(event) => updateScent(scent.slot, { keyNotes: event.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Supplier">
                        <TextInput value={scent.supplier} onChange={(event) => updateScent(scent.slot, { supplier: event.target.value })} />
                      </Field>
                      <Field label="Load">
                        <TextInput value={scent.load} onChange={(event) => updateScent(scent.slot, { load: event.target.value })} />
                      </Field>
                    </div>
                    <Field label="Materials">
                      <AreaInput value={scent.materials} onChange={(event) => updateScent(scent.slot, { materials: event.target.value })} />
                    </Field>
                    <Field label="Formula">
                      <AreaInput value={scent.formula} onChange={(event) => updateScent(scent.slot, { formula: event.target.value })} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Cold throw">
                        <TextInput value={scent.coldThrow} onChange={(event) => updateScent(scent.slot, { coldThrow: event.target.value })} />
                      </Field>
                      <Field label="Hot throw">
                        <TextInput value={scent.hotThrow} onChange={(event) => updateScent(scent.slot, { hotThrow: event.target.value })} />
                      </Field>
                    </div>
                    <Field label="Cost per candle">
                      <TextInput value={scent.costPerCandle} onChange={(event) => updateScent(scent.slot, { costPerCandle: event.target.value })} />
                    </Field>
                    <Field label="Notes">
                      <AreaInput value={scent.notes} onChange={(event) => updateScent(scent.slot, { notes: event.target.value })} />
                    </Field>
                    <label className="flex h-11 items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={scent.approved}
                        onChange={(event) => updateScent(scent.slot, { approved: event.target.checked })}
                        className="size-4 accent-forest"
                      />
                      Approved for launch
                    </label>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted">{scent.inspiration}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="mb-12">
        <SectionTitle title="Experiments" />
        <div className="grid gap-3">
          {experiments.map((item) => (
            <article key={item.id} className="border border-line p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-serif text-xl">{item.name}</h3>
                <StatusChip status={item.status} />
              </div>
              <p className="mt-2 text-sm text-muted">{item.hypothesis}</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Method">
                  <AreaInput value={item.method} onChange={(event) => updateExperiment(item.id, { method: event.target.value })} />
                </Field>
                <Field label="Result">
                  <AreaInput value={item.result} onChange={(event) => updateExperiment(item.id, { result: event.target.value })} />
                </Field>
                <Field label="Status">
                  <select
                    value={item.status}
                    onChange={(event) => updateExperiment(item.id, { status: event.target.value as typeof item.status })}
                    className="h-11 w-full border border-line bg-sheet px-3 text-sm"
                  >
                    {STATUSES.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Next action">
                  <TextInput value={item.nextAction} onChange={(event) => updateExperiment(item.id, { nextAction: event.target.value })} />
                </Field>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <SectionTitle title="Decisions in force" />
        <ul className="border-t border-line">
          {decisions.slice(0, 8).map((item) => (
            <li key={item.id} className="border-b border-line py-3 font-serif text-lg">
              {item.decision}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link to="/inventory" className="text-olive">
            Vessel inventory
          </Link>
          <Link to="/tests" className="text-olive">
            Burn tests
          </Link>
          <Link to="/costs" className="text-olive">
            Unit costs
          </Link>
        </div>
      </section>
    </div>
  );
}
