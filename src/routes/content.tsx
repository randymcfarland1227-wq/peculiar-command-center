import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Field, PageIntro, SelectInput, SolidButton, TextInput } from "@/components/fields";
import { PhotoCard, ShootGuide } from "@/components/photo-planner";
import { SocialPlanner } from "@/components/social-planner";
import {
  PHOTO_TEMPLATES,
  contentKind,
  createPhotoItem,
  photoCounts,
} from "@/lib/peculiar/photo-plan";
import { uid, usePeculiar } from "@/lib/peculiar/store";
import type { ContentKind } from "@/lib/peculiar/types";

export const Route = createFileRoute("/content")({ component: ContentPage });

const STAGES: { id: ContentKind; label: string; description: string }[] = [
  {
    id: "website",
    label: "1. Website photos",
    description: "Listings, homepage, collections, choices",
  },
  {
    id: "library",
    label: "2. Photo & B-roll library",
    description: "Details, groupings, reusable footage",
  },
  {
    id: "social",
    label: "3. Social marketing",
    description: "Purpose, photo sources, invitation, results",
  },
];

function ContentPage() {
  const items = usePeculiar((s) => s.content);
  const add = usePeculiar((s) => s.addContent);
  const [stage, setStage] = useState<ContentKind>("website");
  const [priority, setPriority] = useState("All");
  const [photoStage, setPhotoStage] = useState("All");
  const [template, setTemplate] = useState("listing");
  const [subject, setSubject] = useState("");
  const [addedTitle, setAddedTitle] = useState("");
  const shown = items.filter(
    (item) =>
      contentKind(item) === stage &&
      item.photo &&
      (priority === "All" || item.photo.priority === priority) &&
      (photoStage === "All" || item.photo.stage === photoStage),
  );
  const counts = photoCounts(items.filter((item) => contentKind(item) === "website"));
  const next = items.find(
    (item) =>
      contentKind(item) === "website" &&
      item.photo &&
      item.photo.stage !== "Ready" &&
      item.photo.stage !== "Placed" &&
      item.photo.priority === "First shoot",
  );

  return (
    <div>
      <PageIntro
        index="12"
        kicker="Photos & content"
        title="Website first. Tell the story next."
        lede="Build a useful set of photos for the shop, then reuse the strongest images and footage for intentional marketing. Start with finished candles; burn only one designated photo candle."
      />
      <section
        className="mb-6 border border-line bg-forest p-5 text-paper sm:p-6"
        aria-label="Website photo progress"
      >
        <p className="text-xs tracking-widest text-paper/75">FIRST PRIORITY / WEBSITE PHOTO SET</p>
        <h2 className="mt-2 font-serif text-2xl">
          {next
            ? next.title
            : counts.total
              ? "Review the website photo set"
              : "Add the first website photo brief"}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-paper/85">
          {next?.photo?.template === "listing" && !next.photo.subject
            ? "Name your first finished candle in the listing brief below. Repeat the six-view set for each listing before shooting the groups and homepage."
            : "Capture the unburned listing photos first. Then shoot the website groups, label references, and one burning master for label-overlay versions."}
        </p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <span>
            <strong className="text-lg">
              {counts.ready}/{counts.total}
            </strong>{" "}
            website sets ready
          </span>
          <span>
            <strong className="text-lg">{counts.placed}</strong> placed
          </span>
          <span>
            <strong className="text-lg">{counts.firstShoot}</strong> first-shoot briefs
          </span>
        </div>
        <p className="mt-3 text-xs text-paper/75">
          Briefs are a shoot plan. Ready and Placed are tracked separately from captured shots.
        </p>
      </section>
      <nav className="mb-6 grid gap-2 sm:grid-cols-3" aria-label="Photo and content stages">
        {STAGES.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={stage === item.id}
            onClick={() => {
              setStage(item.id);
              setPriority("All");
              setPhotoStage("All");
              setTemplate(item.id === "library" ? "details" : "listing");
            }}
            className={`min-h-20 border p-3 text-left ${stage === item.id ? "border-olive bg-cream" : "border-line bg-sheet hover:bg-cream"}`}
          >
            <span className="block font-medium">{item.label}</span>
            <span className="mt-1 block text-xs text-muted">{item.description}</span>
          </button>
        ))}
      </nav>
      {stage === "social" ? (
        <SocialPlanner />
      ) : (
        <section
          aria-label={
            stage === "website" ? "Website photo briefs" : "Reusable photo and video briefs"
          }
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-serif text-2xl">
                {stage === "website" ? "The website shot plan" : "Build a reusable library"}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                {stage === "website"
                  ? "First shoot: individual listings, homepage, collections, and choices. Second pass: scent portraits, packaging, the vessel story, and care. Repeat briefs for each actual candle, scent, or collection that needs a set."
                  : "Capture miscellaneous candle photos and short process clips while the setup is ready. Keep these organized by subject so they are useful for the website and later posts."}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Field label="Priority">
                <SelectInput value={priority} onChange={(event) => setPriority(event.target.value)}>
                  <option>All</option>
                  <option>First shoot</option>
                  <option>Second pass</option>
                </SelectInput>
              </Field>
              <Field label="Show">
                <SelectInput
                  value={photoStage}
                  onChange={(event) => setPhotoStage(event.target.value)}
                >
                  <option value="All">All stages</option>
                  <option>To shoot</option>
                  <option>Captured</option>
                  <option>Editing</option>
                  <option>Ready</option>
                  <option>Placed</option>
                </SelectInput>
              </Field>
            </div>
          </div>
          <ShootGuide />
          <div className="flex flex-col gap-3">
            {shown.map((item) => (
              <PhotoCard key={item.id} item={item} />
            ))}
          </div>
          {!shown.length ? (
            <p className="border border-line bg-sheet p-5 text-sm text-muted">
              No briefs match these filters. Change the filters or add a new set below.
            </p>
          ) : null}
          <form
            className="mt-6 border border-line bg-cream p-4 sm:p-5"
            onSubmit={(event) => {
              event.preventDefault();
              const photo = createPhotoItem(template, uid("photo"), subject.trim());
              add(photo);
              setAddedTitle(photo.title);
              setSubject("");
              setPriority("All");
              setPhotoStage("All");
            }}
          >
            <h3 className="font-serif text-xl">
              {stage === "website" ? "Add another candle or website set" : "Add a library set"}
            </h3>
            <p className="mt-2 text-sm text-muted">
              Each new set gets its own checklist and file reference. Use a vessel ID for exact-item
              listings; a scent or collection name for shared website images.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Shot brief">
                <SelectInput value={template} onChange={(event) => setTemplate(event.target.value)}>
                  {PHOTO_TEMPLATES.filter((item) => item.kind === stage).map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Candle / scent / collection">
                <TextInput
                  required
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder="e.g. actual vessel ID + scent name"
                />
              </Field>
            </div>
            <SolidButton type="submit" className="mt-4" disabled={!subject.trim()}>
              Add photo set
            </SolidButton>
            {addedTitle ? (
              <p role="status" className="mt-3 text-sm text-olive">
                Added “{addedTitle}” at the top of the list.
              </p>
            ) : null}
          </form>
        </section>
      )}
    </div>
  );
}
