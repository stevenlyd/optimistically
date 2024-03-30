import { QueryKey } from "@tanstack/react-query";

interface OptimisticUpdateAtomConstructor<T> {
  originalData: T;
  id: string;
  queryKey?: QueryKey;
}

export class OptimisticAtom<T> {
  protected readonly _originalData: T;
  protected readonly _id: string;
  protected readonly _queryKey?: QueryKey;

  constructor({ id, queryKey, originalData }: OptimisticUpdateAtomConstructor<T>) {
    if (typeof id !== "string") {
      throw new Error("Invalid id");
    }
    this._id = id;

    if (typeof queryKey !== "string") {
      throw new Error("Invalid query key");
    }
    this._queryKey = queryKey;

    if (typeof originalData !== "object") {
      throw new Error("Invalid original data");
    }
    this._originalData = originalData;
  }

  get id() {
    if (typeof this._id === "string") {
      return this._id;
    } else {
      throw new Error("Invalid id");
    }
  }

  get queryKey() {
    if (typeof this._queryKey === "string") {
      return this._queryKey;
    } else {
      throw new Error("Invalid query key");
    }
  }

  get originalData() {
    return this._originalData;
  }
}
