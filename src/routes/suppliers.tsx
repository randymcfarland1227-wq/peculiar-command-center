import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Field, GhostButton, PageIntro, SolidButton, TextInput } from "@/components/fields";
import { uid, usePeculiar } from "@/lib/peculiar/store";
import { SUPPLIER_CATEGORIES, type Supplier, type SupplierCategory } from "@/lib/peculiar/types";

export const Route = createFileRoute("/suppliers")({
  component: SuppliersPage,
});

function SuppliersPage() {
  const suppliers = usePeculiar((s) => s.suppliers);
  const updateSupplier = usePeculiar((s) => s.updateSupplier);
  const addSupplier = usePeculiar((s) => s.addSupplier);
  const removeSupplier = usePeculiar((s) => s.removeSupplier);
  const [category, setCategory] = useState<"All" | SupplierCategory>("All");
  const shown = suppliers.filter((item) => category === "All" || item.category === category);

  return (
    <div>
      <PageIntro
        index="08"
        kicker="Suppliers"
        title="Nothing is approved yet"
        lede="Wax, fragrance, wicks, recycled glass, closures, labels, packaging, and shipping. A name goes here when there is a real company, not a category."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Filter on={category === "All"} onClick={() => setCategory("All")}>
          All
        </Filter>
        {SUPPLIER_CATEGORIES.map((item) => (
          <Filter key={item} on={category === item} onClick={() => setCategory(item)}>
            {item}
          </Filter>
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {shown.map((item) => (
          <SupplierCard key={item.id} item={item} onChange={(patch) => updateSupplier(item.id, patch)} onRemove={() => removeSupplier(item.id)} />
        ))}
      </ul>
      <div className="mt-6">
        <SolidButton
          type="button"
          onClick={() =>
            addSupplier({
              id: uid("sup"),
              category: category === "All" ? "Wax" : category,
              name: "",
              product: "",
              website: "",
              sampleOrdered: false,
              approved: false,
              moq: "",
              unitCost: "",
              shipping: "",
              landedCost: "",
              leadTime: "",
              safetyDocs: "",
              notes: "",
              backup: "",
            } satisfies Supplier)
          }
        >
          Add supplier
        </SolidButton>
      </div>
    </div>
  );
}

function SupplierCard({
  item,
  onChange,
  onRemove,
}: {
  item: Supplier;
  onChange: (patch: Partial<Supplier>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="border border-line bg-sheet p-4">
      <p className="text-xs tracking-widest text-olive">{item.category}</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Field label="Supplier">
          <TextInput value={item.name} onChange={(event) => onChange({ name: event.target.value })} />
        </Field>
        <Field label="Product">
          <TextInput value={item.product} onChange={(event) => onChange({ product: event.target.value })} />
        </Field>
        <Field label="Website">
          <TextInput value={item.website} onChange={(event) => onChange({ website: event.target.value })} />
        </Field>
        <Field label="Lead time">
          <TextInput value={item.leadTime} onChange={(event) => onChange({ leadTime: event.target.value })} />
        </Field>
        <Field label="MOQ">
          <TextInput value={item.moq} onChange={(event) => onChange({ moq: event.target.value })} />
        </Field>
        <Field label="Unit cost">
          <TextInput value={item.unitCost} onChange={(event) => onChange({ unitCost: event.target.value })} />
        </Field>
        <Field label="Shipping">
          <TextInput value={item.shipping} onChange={(event) => onChange({ shipping: event.target.value })} />
        </Field>
        <Field label="Landed cost">
          <TextInput value={item.landedCost} onChange={(event) => onChange({ landedCost: event.target.value })} />
        </Field>
        <Field label="Safety docs">
          <TextInput value={item.safetyDocs} onChange={(event) => onChange({ safetyDocs: event.target.value })} />
        </Field>
        <Field label="Backup">
          <TextInput value={item.backup} onChange={(event) => onChange({ backup: event.target.value })} />
        </Field>
      </div>
      <Field label="Notes">
        <TextInput value={item.notes} onChange={(event) => onChange({ notes: event.target.value })} />
      </Field>
      <div className="mt-3 flex flex-wrap items-center gap-4">
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={item.sampleOrdered} onChange={(event) => onChange({ sampleOrdered: event.target.checked })} className="size-4 accent-forest" />
          Sample ordered
        </label>
        <label className="flex h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={item.approved} onChange={(event) => onChange({ approved: event.target.checked })} className="size-4 accent-forest" />
          Approved
        </label>
        <GhostButton type="button" onClick={onRemove}>
          Remove
        </GhostButton>
      </div>
    </li>
  );
}

function Filter({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={on ? "h-11 bg-forest px-3 text-sm text-paper" : "h-11 border border-line bg-sheet px-3 text-sm"}>
      {children}
    </button>
  );
}
