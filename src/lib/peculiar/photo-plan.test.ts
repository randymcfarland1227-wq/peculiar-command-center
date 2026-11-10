import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  addPhotoPlan,
  contentKind,
  createPhotoItem,
  marketingFor,
  photoCounts,
  PHOTO_TEMPLATES,
} from "./photo-plan.ts";
import type { ContentItem, PeculiarData } from "./types.ts";

const legacy: ContentItem = {
  id: "ct1",
  title: "My edited idea",
  pillar: "Vessel Sourcing",
  platform: "My platform",
  footage: "My footage",
  caption: "My caption",
  publishDate: "2026-12-01",
  result: "My result",
  status: "COMPLETE",
};

describe("Website-first photo plan", () => {
  it("preserves every saved content field and the input while appending missing photo briefs", () => {
    const mine = createPhotoItem("listing", "photo-listing", "My existing set");
    mine.photo!.shots[0].done = true;
    mine.photo!.notes = "Keep these notes";
    const before = { content: [legacy, mine], tasks: [{ id: "keep" }] } as PeculiarData;
    const copy = structuredClone(before);
    const next = addPhotoPlan(before);
    assert.deepEqual(before, copy);
    assert.deepEqual(next.content.slice(0, 2), copy.content);
    assert.equal(next.tasks, before.tasks);
    assert.equal(next.content.length, PHOTO_TEMPLATES.length + 1);
    assert.deepEqual(
      addPhotoPlan(next),
      next,
      "a repeated addition never duplicates briefs or replaces progress",
    );
  });

  it("keeps deleted legacy ideas deleted rather than restoring the original social list", () => {
    const next = addPhotoPlan({ content: [] } as unknown as PeculiarData);
    assert.ok(next.content.every((item) => contentKind(item) !== "social"));
  });

  it("creates independent candle sets so checking one never checks another", () => {
    const first = createPhotoItem("listing", "one", "V001");
    const second = createPhotoItem("listing", "two", "V002");
    first.photo!.shots[0].done = true;
    first.photo!.subject = "changed";
    assert.equal(second.photo!.shots[0].done, false);
    assert.equal(second.photo!.subject, "V002");
    assert.equal(createPhotoItem("listing", "three").photo!.shots[0].done, false);
    assert.equal(first.photo!.shots.length, 6);
  });

  it("keeps old records in social marketing and supplies a brief without changing the record", () => {
    const copy = structuredClone(legacy);
    assert.equal(contentKind(legacy), "social");
    assert.ok(marketingFor(legacy).sourceIds.includes("photo-story"));
    assert.deepEqual(legacy, copy);
    const edited = { ...legacy, marketing: { ...marketingFor(legacy), hook: "My hook" } };
    assert.equal(marketingFor(edited).hook, "My hook");
  });

  it("never counts captured or edited photos as Ready, and tracks placement separately", () => {
    const items = Array.from({ length: 5 }, (_, i) => createPhotoItem("listing", String(i)));
    items[1].photo!.stage = "Captured";
    items[2].photo!.stage = "Editing";
    items[3].photo!.stage = "Ready";
    items[4].photo!.stage = "Placed";
    assert.deepEqual(photoCounts([...items, legacy]), {
      total: 5,
      firstShoot: 5,
      ready: 2,
      placed: 1,
    });
  });

  it("includes the single burning master and label references without requiring a burn per listing", () => {
    const burn = createPhotoItem("care", "burn");
    assert.match(burn.photo!.setup, /single candle/);
    assert.match(burn.photo!.purpose, /label-overlay/);
    const listing = createPhotoItem("listing", "listing");
    assert.match(listing.photo!.setup, /unburned/);
    assert.ok(listing.photo!.shots.some((shot) => /overlay reference/.test(shot.label)));
    assert.ok(!listing.photo!.shots.some((shot) => /burning/.test(shot.label)));
  });
});
