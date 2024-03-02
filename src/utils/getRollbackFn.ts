import { QueryClient, QueryKey } from "@tanstack/react-query";

export type GetRollbackFnParams = {
  queryClient: QueryClient;
  queryKey: QueryKey;
  previousData: object | object[] | undefined;
};

/**
 * Returns a rollback function that can be used to revert optimistic updates.
 * The rollback function sets the previous data for a given query key and invalidates the query.
 *
 * @param params - The parameters for creating the rollback function.
 * @param params.queryClient - The query client instance.
 * @param params.queryKey - The query key for the data to be rolled back.
 * @param params.previousData - The previous data to be set for the query key.
 * @returns The rollback function.
 */
export const getRollbackFn = (params: GetRollbackFnParams) => {
  const { queryClient, queryKey, previousData } = params;
  return () => {
    queryClient.setQueryData<typeof previousData>(queryKey, previousData);
    queryClient.invalidateQueries({ queryKey });
  };
};
