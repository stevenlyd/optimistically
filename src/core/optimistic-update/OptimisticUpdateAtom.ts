import { QueryKey } from "@tanstack/react-query";
import { OptimisticAtom } from "./OptimisticAtom";

interface OptimisticUpdateAtomConstructor<T extends object, K extends object> {
  optimisticData: T;
  id: string;
  queryKey?: QueryKey;
  originalData: K;
}

export class OptimisticUpdateAtom<T extends object, K extends object> extends OptimisticAtom<K> {
  private readonly _optimisticData: T;

  constructor({
    id,
    queryKey,
    optimisticData,
    originalData,
  }: OptimisticUpdateAtomConstructor<T, K>) {
    super({ id, queryKey, originalData });
    if (typeof optimisticData !== "object") {
      throw new Error("Invalid optimistic data");
    }
    this._optimisticData = optimisticData;
  }

  get optimisticData() {
    return this._optimisticData;
  }
}
