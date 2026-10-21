import { apiClient } from './client'
import type { PolicySummary } from '../policy/types'

export async function fetchPolicies(expiringWithinDays?: number): Promise<PolicySummary[]> {
  // Omit the parameter entirely when no window is asked for, so the server applies its own default.
  const params = expiringWithinDays === undefined ? undefined : { expiringWithinDays }
  const response = await apiClient.get<PolicySummary[]>('/policies', { params })
  return response.data
}
