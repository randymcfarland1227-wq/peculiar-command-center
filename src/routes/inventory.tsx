import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Field, GhostButton, Note, PageIntro, SolidButton, TextInput } from "@/components/fields";
import { uid, usePeculiar } from "@/lib/peculiar/store";
import { SIZES, type Size, type Vessel } from "@/lib/peculiar/types";

export const Route = createFileRoute("/inventory")({
  component: InventoryPage,
});

const ACCEPTANCE = ["Accepted", "Needs Testing", "Rejected"] as const;
const PIGMENT = ["Clear", "Color"] as const;

function InventoryPage() {
  const vessels = usePeculiar((s) => s.vessels);
  const updateVessel = usePeculiar((s) => s.updateVessel);
  const addVessel = usePeculiar((s) => s.addVessel);
  const removeVessel = usePeculiar((s) => s.removeVessel);
  const [size, setSize] = useState<"All" | Size>("All");
  const [pigment, setPigment] = useState<"All" | Vessel["pigment"]>("All");
  const [acceptance, setAcceptance] = useState<"All" | Vessel["acceptance"]>("All");

  const shown = vessels.filter((item) => {
    if (size !== "All" && item.sizeClass !== size) return false;
    if (pigment !== "All" && item.pigment !== pigment) return false;
    if (acceptance !== "All" && item.acceptance !== acceptance) return false;
    return true;
  });

  return (
    <div>
      <PageIntro
        index="10"
        kicker="Inventory"
        title="Measure the glass you already have"
        lede="Shoppers see Small, Medium, or Large, and Clear, Color, or Surprise Me. The lab sees diameter and profile. The rows below are examples until you replace them with measured jars."
      />
      <Note>Profiles in use: S-Narrow, S-Standard, S-Wide, M-Narrow, M-Standard, M-Wide, L-Standard, L-Wide.</Note>
      <div className="my-4 flex flex-wrap gap-2">
        <Chips label="Size" options={["All", ...SIZES]} value={size} onChange={(value) => setSize(value as typeof size)} />
        <Chips label="Glass" options={["All", ...PIGMENT]} value={pigment} onChange={(value) => setPigment(value as typeof pigment)} />
        <Chips label="Status" options={["All", ...ACCEPTANCE]} value={acceptance} onChange={(value) => setAcceptance(value as typeof acceptance)} />
      </div>
      <p className="mb-4 text-sm text-muted">{shown.length} vessels in this view</p>
      <ul className="flex flex-col gap-3">
        {shown.map((item) => (
          <li key={item.id} className="border border-line bg-sheet p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Field label="Vessel ID">
                <TextInput value={item.vesselId} onChange={(event) => updateVessel(item.id, { vesselId: event.target.value })} />
              </Field>
              <Field label="Size">
                <select
                  value={item.sizeClass}
                  onChange={(event) => updateVessel(item.id, { sizeClass: event.target.value as Size })}
                  className="h-11 w-full border border-line bg-paper px-3 text-sm"
                >
                  {SIZES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="Diameter">
                <TextInput value={item.diameter} placeholder="inches" onChange={(event) => updateVessel(item.id, { diameter: event.target.value })} />
              </Field>
              <Field label="Profile">
                <TextInput value={item.profile} onChange={(event) => updateVessel(item.id, { profile: event.target.value })} />
              </Field>
              <Field label="Color">
                <TextInput value={item.color} onChange={(event) => updateVessel(item.id, { color: event.target.value })} />
              </Field>
              <Field label="Clear or color">
                <select
                  value={item.pigment}
                  onChange={(event) => updateVessel(item.id, { pigment: event.target.value as Vessel["pigment"] })}
                  className="h-11 w-full border border-line bg-paper px-3 text-sm"
                >
                  {PIGMENT.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="Acceptance">
                <select
                  value={item.acceptance}
                  onChange={(event) => updateVessel(item.id, { acceptance: event.target.value as Vessel["acceptance"] })}
                  className="h-11 w-full border border-line bg-paper px-3 text-sm"
                >
                  {ACCEPTANCE.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </Field>
              <Field label="Wick">
                <TextInput value={item.wick} onChange={(event) => updateVessel(item.id, { wick: event.target.value })} />
              </Field>
              <Field label="Source">
                <TextInput value={item.source} onChange={(event) => updateVessel(item.id, { source: event.target.value })} />
              </Field>
              <Field label="Cost">
                <TextInput value={item.cost} onChange={(event) => updateVessel(item.id, { cost: event.target.value })} />
              </Field>
              <Field label="Condition">
                <TextInput value={item.condition} onChange={(event) => updateVessel(item.id, { condition: event.target.value })} />
              </Field>
              <Field label="Test status">
                <TextInput value={item.testStatus} onChange={(event) => updateVessel(item.id, { testStatus: event.target.value })} />
              </Field>
            </div>
            <Field label="Notes">
              <TextInput value={item.notes} onChange={(event) => updateVessel(item.id, { notes: event.target.value })} />
            </Field>
            <div className="mt-3">
              <GhostButton type="button" onClick={() => removeVessel(item.id)}>
                Remove
              </GhostButton>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <SolidButton
          type="button"
          onClick={() =>
            addVessel({
              id: uid("vs"),
              vesselId: "",
              sizeClass: "Medium",
              diameter: "",
              profile: "",
              color: "",
              pigment: "Clear",
              source: "",
              cost: "",
              condition: "",
              acceptance: "Needs Testing",
              wick: "",
              testStatus: "Unmeasured",
              notes: "",
            })
          }
        >
          Add vessel
        </SolidButton>
      </div>
    </div>
  );
}

function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={option === value ? "h-11 bg-forest px-3 text-sm text-paper" : "h-11 border border-line bg-sheet px-3 text-sm"}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
