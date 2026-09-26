import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AreaInput, Field, PageIntro, SolidButton, TextInput, DeleteButton } from "@/components/fields";
import { StatusChip } from "@/components/status-chip";
import { uid, usePeculiar } from "@/lib/peculiar/store";
import { PILLARS, STATUSES, type ContentItem, type TaskStatus } from "@/lib/peculiar/types";

export const Route = createFileRoute("/content")({
  component: ContentPage,
});

function ContentPage() {
  const items = usePeculiar((s) => s.content);
  const updateContent = usePeculiar((s) => s.updateContent);
  const addContent = usePeculiar((s) => s.addContent);
  const removeContent = usePeculiar((s) => s.removeContent);
  const [pillar, setPillar] = useState<"All" | ContentItem["pillar"]>("All");
  const shown = items.filter((item) => pillar === "All" || item.pillar === pillar);

  return (
    <div>
      <PageIntro
        index="12"
        kicker="Content"
        title="Film the work, not a lifestyle"
        lede="Sourcing, transformations, the scent lab, pours, testing, mystery reveals, circularity, and the build itself. A slot is waiting for the first real unboxing."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Pill on={pillar === "All"} onClick={() => setPillar("All")}>
          All
        </Pill>
        {PILLARS.map((item) => (
          <Pill key={item} on={pillar === item} onClick={() => setPillar(item)}>
            {item}
          </Pill>
        ))}
      </div>
      <ul className="flex flex-col gap-3">
        {shown.map((item) => (
          <li key={item.id} className="border border-line bg-sheet p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs tracking-widest text-olive">{item.pillar}</p>
                <h2 className="font-serif text-xl">{item.title}</h2>
              </div>
              <StatusChip status={item.status} />
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label="Title">
                <TextInput value={item.title} onChange={(event) => updateContent(item.id, { title: event.target.value })} />
              </Field>
              <Field label="Platform">
                <TextInput value={item.platform} onChange={(event) => updateContent(item.id, { platform: event.target.value })} />
              </Field>
              <Field label="Footage needed">
                <TextInput value={item.footage} onChange={(event) => updateContent(item.id, { footage: event.target.value })} />
              </Field>
              <Field label="Publish date">
                <TextInput type="date" value={item.publishDate} onChange={(event) => updateContent(item.id, { publishDate: event.target.value })} />
              </Field>
              <Field label="Status">
                <select
                  value={item.status}
                  onChange={(event) => updateContent(item.id, { status: event.target.value as TaskStatus })}
                  className="h-11 w-full border border-line bg-paper px-3 text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </Field>
              <Field label="Result">
                <TextInput value={item.result} onChange={(event) => updateContent(item.id, { result: event.target.value })} />
              </Field>
            </div>
            <Field label="Caption / notes">
              <AreaInput value={item.caption} onChange={(event) => updateContent(item.id, { caption: event.target.value })} />
            </Field>
            <DeleteButton label="Delete" className="mt-3" onConfirm={() => removeContent(item.id)} />
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <SolidButton
          type="button"
          onClick={() =>
            addContent({
              id: uid("ct"),
              title: "Untitled",
              pillar: pillar === "All" ? "Founder Journey" : pillar,
              platform: "Instagram",
              status: "NOT STARTED",
              footage: "",
              caption: "",
              publishDate: "",
              result: "",
            })
          }
        >
          Add a piece
        </SolidButton>
      </div>
    </div>
  );
}

function Pill({ on, children, onClick }: { on: boolean; children: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={on ? "h-11 bg-forest px-3 text-sm text-paper" : "h-11 border border-line bg-sheet px-3 text-sm"}>
      {children}
    </button>
  );
}
