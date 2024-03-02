export type ItemOf<T> = T extends (infer U)[] ? U : T;

export type UpdateFn<U> = (prevState: U | undefined) => U | undefined;
export type Getter<U> = () => U | undefined;
export type Setter<U> = (updateFn: UpdateFn<U>) => void;

export type GetLocalStateGetter<V> = <E>(params: V) => Getter<E>;

export type GetLocalStateSetter<V> = <E>(params: V) => Setter<E>;

export type OptimisticallyConstructorParams<T, K> = {
  getLocalStateGetter: GetLocalStateGetter<T>;
  getLocalStateSetter: GetLocalStateSetter<K>;
};

export type RefresherFnParams<T, K, U> = T &
  K & {
    localStateGetter: Getter<U>;
    localStateSetter: Setter<U>;
  };

export type OptimisticUpdateFnParams<T, K, U extends object | object[]> = {
  matchFn: (item: ItemOf<U>) => boolean;
  optimisticData: Partial<ItemOf<U>>;
  refresherFn: (context: RefresherFnParams<T, K, U>) => void;
};
