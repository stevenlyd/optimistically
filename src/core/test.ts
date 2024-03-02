import { QueryClient, QueryKey } from "@tanstack/react-query";
import { Optimistically } from "./factory";

const optimistically = new Optimistically({
  getLocalStateGetter: <E>({
    queryKey,
    queryClient,
  }: {
    queryKey: QueryKey;
    queryClient: QueryClient;
  }) => {
    const getter = () => {
      const data = queryClient.getQueryData<E>(queryKey);
      return data;
    };
    return getter;
  },
  getLocalStateSetter: <E>({
    queryKey,
    queryClient,
  }: {
    queryKey: QueryKey;
    queryClient: QueryClient;
  }) => {
    const setter = (updateFn: (prevState: E | undefined) => E | undefined) => {
      queryClient.setQueryData<E>(queryKey, updateFn);
    };
    return setter;
  },
});

const queryClient = new QueryClient();

const queryKey: QueryKey = ["test"];

const { onSuccessFn, rollbackFn, onSettledFn } = optimistically.update<
  {
    id: number;
    name: string;
  }[]
>({
  queryClient,
  queryKey,
  optimisticData: { id: 1, name: "Optimistic" },
  matchFn: (item) => item.id === 1,
  refresherFn: async (context) => {
    const { localStateGetter, localStateSetter, queryClient, queryKey } =
      context;

    // just simply invalidate the query since we've configured the tool to use react query
    queryClient.invalidateQueries({ queryKey });
    // or fetch using other means and update the local state using the provided setter
    localStateSetter((prev) => {
      if (prev) {
        return [...prev, { id: 2, name: "Optimistic 2" }];
      }
      return prev;
    });
  },
});

onSuccessFn({
  id: 1,
  name: "Real API Response",
});

rollbackFn();

onSettledFn();
