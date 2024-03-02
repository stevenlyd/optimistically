import {
  Getter,
  ItemOf,
  OptimisticUpdateFnParams,
  OptimisticallyConstructorParams,
  Setter,
} from "../types/types";
import { getReplaceItemFn } from "../utils/getReplaceItemFn";

export class Optimistically<T extends object, K extends object> {
  protected getLocalStateGetter<E>(variables: T): Getter<E> {
    throw new Error("getLocalStateGetter hasn't been initialized");
  }

  protected getLocalStateSetter<E>(variables: K): Setter<E> {
    return () => {
      throw new Error("getLocalStateSetterhasn't been initialized");
    };
  }

  constructor({
    getLocalStateGetter,
    getLocalStateSetter,
  }: OptimisticallyConstructorParams<T, K>) {
    this.getLocalStateGetter = getLocalStateGetter;
    this.getLocalStateSetter = getLocalStateSetter;
  }

  update<U extends object | object[]>(
    params: T & K & OptimisticUpdateFnParams<T, K, U>
  ) {
    const { optimisticData, matchFn, refresherFn, ...rest } = params;
    const localStateGetter = this.getLocalStateGetter<ItemOf<U> | ItemOf<U>[]>(
      params
    );
    const localStateSetter = this.getLocalStateSetter<ItemOf<U> | ItemOf<U>[]>(
      params
    );

    const items = localStateGetter();
    const previousData = structuredClone(items);

    localStateSetter((currentState) => {
      if (Array.isArray(currentState)) {
        const { itemExists, replaceItemFn } = getReplaceItemFn({
          array: currentState,
          item: optimisticData,
          matchFn,
        });

        if (itemExists) {
          return replaceItemFn(currentState);
        }
      } else {
        const singleItem = currentState;

        if (singleItem && matchFn(singleItem)) {
          return { ...singleItem, ...optimisticData };
        }
      }
      return currentState;
    });

    const onSuccessFn = (returnedData: ItemOf<U>) => {
      localStateSetter((optimisticState) => {
        if (Array.isArray(optimisticState)) {
          const { itemExists, replaceItemFn } = getReplaceItemFn({
            array: optimisticState,
            item: returnedData,
            matchFn,
          });

          if (itemExists) {
            return replaceItemFn(optimisticState);
          }
        } else {
          const singleItem = optimisticState;

          if (singleItem && matchFn(singleItem)) {
            return { ...singleItem, ...returnedData };
          }
        }
        return optimisticState;
      });
    };

    const rollbackFn = () => {
      localStateSetter(() => previousData);
    };

    const onSettledFn = () => {
      refresherFn({
        localStateGetter: localStateGetter as Getter<U>,
        localStateSetter: localStateSetter as Setter<U>,
        ...(rest as T & K),
      });
    };

    return {
      previousData: previousData as U extends object[]
        ? U | undefined
        : U | undefined,
      onSuccessFn,
      rollbackFn,
      onSettledFn,
    };
  }
}
