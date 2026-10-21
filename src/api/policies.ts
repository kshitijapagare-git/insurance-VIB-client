import { apiClient } from './client'
import type { CancelPolicyRequest, CancelPolicyResult, PolicySummary } from '../policy/types'

export async function fetchPolicies(expiringWithinDays?: number): Promise<PolicySummary[]> {
  // Omit the parameter entirely when no window is asked for, so the server applies its own default.
  const params = expiringWithinDays === undefined ? undefined : { expiringWithinDays }
  const response = await apiClient.get<PolicySummary[]>('/policies', { params })
  return response.data
}

export async function fetchPolicy(id: string): Promise<PolicySummary> {
  const response = await apiClient.get<PolicySummary>(`/policies/${id}`)
  return response.data
}

export async function cancelPolicy(id: string, body: CancelPolicyRequest): Promise<CancelPolicyResult> {
  const response = await apiClient.post<CancelPolicyResult>(`/policies/${id}/cancel`, body)
  return response.data
}
