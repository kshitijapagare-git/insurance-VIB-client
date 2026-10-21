import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchPolicy } from '../api/policies'
import type { PolicySummary } from '../policy/types'

export function usePolicy(id: string | undefined): UseQueryResult<PolicySummary, Error> {
  return useQuery({
    queryKey: ['policy', id],
    queryFn: () => {
      if (!id) throw new Error('A policy id is required to fetch a policy')
      return fetchPolicy(id)
    },
    // A route without an id (or with an empty one) must not turn into a request for "/policies/".
    enabled: Boolean(id),
  })
}
