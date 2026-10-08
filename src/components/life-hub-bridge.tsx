/**
 * Additive Life Hub bridge. Posts candle snapshots to Randy's Life Hub when
 * framed (or opened) from an allowlisted parent. Does not change site UX.
 */

import { useEffect, useRef } from "react";
import {
  attachCandleLifeHubBridge,
  postCandleSnapshot,
  type CandleBridgeData,
} from "@/lib/life-hub-bridge";
import { usePeculiar } from "@/lib/peculiar/store";

function sliceData(): CandleBridgeData {
  const state = usePeculiar.getState();
  return {
    tasks: state.tasks,
    vessels: state.vessels,
    skus: state.skus,
  };
}

export function LifeHubBridge() {
  const tasks = usePeculiar((s) => s.tasks);
  const vessels = usePeculiar((s) => s.vessels);
  const skus = usePeculiar((s) => s.skus);
  const ready = useRef(false);

  useEffect(() => {
    const detach = attachCandleLifeHubBridge({
      getData: () => sliceData(),
      completeTask: async (id) => {
        // Pick up any edits made in the Candle tab since Life Hub loaded, so this save
        // doesn't overwrite them with an older copy.
        await usePeculiar.persist.rehydrate();
        usePeculiar.getState().updateTask(id, { status: "COMPLETE" });
      },
    });
    ready.current = true;
    postCandleSnapshot(sliceData());

    const unsubHydration = usePeculiar.persist.onFinishHydration(() => {
      postCandleSnapshot(sliceData());
    });
    if (usePeculiar.persist.hasHydrated()) {
      postCandleSnapshot(sliceData());
    }

    // Life Hub keeps this page loaded in a hidden frame. When the Candle tab saves a change
    // (like completing a task), reload it here so the next snapshot reports it.
    const framed = window.parent !== window;
    const onStorage = (event: StorageEvent) => {
      if (!framed) return;
      if (event.key === null || event.key === usePeculiar.persist.getOptions().name) {
        void usePeculiar.persist.rehydrate();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      detach();
      unsubHydration();
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    postCandleSnapshot({ tasks, vessels, skus });
  }, [tasks, vessels, skus]);

  return null;
}
