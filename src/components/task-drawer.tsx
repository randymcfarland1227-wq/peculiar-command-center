import { X } from "lucide-react";
import { useEffect } from "react";
import { Field, SelectInput, TextInput, AreaInput, GhostButton, SolidButton } from "@/components/fields";
import { PRIORITIES, STATUSES, WORKSTREAMS, WORKSTREAM_LABEL, LAUNCH_AREAS } from "@/lib/peculiar/types";
import { usePeculiar } from "@/lib/peculiar/store";

export function TaskDrawer() {
  const draft = usePeculiar((s) => s.draft);
  const openTaskId = usePeculiar((s) => s.openTaskId);
  const tasks = usePeculiar((s) => s.tasks);
  const task = tasks.find((item) => item.id === openTaskId) ?? null;
  const updateTask = usePeculiar((s) => s.updateTask);
  const updateDraft = usePeculiar((s) => s.updateDraft);
  const commitDraft = usePeculiar((s) => s.commitDraft);
  const cancelDraft = usePeculiar((s) => s.cancelDraft);
  const setOpenTask = usePeculiar((s) => s.setOpenTask);
  const removeTask = usePeculiar((s) => s.removeTask);
  const experiments = usePeculiar((s) => s.experiments);
  const suppliers = usePeculiar((s) => s.suppliers);

  const record = draft ?? task;
  const open = Boolean(record);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (draft) cancelDraft();
        else setOpenTask(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, draft, cancelDraft, setOpenTask]);

  if (!record) return null;

  const patch = (next: Partial<typeof record>) => {
    if (draft) updateDraft(next);
    else if (task) updateTask(task.id, next);
  };

  const close = () => {
    if (draft) cancelDraft();
    else setOpenTask(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/30" onClick={close}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={draft ? "New task" : "Edit task"}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-paper"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="text-xs tracking-widest text-olive">{draft ? "New task" : "Task"}</p>
          <button type="button" className="flex h-11 w-11 items-center justify-center" aria-label="Close" onClick={close}>
            <X className="size-4" />
          </button>
        </div>
        <div className="flex flex-col gap-4 px-4 py-5">
          <Field label="Title">
            <TextInput value={record.title} onChange={(event) => patch({ title: event.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Workstream">
              <SelectInput value={record.workstream} onChange={(event) => patch({ workstream: event.target.value as typeof record.workstream })}>
                {WORKSTREAMS.map((item) => (
                  <option key={item} value={item}>
                    {WORKSTREAM_LABEL[item]}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Section">
              <TextInput value={record.section} onChange={(event) => patch({ section: event.target.value })} />
            </Field>
            <Field label="Status">
              <SelectInput value={record.status} onChange={(event) => patch({ status: event.target.value as typeof record.status })}>
                {STATUSES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Priority">
              <SelectInput value={record.priority} onChange={(event) => patch({ priority: event.target.value as typeof record.priority })}>
                {PRIORITIES.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Due">
              <TextInput type="date" value={record.due} onChange={(event) => patch({ due: event.target.value })} />
            </Field>
            <Field label="Owner">
              <TextInput value={record.owner} onChange={(event) => patch({ owner: event.target.value })} />
            </Field>
          </div>
          <Field label="Notes">
            <AreaInput value={record.notes} onChange={(event) => patch({ notes: event.target.value })} />
          </Field>
          <Field label="Dependencies">
            <TextInput value={record.dependencies} onChange={(event) => patch({ dependencies: event.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cost">
              <TextInput value={record.cost} onChange={(event) => patch({ cost: event.target.value })} />
            </Field>
            <Field label="Link">
              <TextInput value={record.link} onChange={(event) => patch({ link: event.target.value })} />
            </Field>
          </div>
          <Field label="Launch gate">
            <SelectInput value={record.launchArea} onChange={(event) => patch({ launchArea: event.target.value as typeof record.launchArea })}>
              <option value="">None</option>
              {LAUNCH_AREAS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Related experiment">
            <SelectInput
              value={record.relatedExperiment}
              onChange={(event) => patch({ relatedExperiment: event.target.value })}
            >
              <option value="">None</option>
              {experiments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Related supplier">
            <SelectInput value={record.relatedSupplier} onChange={(event) => patch({ relatedSupplier: event.target.value })}>
              <option value="">None</option>
              {suppliers.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.category}: {item.name}
                </option>
              ))}
            </SelectInput>
          </Field>
          {record.completedDate ? <p className="text-xs tracking-widest text-muted">Completed {record.completedDate}</p> : null}
        </div>
        <div className="mt-auto flex gap-2 border-t border-line px-4 py-4">
          {draft ? (
            <SolidButton type="button" disabled={!record.title.trim()} onClick={() => commitDraft()}>
              Add task
            </SolidButton>
          ) : (
            <GhostButton
              type="button"
              onClick={() => {
                if (task) removeTask(task.id);
              }}
            >
              Remove
            </GhostButton>
          )}
          <GhostButton type="button" onClick={close}>
            Close
          </GhostButton>
        </div>
      </aside>
    </div>
  );
}
