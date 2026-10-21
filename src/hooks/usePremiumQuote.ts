import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { fetchPremiumQuote } from '../api/premium'
import { premiumQuoteParamsSchema } from '../policy/schema'
import type { PremiumQuote, PremiumQuoteParams } from '../policy/types'

export function usePremiumQuote(
  params: Partial<PremiumQuoteParams>,
  options: { debounced?: boolean } = {},
): UseQueryResult<PremiumQuote, Error> {
  const parsed = premiumQuoteParamsSchema.safeParse(params)
  const validParams = parsed.success ? parsed.data : null
  const { debounced = false } = options

  return useQuery({
    queryKey: ['premium-quote', params.holderId, params.type, params.sumInsured, params.term],
    queryFn: () => {
      if (!validParams) throw new Error('Invalid premium quote parameters')
      return fetchPremiumQuote(validParams)
    },
    // The same schema the form validates with gates the request, so the ticket's
    // "no quote until the inputs are valid" condition means the same thing in both places.
    enabled: validParams !== null,
    // Debounced params are settled, so a short stale window keeps an unchanged input
    // set from refetching on every render; live params are always fetched fresh.
    staleTime: debounced ? 5_000 : 0,
  })
}
