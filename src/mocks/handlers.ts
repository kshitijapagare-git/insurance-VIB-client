import { http, HttpResponse, type RequestHandler } from 'msw'
import type { PolicyholderOption, PremiumQuote } from '../policy/types'

export const policyholdersFixture: PolicyholderOption[] = [
  { id: 'ph-1', name: 'Asha Mehta' },
  { id: 'ph-2', name: 'Rahul Sharma' },
]

export const premiumQuoteFixture: PremiumQuote = {
  basePremium: 12000,
  ageLoading: 1500,
  gst: 2430,
  total: 15930,
}

export const handlers: RequestHandler[] = [
  http.get('*/policyholders', () => HttpResponse.json(policyholdersFixture)),
  http.get('*/premium-quote', ({ request }) => {
    const url = new URL(request.url)
    return HttpResponse.json({
      ...premiumQuoteFixture,
      holderId: url.searchParams.get('holderId'),
      type: url.searchParams.get('type'),
      sumInsured: url.searchParams.get('sumInsured'),
      term: url.searchParams.get('term'),
    })
  }),
]
