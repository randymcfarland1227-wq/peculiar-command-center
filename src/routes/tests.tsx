import { createFileRoute } from "@tanstack/react-router";
import { Field, PageIntro, SolidButton, TextInput, AreaInput, DeleteButton } from "@/components/fields";
import { uid, usePeculiar } from "@/lib/peculiar/store";
import type { BurnTest } from "@/lib/peculiar/types";

export const Route = createFileRoute("/tests")({
  component: TestsPage,
});

const FIELDS: { key: keyof BurnTest; label: string; area?: boolean }[] = [
  { key: "testId", label: "Test ID" },
  { key: "batch", label: "Candle batch" },
  { key: "vesselProfile", label: "Vessel profile" },
  { key: "vesselDimensions", label: "Vessel dimensions" },
  { key: "wax", label: "Wax" },
  { key: "wick", label: "Wick" },
  { key: "scent", label: "Scent" },
  { key: "fragranceLoad", label: "Fragrance load" },
  { key: "pourDate", label: "Pour date" },
  { key: "testDate", label: "Test date" },
  { key: "cureDays", label: "Cure days" },
  { key: "flame", label: "Flame behavior" },
  { key: "meltPool", label: "Melt pool" },
  { key: "soot", label: "Soot" },
  { key: "mushrooming", label: "Mushrooming" },
  { key: "glass", label: "Glass condition" },
  { key: "hotThrow", label: "Hot throw" },
  { key: "endResult", label: "End of burn" },
  { key: "notes", label: "Notes", area: true },
  { key: "photoNote", label: "Photo note", area: true },
];

function TestsPage() {
  const tests = usePeculiar((s) => s.tests);
  const updateTest = usePeculiar((s) => s.updateTest);
  const addTest = usePeculiar((s) => s.addTest);
  const removeTest = usePeculiar((s) => s.removeTest);

  return (
    <div>
      <PageIntro
        index="11"
        kicker="Burn tests"
        title="No result until a candle has cured"
        lede="Pass or fail is not a vibe. Record the vessel, wax, wick, load, cure, flame, pool, soot, glass, and throw. BT-001 is a blank sheet, not a test."
      />
      <ul className="flex flex-col gap-4">
        {tests.map((test) => (
          <li key={test.id} className="border border-line bg-sheet p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl">{test.testId || "Untitled test"}</h2>
              <select
                value={test.passFail}
                onChange={(event) => updateTest(test.id, { passFail: event.target.value as BurnTest["passFail"] })}
                className="h-11 border border-line bg-paper px-3 text-sm"
                aria-label="Pass or fail"
              >
                <option value="UNTESTED">Untested</option>
                <option value="PASS">Pass</option>
                <option value="FAIL">Fail</option>
              </select>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {FIELDS.map((field) => (
                <Field key={field.key} label={field.label}>
                  {field.area ? (
                    <AreaInput
                      value={String(test[field.key] ?? "")}
                      onChange={(event) => updateTest(test.id, { [field.key]: event.target.value })}
                    />
                  ) : (
                    <TextInput
                      type={field.key === "pourDate" || field.key === "testDate" ? "date" : "text"}
                      value={String(test[field.key] ?? "")}
                      onChange={(event) => updateTest(test.id, { [field.key]: event.target.value })}
                    />
                  )}
                </Field>
              ))}
            </div>
            <div className="mt-3">
              <DeleteButton label="Delete test" onConfirm={() => removeTest(test.id)} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <SolidButton
          type="button"
          onClick={() =>
            addTest({
              id: uid("bt"),
              testId: `BT-${String(tests.length + 1).padStart(3, "0")}`,
              batch: "",
              vesselProfile: "",
              vesselDimensions: "",
              wax: "",
              wick: "",
              scent: "",
              fragranceLoad: "6%",
              pourDate: "",
              testDate: "",
              cureDays: "",
              flame: "",
              meltPool: "",
              soot: "",
              mushrooming: "",
              glass: "",
              hotThrow: "",
              endResult: "",
              passFail: "UNTESTED",
              notes: "",
              photoNote: "",
            })
          }
        >
          New burn test
        </SolidButton>
      </div>
    </div>
  );
}
