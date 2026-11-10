import { useState } from "react";
import {
  AreaInput,
  DeleteButton,
  Field,
  GhostButton,
  SelectInput,
  SolidButton,
  TextInput,
} from "@/components/fields";
import { PHOTO_STAGES, type ContentItem, type PhotoBrief } from "@/lib/peculiar/types";
import { usePeculiar } from "@/lib/peculiar/store";

export function PhotoCard({ item }: { item: ContentItem }) {
  const update = usePeculiar((s) => s.updateContent);
  const remove = usePeculiar((s) => s.removeContent);
  const [extraShot, setExtraShot] = useState("");
  const photo = item.photo!;
  const patch = (change: Partial<PhotoBrief>) =>
    update(item.id, { photo: { ...photo, ...change } });
  const done = photo.shots.filter((shot) => shot.done).length;
  const fileUrl = /^https?:\/\//i.test(photo.assetLink.trim()) ? photo.assetLink.trim() : null;

  return (
    <details className="border border-line bg-sheet">
      <summary className="cursor-pointer px-4 py-4 marker:text-olive sm:px-5">
        <span className="ml-1 inline-flex max-w-full flex-col gap-1 align-middle">
          <span className="font-serif text-xl">{item.title}</span>
          <span className="text-sm text-muted">
            {photo.priority} · {photo.stage} · {done}/{photo.shots.length} shots captured
          </span>
        </span>
      </summary>
      <div className="border-t border-line p-4 sm:p-5">
        <p className="mb-4 text-sm leading-relaxed text-muted">{photo.purpose}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Brief title">
            <TextInput
              value={item.title}
              onChange={(event) => update(item.id, { title: event.target.value })}
            />
          </Field>
          <Field label="Candle / scent / vessel ID">
            <TextInput
              placeholder="Name the actual candle(s) in this set"
              value={photo.subject}
              onChange={(event) => patch({ subject: event.target.value })}
            />
          </Field>
          <Field label="Shoot priority">
            <SelectInput
              value={photo.priority}
              onChange={(event) =>
                patch({ priority: event.target.value as PhotoBrief["priority"] })
              }
            >
              <option>First shoot</option>
              <option>Second pass</option>
            </SelectInput>
          </Field>
          <Field label="Photo stage">
            <SelectInput
              value={photo.stage}
              onChange={(event) => patch({ stage: event.target.value as PhotoBrief["stage"] })}
            >
              {PHOTO_STAGES.map((stage) => (
                <option key={stage}>{stage}</option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <div className="mt-5 border-l-2 border-olive pl-3 text-sm leading-relaxed">
          <p className="font-medium">Where it goes</p>
          <p className="text-muted">{photo.placement}</p>
          <p className="mt-3 font-medium">Set it up</p>
          <p className="text-muted">{photo.setup}</p>
          <p className="mt-3 font-medium">Frame it</p>
          <p className="text-muted">{photo.framing}</p>
        </div>
        <fieldset className="mt-5">
          <legend className="mb-2 font-serif text-xl">Capture list</legend>
          <p className="mb-2 text-sm text-muted">
            Check a shot once captured. Move the set to Ready after choosing and editing the files;
            Placed means added to its intended page or library.
          </p>
          <ul className="divide-y divide-line border-y border-line">
            {photo.shots.map((shot) => (
              <li key={shot.id}>
                <label className="flex cursor-pointer items-start gap-3 py-3">
                  <input
                    className="mt-1 size-5 shrink-0 accent-forest"
                    type="checkbox"
                    checked={shot.done}
                    onChange={(event) =>
                      patch({
                        shots: photo.shots.map((current) =>
                          current.id === shot.id
                            ? { ...current, done: event.target.checked }
                            : current,
                        ),
                      })
                    }
                  />
                  <span>
                    <span className={shot.done ? "font-medium text-olive" : "font-medium"}>
                      {shot.label}
                    </span>
                    <span className="mt-1 block text-sm leading-relaxed text-muted">
                      {shot.direction}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
        <form
          className="mt-3 flex flex-wrap items-end gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!extraShot.trim()) return;
            patch({
              shots: [
                ...photo.shots,
                {
                  id: crypto.randomUUID(),
                  label: extraShot.trim(),
                  direction: "Added for this shoot.",
                  done: false,
                },
              ],
            });
            setExtraShot("");
          }}
        >
          <div className="min-w-0 flex-1">
            <Field label="Additional shot">
              <TextInput
                value={extraShot}
                onChange={(event) => setExtraShot(event.target.value)}
                placeholder="A specific angle or detail you also need"
              />
            </Field>
          </div>
          <GhostButton type="submit" disabled={!extraShot.trim()}>
            Add shot
          </GhostButton>
        </form>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field label="Folder link / file reference">
            <TextInput
              placeholder="Folder URL or saved file names"
              value={photo.assetLink}
              onChange={(event) => patch({ assetLink: event.target.value })}
            />
          </Field>
          <Field label="Shoot notes / edit notes">
            <AreaInput
              value={photo.notes}
              onChange={(event) => patch({ notes: event.target.value })}
              placeholder="Label overlay, retakes, file names, or page placement"
            />
          </Field>
        </div>
        {fileUrl ? (
          <a
            className="mt-3 inline-block break-all text-sm underline"
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open saved files
          </a>
        ) : null}
        <details className="mt-4 text-sm">
          <summary className="min-h-11 cursor-pointer py-3 text-olive">Customize the brief</summary>
          <div className="grid gap-3 pt-2 sm:grid-cols-2">
            <Field label="Purpose">
              <AreaInput
                value={photo.purpose}
                onChange={(event) => patch({ purpose: event.target.value })}
              />
            </Field>
            <Field label="Intended placement">
              <AreaInput
                value={photo.placement}
                onChange={(event) => patch({ placement: event.target.value })}
              />
            </Field>
            <Field label="Setup">
              <AreaInput
                value={photo.setup}
                onChange={(event) => patch({ setup: event.target.value })}
              />
            </Field>
            <Field label="Framing">
              <AreaInput
                value={photo.framing}
                onChange={(event) => patch({ framing: event.target.value })}
              />
            </Field>
          </div>
        </details>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SolidButton type="button" onClick={() => patch({ stage: "Captured" })}>
            Mark set captured
          </SolidButton>
          <DeleteButton label="Delete brief" onConfirm={() => remove(item.id)} />
        </div>
      </div>
    </details>
  );
}

export function ShootGuide() {
  return (
    <details className="mb-6 border border-line bg-sheet">
      <summary className="min-h-11 cursor-pointer px-4 py-3 font-medium">
        Shoot order, the one-candle burn, and file checklist
      </summary>
      <div className="grid gap-6 border-t border-line p-4 text-sm leading-relaxed lg:grid-cols-2">
        <div>
          <h3 className="font-serif text-xl">Start with the unburned candles</h3>
          <ol className="mt-3 list-decimal space-y-3 pl-5 text-muted">
            <li>
              List the finished candles and assign an ID to each exact vessel. Take a quick
              reference photo with the ID out of the final crop. Photograph every listing set before
              lighting anything.
            </li>
            <li>
              Keep one backdrop and light setup for all clean listing images. Get the front, 45°,
              top, detail, label, and scale views. Then capture the homepage, collection groups, and
              option comparisons.
            </li>
            <li>
              Capture each final label straight-on, sharp, and evenly lit. Also keep the original
              label artwork. These become the references for the burning-photo overlays.
            </li>
            <li>
              Burn only the single designated photo candle. Keep its camera position and lighting
              fixed for a wide frame, close detail, and short clips. Use unlit hands-only footage
              for the other candles.
            </li>
            <li>
              Make label-overlay versions from that one burning master. Match label perspective,
              curvature, light, and reflections. Use a variant only where its vessel and wax
              appearance match; keep exact-item listing photos true to the actual candle. Check
              moving overlays frame by frame if using video.
            </li>
          </ol>
        </div>
        <div>
          <h3 className="font-serif text-xl">Choose, edit, and place</h3>
          <ul className="mt-3 list-disc space-y-3 pl-5 text-muted">
            <li>
              Visual direction: archival, tactile, botanical, slightly eccentric. Cream or stone
              surfaces, real glass color, soft light, restrained props. Check glass reflections for
              faces; keep the shoot hands-only.
            </li>
            <li>
              Review focus, dust, label alignment, color consistency, and crop room. Keep untouched
              originals, edited masters, and website exports in separate folders.
            </li>
            <li>
              Name files consistently, for example:{" "}
              <span className="break-all font-medium text-ink">pc-vesselID-scent-front-01</span>.
              Add <span className="font-medium text-ink">burn-master</span> or{" "}
              <span className="font-medium text-ink">label-overlay</span> to distinguish those
              edits.
            </li>
            <li>
              Save a square or 4:5 listing crop and separately composed desktop/mobile hero crops.
              Export to the actual site's image requirements and check the images at phone size
              before placing them.
            </li>
            <li>
              Write descriptive alt text and confirm the image, scent, vessel, and included items
              match the page. Mark Ready after editing, then Placed after checking the intended
              page.
            </li>
          </ul>
          <p className="mt-4 border-t border-line pt-3 text-muted">
            This planner stores progress, notes, and file references. Keep the actual photo files in
            your own folders.
          </p>
        </div>
      </div>
    </details>
  );
}
