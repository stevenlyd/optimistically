import { QueryClient, QueryKey } from "@tanstack/react-query";
import { testOptimisticUpdate } from "./optimistic-update/test";



const queryClient = new QueryClient();

const queryKey: QueryKey = ["test"];

interface People {
  name: string
  age: number
  gender: 'male' | 'female'
  id: number
}

const dto: People = {
  name: 'Yidong',
  age: 28,
  gender: 'male',
  id: 1
}

const { rollbackFn, onSettledFn, onSuccessFn } = testOptimisticUpdate({
  payload: {
    data: dto,
    getItemId: (item) => item.id.toString(),
  },
  queryClient,
  mainQueryKey: ['1'],
  queryData: {
    getItemId: (item: People) => item.id.toString(),
  }
})