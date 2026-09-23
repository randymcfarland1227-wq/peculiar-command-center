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
      completeTask: (id) => {
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

    return () => {
      detach();
      unsubHydration();
    };
  }, []);

  useEffect(() => {
    if (!ready.current) return;
    postCandleSnapshot({ tasks, vessels, skus });
  }, [tasks, vessels, skus]);

  return null;
}
