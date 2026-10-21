import { apiClient } from './client'
import type { PolicyholderOption } from '../policy/types'

export async function fetchPolicyholders(): Promise<PolicyholderOption[]> {
  const response = await apiClient.get<PolicyholderOption[]>('/policyholders')
  return response.data
}
