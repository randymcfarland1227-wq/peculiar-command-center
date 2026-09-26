import { createFileRoute } from "@tanstack/react-router";
import { DeleteButton, Note, PageIntro, SectionTitle } from "@/components/fields";
import { money } from "@/lib/peculiar/format";
import { usePeculiar, variableCost } from "@/lib/peculiar/store";
import { COST_FIELDS, COST_SOURCES, type CostKey, type CostSource } from "@/lib/peculiar/types";

export const Route = createFileRoute("/costs")({
  component: CostsPage,
});

function CostsPage() {
  const economics = usePeculiar((s) => s.economics);
  const setCost = usePeculiar((s) => s.setCost);
  const budget = usePeculiar((s) => s.budget);
  const updateBudget = usePeculiar((s) => s.updateBudget);
  const removeBudget = usePeculiar((s) => s.removeBudget);
  const removeCostLine = usePeculiar((s) => s.removeCostLine);
  // Lines deleted from the model are gone from every size.
  const costFields = COST_FIELDS.filter(([key]) => economics.every((row) => row.lines[key]));

  const budgetTotals = budget.reduce(
    (sum, line) => ({
      estimated: sum.estimated + line.estimated,
      actual: sum.actual + line.actual,
      paid: sum.paid + line.paid,
    }),
    { estimated: 0, actual: 0, paid: 0 },
  );

  return (
    <div>
      <PageIntro
        index="09"
        kicker="Costs"
        title="Estimates, until they aren’t"
        lede="The contribution target is about $20–25 a candle. These numbers are planning figures. Change the source to Quote or Actual when a real number replaces the guess. About $4,000 a month of profit is roughly 160–200 candles at that margin."
      />
      <Note>Retail prices inside the hypothesis: Small $34–40, Medium $42–50, Large $52–64. The model uses a midpoint until you change it.</Note>

      <section className="my-8">
        <SectionTitle title="Unit economics" />
        <div className="hidden overflow-x-auto border border-line md:block">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="bg-cream text-xs tracking-widest text-muted">
              <tr>
                <th className="px-3 py-3 font-medium">Line</th>
                {economics.map((row) => (
                  <th key={row.size} className="px-3 py-3 font-medium">
                    {row.size}
                    <span className="mt-1 block font-sans normal-case tracking-normal text-muted">{row.band}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-line">
                <td className="px-3 py-3">Retail</td>
                {economics.map((row) => (
                  <td key={row.size} className="px-3 py-3">
                    <MoneyEdit
                      amount={row.retail.amount}
                      source={row.retail.source}
                      onAmount={(amount) => setCost(row.size, "retail", { amount })}
                      onSource={(source) => setCost(row.size, "retail", { source })}
                    />
                  </td>
                ))}
              </tr>
              {costFields.map(([key, label]) => (
                <tr key={key} className="border-t border-line">
                  <td className="px-3 py-3">
                    <span className="flex items-center justify-between gap-2">
                      {label}
                      <DeleteButton compact label={`Delete ${label} line`} onConfirm={() => removeCostLine(key)} />
                    </span>
                  </td>
                  {economics.map((row) => (
                    <td key={row.size} className="px-3 py-3">
                      <MoneyEdit
                        amount={row.lines[key].amount}
                        source={row.lines[key].source}
                        onAmount={(amount) => setCost(row.size, key, { amount })}
                        onSource={(source) => setCost(row.size, key, { source })}
                      />
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t border-line bg-cream">
                <td className="px-3 py-3">Variable cost</td>
                {economics.map((row) => (
                  <td key={row.size} className="px-3 py-3 tabular-nums">
                    {money(variableCost(row))}
                  </td>
                ))}
              </tr>
              <tr className="border-t border-line bg-cream">
                <td className="px-3 py-3">Contribution</td>
                {economics.map((row) => {
                  const margin = row.retail.amount - variableCost(row);
                  const pct = row.retail.amount ? Math.round((margin / row.retail.amount) * 100) : 0;
                  return (
                    <td key={row.size} className="px-3 py-3 tabular-nums">
                      {money(margin)}
                      <span className="block text-muted">{pct}%</span>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4 md:hidden">
          {economics.map((row) => {
            const cost = variableCost(row);
            const margin = row.retail.amount - cost;
            return (
              <article key={row.size} className="border border-line bg-sheet p-4">
                <h3 className="font-serif text-2xl">{row.size}</h3>
                <p className="text-sm text-muted">{row.band}</p>
                <div className="mt-3">
                  <p className="text-xs tracking-widest text-muted">Retail</p>
                  <MoneyEdit
                    amount={row.retail.amount}
                    source={row.retail.source}
                    onAmount={(amount) => setCost(row.size, "retail", { amount })}
                    onSource={(source) => setCost(row.size, "retail", { source })}
                  />
                </div>
                {costFields.map(([key, label]) => (
                  <div key={key} className="mt-3">
                    <p className="flex items-center justify-between gap-2 text-xs tracking-widest text-muted">
                      {label}
                      <DeleteButton compact label={`Delete ${label} line`} onConfirm={() => removeCostLine(key)} />
                    </p>
                    <MoneyEdit
                      amount={row.lines[key].amount}
                      source={row.lines[key].source}
                      onAmount={(amount) => setCost(row.size, key as CostKey, { amount })}
                      onSource={(source) => setCost(row.size, key as CostKey, { source })}
                    />
                  </div>
                ))}
                <p className="mt-4 text-sm">
                  Cost {money(cost)} · Contribution {money(margin)}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section>
        <SectionTitle
          title="Startup budget"
          aside={`${money(budgetTotals.paid)} paid · ${money(budgetTotals.estimated - budgetTotals.paid)} remaining`}
        />
        <ul className="border-t border-line">
          {budget.map((line) => (
            <li key={line.id} className="grid gap-3 border-b border-line py-4 md:grid-cols-[1.2fr_repeat(3,1fr)_auto] md:items-end">
              <p className="font-serif text-lg">{line.label}</p>
              <NumberField label="Estimated" value={line.estimated} onChange={(estimated) => updateBudget(line.id, { estimated })} />
              <NumberField label="Actual" value={line.actual} onChange={(actual) => updateBudget(line.id, { actual })} />
              <NumberField label="Paid" value={line.paid} onChange={(paid) => updateBudget(line.id, { paid })} />
              <DeleteButton compact label={`Delete ${line.label}`} onConfirm={() => removeBudget(line.id)} />
            </li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-muted">
          Estimated {money(budgetTotals.estimated)} · Actual {money(budgetTotals.actual)} · Paid {money(budgetTotals.paid)} · Remaining{" "}
          {money(budgetTotals.estimated - budgetTotals.paid)}
        </p>
      </section>
    </div>
  );
}

function MoneyEdit({
  amount,
  source,
  onAmount,
  onSource,
}: {
  amount: number;
  source: CostSource;
  onAmount: (amount: number) => void;
  onSource: (source: CostSource) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        step="0.01"
        value={amount}
        onChange={(event) => onAmount(Number(event.target.value) || 0)}
        className="h-11 w-24 border border-line bg-sheet px-2 tabular-nums"
        aria-label="Amount"
      />
      <select
        value={source}
        onChange={(event) => onSource(event.target.value as CostSource)}
        className="h-11 border border-line bg-sheet px-2 text-xs"
        aria-label="Whether this number is an estimate, quote, or actual"
      >
        {COST_SOURCES.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs tracking-widest text-muted">{label}</span>
      <input
        type="number"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="h-11 w-full border border-line bg-sheet px-3 tabular-nums"
      />
    </label>
  );
}

