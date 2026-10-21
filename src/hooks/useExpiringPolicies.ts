import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchPolicies } from '../api/policies'
import type { PolicySummary } from '../policy/types'

export function useExpiringPolicies(expiringWithinDays: number): UseQueryResult<PolicySummary[], Error> {
  return useQuery({
    queryKey: ['policies', 'expiring-soon', expiringWithinDays],
    queryFn: () => fetchPolicies(expiringWithinDays),
  })
}
