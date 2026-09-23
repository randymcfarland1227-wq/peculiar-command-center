import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Field, GhostButton, PageIntro, SolidButton, TextInput } from "@/components/fields";
import { usePeculiar } from "@/lib/peculiar/store";

export const Route = createFileRoute("/documents")({
  component: DocumentsPage,
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

function DocumentsPage() {
  const documents = usePeculiar((s) => s.documents);
  const updateDocument = usePeculiar((s) => s.updateDocument);
  const reset = usePeculiar((s) => s.reset);
  const [confirm, setConfirm] = useState(false);

  return (
    <div>
      <PageIntro
        index="13"
        kicker="Documents"
        title="The paper behind the studio"
        lede="Discovery notes, the working model, storefront instructions, insurance, formation, safety, suppliers, packaging, and brand files. Paste a link when you have one. Nothing here is invented."
      />
      <ul className="grid gap-3 md:grid-cols-2">
        {documents.map((doc) => {
          const href = safeHttp(doc.url);
          return (
            <li key={doc.id} className="border border-line bg-sheet p-4">
              <p className="text-xs tracking-widest text-olive">{doc.group}</p>
              <h2 className="mt-1 font-serif text-xl">{doc.title}</h2>
              <p className="mt-2 text-sm text-muted">{doc.detail}</p>
              <div className="mt-3">
                <Field label="Link">
                  <TextInput
                    value={doc.url}
                    placeholder="https://"
                    onChange={(event) => updateDocument(doc.id, { url: event.target.value })}
                  />
                </Field>
              </div>
              {href ? (
                <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-11 items-center text-sm text-olive">
                  Open document
                </a>
              ) : (
                <p className="mt-3 text-xs tracking-widest text-muted">No link on file</p>
              )}
            </li>
          );
        })}
      </ul>
      <section className="mt-12 border-t border-line pt-6">
        <h2 className="font-serif text-2xl">This browser</h2>
        <p className="mt-2 max-w-xl text-sm text-muted">
          Tasks, costs, scents, and notes stay in this browser. Resetting restores the original pre-launch workspace and drops your edits.
        </p>
        <div className="mt-4 flex gap-2">
          {confirm ? (
            <>
              <SolidButton type="button" onClick={() => reset()}>
                Confirm reset
              </SolidButton>
              <GhostButton type="button" onClick={() => setConfirm(false)}>
                Cancel
              </GhostButton>
            </>
          ) : (
            <GhostButton type="button" onClick={() => setConfirm(true)}>
              Reset workspace data
            </GhostButton>
          )}
        </div>
      </section>
    </div>
  );
}
