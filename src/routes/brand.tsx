import { createFileRoute } from "@tanstack/react-router";
import { Note, PageIntro, SectionTitle } from "@/components/fields";
import { TaskList } from "@/components/task-list";
import { usePeculiar } from "@/lib/peculiar/store";

const SWATCHES = [
  { name: "Deep forest", token: "bg-forest" },
  { name: "Olive", token: "bg-olive" },
  { name: "Sage", token: "bg-sage" },
  { name: "Cream", token: "bg-cream" },
  { name: "Stone", token: "bg-paper" },
];

export const Route = createFileRoute("/brand")({
  component: BrandPage,
});

function BrandPage() {
  const allTasks = usePeculiar((s) => s.tasks);
  const allDecisions = usePeculiar((s) => s.decisions);
  const tasks = allTasks.filter((task) => task.workstream === "brand");
  const decisions = allDecisions.filter((item) => item.workstreams.includes("brand"));

  return (
    <div>
      <PageIntro
        index="03"
        kicker="Brand studio"
        title="Archive, not a rebrand"
        lede="The direction is botanical, archival, tactile, and slightly eccentric. The logo exists. Refine it. Do not replace it. Labels, packaging, and photography are still open."
      />
      <section className="mb-10 grid gap-6 md:grid-cols-2">
        <div>
          <SectionTitle title="Color" />
          <ul className="grid grid-cols-5 gap-2">
            {SWATCHES.map((swatch) => (
              <li key={swatch.name}>
                <div className={`h-16 border border-line ${swatch.token}`} />
                <p className="mt-2 text-xs tracking-widest text-muted">{swatch.name}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted">Direction, not a locked token file. Sage is a material color, not a button color.</p>
        </div>
        <div>
          <SectionTitle title="Type" />
          <p className="font-serif text-4xl">Peculiar</p>
          <p className="mt-2 text-sm text-muted">Display — expressive serif, old-world editorial.</p>
          <p className="mt-4 text-base">Sizes, prices, care, batch codes.</p>
          <p className="mt-1 text-sm text-muted">Utility — clean sans for navigation and metadata.</p>
        </div>
      </section>
      <section className="mb-10">
        <SectionTitle title="Voice" />
        <Note>Specific over green. The object should feel found. Sustainability explains the system; it does not open the sentence.</Note>
        <ul className="mt-4 grid gap-3 md:grid-cols-3">
          {["Museum shop, not rustic cabin", "Cream wax, reclaimed glass, cork", "Scent names from places and rooms"].map((line) => (
            <li key={line} className="border border-line bg-sheet p-4 font-serif text-lg">
              {line}
            </li>
          ))}
        </ul>
      </section>
      <section className="mb-10">
        <SectionTitle title="Decisions" />
        <ul className="border-t border-line">
          {decisions.map((item) => (
            <li key={item.id} className="border-b border-line py-3">
              <p className="font-serif text-lg">{item.decision}</p>
              <p className="text-sm text-muted">{item.reason}</p>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <SectionTitle title="Things to design" />
        <TaskList tasks={tasks} />
      </section>
    </div>
  );
}
