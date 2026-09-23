import { createFileRoute } from "@tanstack/react-router";
import { PageIntro, SectionTitle } from "@/components/fields";
import { TaskList } from "@/components/task-list";
import { usePeculiar } from "@/lib/peculiar/store";
import { LAUNCH_AREAS } from "@/lib/peculiar/types";

export const Route = createFileRoute("/launch")({
  component: LaunchPage,
});

function LaunchPage() {
  const tasks = usePeculiar((s) => s.tasks);
  const launchTasks = tasks.filter((task) => task.workstream === "launch");
  const skus = usePeculiar((s) => s.skus);
  const updateSku = usePeculiar((s) => s.updateSku);

  const gates = LAUNCH_AREAS.map((area) => {
    const items = tasks.filter((task) => task.launchArea === area);
    const done = items.filter((task) => task.status === "COMPLETE").length;
    return { area, done, total: items.length };
  });

  const totals = skus.reduce(
    (sum, sku) => ({
      planned: sum.planned + sku.planned,
      poured: sum.poured + sku.poured,
      curing: sum.curing + sku.curing,
      ready: sum.ready + sku.ready,
      sold: sum.sold + sku.sold,
    }),
    { planned: 0, poured: 0, curing: 0, ready: 0, sold: 0 },
  );

  return (
    <div>
      <PageIntro
        index="05"
        kicker="Launch"
        title="Thirty to fifty, then stop and look"
        lede="The first sellable run is small on purpose: enough to learn, not enough to hide a bad wick. Nothing in this plan has been poured for sale."
      />
      <section className="mb-10">
        <SectionTitle title="Readiness" aside="From launch-gated tasks" />
        <ul className="grid gap-3 sm:grid-cols-2">
          {gates.map((gate) => {
            const pct = gate.total ? Math.round((gate.done / gate.total) * 100) : 0;
            return (
              <li key={gate.area} className="border border-line bg-sheet p-4">
                <div className="flex items-baseline justify-between">
                  <p className="font-serif text-lg">{gate.area}</p>
                  <p className="tabular-nums text-sm text-muted">
                    {gate.done}/{gate.total}
                  </p>
                </div>
                <div className="mt-3 h-1 bg-cream">
                  <div className="h-1 bg-forest" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
      <section className="mb-10">
        <SectionTitle title="First inventory" aside={`${totals.planned} planned · ${totals.ready} ready`} />
        <div className="overflow-x-auto border border-line">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead className="bg-cream text-xs tracking-widest text-muted">
              <tr>
                {["Scent", "Size", "Planned", "Poured", "Curing", "Ready", "Sold"].map((head) => (
                  <th key={head} className="px-3 py-3 font-medium">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {skus.map((sku) => (
                <tr key={sku.id} className="border-t border-line">
                  <td className="px-3 py-2">{sku.scent}</td>
                  <td className="px-3 py-2">{sku.size}</td>
                  {(["planned", "poured", "curing", "ready", "sold"] as const).map((key) => (
                    <td key={key} className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        value={sku[key]}
                        onChange={(event) => updateSku(sku.id, { [key]: Number(event.target.value) || 0 })}
                        className="h-11 w-20 border border-line bg-sheet px-2 tabular-nums"
                        aria-label={`${sku.scent} ${sku.size} ${key}`}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-line bg-cream font-medium">
                <td className="px-3 py-3" colSpan={2}>
                  Total
                </td>
                <td className="px-3 py-3 tabular-nums">{totals.planned}</td>
                <td className="px-3 py-3 tabular-nums">{totals.poured}</td>
                <td className="px-3 py-3 tabular-nums">{totals.curing}</td>
                <td className="px-3 py-3 tabular-nums">{totals.ready}</td>
                <td className="px-3 py-3 tabular-nums">{totals.sold}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <SectionTitle title="Content and validation" />
        <TaskList tasks={launchTasks} />
      </section>
    </div>
  );
}
