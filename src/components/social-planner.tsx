import { useState } from "react";
import {
  AreaInput,
  DeleteButton,
  Field,
  SelectInput,
  SolidButton,
  TextInput,
} from "@/components/fields";
import { StatusChip } from "@/components/status-chip";
import { contentKind, marketingFor } from "@/lib/peculiar/photo-plan";
import { uid, usePeculiar } from "@/lib/peculiar/store";
import {
  PILLARS,
  STATUSES,
  type ContentItem,
  type MarketingBrief,
  type TaskStatus,
} from "@/lib/peculiar/types";

export function SocialPlanner() {
  const items = usePeculiar((s) => s.content);
  const add = usePeculiar((s) => s.addContent);
  const [pillar, setPillar] = useState("All");
  const shown = items.filter(
    (item) => contentKind(item) === "social" && (pillar === "All" || item.pillar === pillar),
  );
  const photos = items.filter((item) => item.photo);
  return (
    <section>
      <div className="mb-5 border-l-2 border-olive pl-4">
        <h2 className="font-serif text-2xl">Give each post a job</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          Work on this after the website photos. Begin with the candle, explain the vessel choices,
          show the process, then invite someone to the relevant page. Use the photo library to
          support each piece. Your existing ideas and saved work are kept here.
        </p>
        <p className="mt-2 text-sm text-muted">
          Suggested sequence: product / scent → vessel choice → proof of process → what arrives → a
          clear invitation to shop when the site is ready.
        </p>
      </div>
      <div className="mb-5 max-w-sm">
        <Field label="Filter by content pillar">
          <SelectInput value={pillar} onChange={(event) => setPillar(event.target.value)}>
            <option>All</option>
            {PILLARS.map((value) => (
              <option key={value}>{value}</option>
            ))}
          </SelectInput>
        </Field>
      </div>
      <div className="flex flex-col gap-3">
        {shown.map((item) => (
          <SocialCard key={item.id} item={item} photos={photos} />
        ))}
      </div>
      {!shown.length ? (
        <p className="border border-line p-5 text-sm text-muted">
          No pieces in this pillar. Add one when it has a clear purpose.
        </p>
      ) : null}
      <SolidButton
        className="mt-5"
        type="button"
        onClick={() =>
          add({
            id: uid("ct"),
            kind: "social",
            title: "New marketing piece",
            pillar: pillar === "All" ? "Styling" : (pillar as ContentItem["pillar"]),
            platform: "Instagram",
            status: "NOT STARTED",
            footage: "",
            caption: "",
            publishDate: "",
            result: "",
          })
        }
      >
        Add marketing piece
      </SolidButton>
    </section>
  );
}

function SocialCard({ item, photos }: { item: ContentItem; photos: ContentItem[] }) {
  const update = usePeculiar((s) => s.updateContent);
  const remove = usePeculiar((s) => s.removeContent);
  const brief = marketingFor(item);
  const patch = (change: Partial<MarketingBrief>) =>
    update(item.id, { marketing: { ...brief, ...change } });
  return (
    <details className="border border-line bg-sheet">
      <summary className="cursor-pointer p-4 marker:text-olive">
        <span className="ml-1 inline-flex max-w-full flex-col gap-1 align-middle">
          <span className="text-xs tracking-widest text-olive">{item.pillar}</span>
          <span className="font-serif text-xl">{item.title}</span>
          <span className="text-sm text-muted">
            {brief.purpose || "Define the purpose before planning the post."}
          </span>
        </span>
      </summary>
      <div className="border-t border-line p-4 sm:p-5">
        <StatusChip status={item.status} />
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Title">
            <TextInput
              value={item.title}
              onChange={(event) => update(item.id, { title: event.target.value })}
            />
          </Field>
          <Field label="Content pillar">
            <SelectInput
              value={item.pillar}
              onChange={(event) =>
                update(item.id, { pillar: event.target.value as ContentItem["pillar"] })
              }
            >
              {PILLARS.map((pillar) => (
                <option key={pillar}>{pillar}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Purpose / buyer question">
            <AreaInput
              value={brief.purpose}
              onChange={(event) => patch({ purpose: event.target.value })}
            />
          </Field>
          <Field label="Opening hook / angle">
            <AreaInput
              value={brief.hook}
              onChange={(event) => patch({ hook: event.target.value })}
            />
          </Field>
          <Field label="Platform">
            <TextInput
              value={item.platform}
              onChange={(event) => update(item.id, { platform: event.target.value })}
            />
          </Field>
          <Field label="Format">
            <TextInput
              value={brief.format}
              onChange={(event) => patch({ format: event.target.value })}
            />
          </Field>
          <Field label="Footage / stills needed">
            <AreaInput
              value={item.footage}
              onChange={(event) => update(item.id, { footage: event.target.value })}
            />
          </Field>
          <Field label="Call to action / destination">
            <AreaInput value={brief.cta} onChange={(event) => patch({ cta: event.target.value })} />
          </Field>
          <Field label="When this makes sense">
            <AreaInput
              value={brief.timing}
              onChange={(event) => patch({ timing: event.target.value })}
            />
          </Field>
          <Field label="What to measure">
            <AreaInput
              value={brief.measure}
              onChange={(event) => patch({ measure: event.target.value })}
            />
          </Field>
          <Field label="Status">
            <SelectInput
              value={item.status}
              onChange={(event) => update(item.id, { status: event.target.value as TaskStatus })}
            >
              {STATUSES.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Publish date">
            <TextInput
              type="date"
              value={item.publishDate}
              onChange={(event) => update(item.id, { publishDate: event.target.value })}
            />
          </Field>
        </div>
        <fieldset className="my-5">
          <legend className="font-medium">Photo sources</legend>
          <p className="mt-1 text-sm text-muted">
            Choose the actual photo sets this piece will use.
          </p>
          <div className="mt-2 grid gap-x-4 md:grid-cols-2">
            {photos.map((photo) => (
              <label
                className="flex min-h-11 cursor-pointer items-center gap-2 py-2 text-sm"
                key={photo.id}
              >
                <input
                  className="size-5 shrink-0 accent-forest"
                  type="checkbox"
                  checked={brief.sourceIds.includes(photo.id)}
                  onChange={(event) =>
                    patch({
                      sourceIds: event.target.checked
                        ? [...brief.sourceIds, photo.id]
                        : brief.sourceIds.filter((id) => id !== photo.id),
                    })
                  }
                />
                <span>
                  {photo.title} <span className="text-muted">· {photo.photo?.stage}</span>
                </span>
              </label>
            ))}
          </div>
          {brief.sourceIds.some((id) => !photos.some((photo) => photo.id === id)) ? (
            <p className="mt-2 text-sm text-muted">
              A suggested source set was deleted. Choose another set above.
            </p>
          ) : null}
        </fieldset>
        <Field label="Caption / notes">
          <AreaInput
            value={item.caption}
            onChange={(event) => update(item.id, { caption: event.target.value })}
          />
        </Field>
        <div className="mt-3">
          <Field label="Result / learning">
            <TextInput
              value={item.result}
              onChange={(event) => update(item.id, { result: event.target.value })}
            />
          </Field>
        </div>
        <DeleteButton label="Delete piece" className="mt-4" onConfirm={() => remove(item.id)} />
      </div>
    </details>
  );
}
