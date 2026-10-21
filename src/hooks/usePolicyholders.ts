import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchPolicyholders } from '../api/policyholders'
import type { PolicyholderOption } from '../policy/types'

export function usePolicyholders(): UseQueryResult<PolicyholderOption[], Error> {
  return useQuery({
    queryKey: ['policyholders'],
    queryFn: fetchPolicyholders,
  })
}
