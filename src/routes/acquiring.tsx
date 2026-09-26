import { createFileRoute } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { AreaInput, Field, PageIntro, SelectInput, SolidButton, TextInput, DeleteButton } from "@/components/fields";
import { uid, usePeculiar } from "@/lib/peculiar/store";
import { ACQUIRE_STATUSES, type AcquireStatus, type Acquisition } from "@/lib/peculiar/types";

export const Route = createFileRoute("/acquiring")({
  component: AcquiringPage,
});

function safeHttp(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
  } catch {
    return "";
  }
  return "";
}

function blank(partial?: Partial<Acquisition>): Acquisition {
  return {
    id: uid("ac"),
    name: "New item",
    category: "General",
    purpose: "for",
    url: "",
    price: "",
    thoughts: "",
    details: "",
    status: "NEED",
    notes: "",
    ...partial,
  };
}

function AcquiringPage() {
  const items = usePeculiar((s) => s.acquisitions);
  const update = usePeculiar((s) => s.updateAcquisition);
  const add = usePeculiar((s) => s.addAcquisition);
  const remove = usePeculiar((s) => s.removeAcquisition);
  const [status, setStatus] = useState<"ALL" | AcquireStatus>("ALL");
  const [openId, setOpenId] = useState<string | null>(null);
  const shown = items.filter((item) => status === "ALL" || item.status === status);
  const open = items.find((item) => item.id === openId) ?? null;

  return (
    <div>
      <PageIntro
        index="00"
        kicker="Acquiring"
        title="What still has to be bought"
        lede="A short list. Open a line when you want the site, the price, or what you think of it."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Filter on={status === "ALL"} onClick={() => setStatus("ALL")}>
          All
        </Filter>
        {ACQUIRE_STATUSES.map((item) => (
          <Filter key={item} on={status === item} onClick={() => setStatus(item)}>
            {item}
          </Filter>
        ))}
      </div>
      <ul className="border-t border-line">
        {shown.map((item) => (
          <li key={item.id} className="border-b border-line">
            <button type="button" onClick={() => setOpenId(item.id)} className="flex w-full items-baseline gap-4 py-3 text-left">
              <span className="min-w-0 flex-1">
                <span className="font-serif text-2xl">{item.name}</span>
                <span className="mt-1 block text-sm text-muted">{item.purpose}</span>
              </span>
              <span className="shrink-0 text-xs tracking-widest text-olive">{item.status}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <SolidButton
          type="button"
          onClick={() => {
            const item = blank();
            add(item);
            setOpenId(item.id);
          }}
        >
          Add a line
        </SolidButton>
      </div>
      {open ? (
        <Detail
          item={open}
          onChange={(patch) => update(open.id, patch)}
          onClose={() => setOpenId(null)}
          onRemove={() => {
            remove(open.id);
            setOpenId(null);
          }}
        />
      ) : null}
    </div>
  );
}

function Detail({
  item,
  onChange,
  onClose,
  onRemove,
}: {
  item: Acquisition;
  onChange: (patch: Partial<Acquisition>) => void;
  onClose: () => void;
  onRemove: () => void;
}) {
  const href = safeHttp(item.url);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30">
      <button type="button" aria-label="Close" className="h-full flex-1" onClick={onClose} />
      <aside className="h-full w-full max-w-md overflow-y-auto border-l border-line bg-paper p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs tracking-widest text-olive">Acquiring</p>
          <button type="button" aria-label="Close" onClick={onClose} className="flex h-11 w-11 items-center justify-center">
            <X className="size-5" />
          </button>
        </div>
        <Field label="Name">
          <TextInput value={item.name} onChange={(event) => onChange({ name: event.target.value, category: event.target.value })} />
        </Field>
        <Field label="For">
          <TextInput value={item.purpose} onChange={(event) => onChange({ purpose: event.target.value })} />
        </Field>
        <Field label="Site">
          <TextInput value={item.url} placeholder="https://" onChange={(event) => onChange({ url: event.target.value })} />
        </Field>
        <Field label="Price">
          <TextInput value={item.price ?? ""} onChange={(event) => onChange({ price: event.target.value })} />
        </Field>
        <Field label="Status">
          <SelectInput value={item.status} onChange={(event) => onChange({ status: event.target.value as AcquireStatus })}>
            {ACQUIRE_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Thoughts">
          <AreaInput value={item.thoughts ?? ""} onChange={(event) => onChange({ thoughts: event.target.value })} />
        </Field>
        <Field label="Details">
          <AreaInput value={item.details || item.notes || ""} onChange={(event) => onChange({ details: event.target.value })} />
        </Field>
        <div className="mt-3 flex flex-wrap gap-2">
          {href ? (
            <a href={href} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center px-3 text-sm text-olive">
              Open site
            </a>
          ) : null}
          <DeleteButton label="Delete" onConfirm={onRemove} />
        </div>
      </aside>
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
