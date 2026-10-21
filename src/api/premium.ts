import { apiClient } from './client'
import type { PremiumQuote, PremiumQuoteParams } from '../policy/types'

export async function fetchPremiumQuote(params: PremiumQuoteParams): Promise<PremiumQuote> {
  const response = await apiClient.get<PremiumQuote>('/premium-quote', { params })
  return response.data
}
