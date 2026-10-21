import { addDays, format } from 'date-fns'
import { http, HttpResponse, type RequestHandler } from 'msw'
import type { PolicyholderOption, PolicySummary, PremiumQuote } from '../policy/types'

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

const isoDaysFromToday = (days: number) => format(addDays(new Date(), days), 'yyyy-MM-dd')

// Deliberately not sorted by endDate, and spanning inside/outside the 30-day window,
// so the widget's client-side ordering and its badge visibility are both observable.
export const policiesFixture: PolicySummary[] = [
  {
    id: 'pol-1',
    policyNumber: 'POL-1001',
    holderName: 'Asha Mehta',
    type: 'MOTOR',
    status: 'ACTIVE',
    endDate: isoDaysFromToday(25),
    premium: 15930,
  },
  {
    id: 'pol-2',
    policyNumber: 'POL-1002',
    holderName: 'Rahul Sharma',
    type: 'LIFE',
    status: 'ACTIVE',
    endDate: isoDaysFromToday(5),
    premium: 21450,
  },
  {
    id: 'pol-3',
    policyNumber: 'POL-1003',
    holderName: 'Meera Iyer',
    type: 'HEALTH',
    status: 'EXPIRED',
    endDate: isoDaysFromToday(-4),
    premium: 9800,
  },
  {
    id: 'pol-4',
    policyNumber: 'POL-1004',
    holderName: 'Vikram Rao',
    type: 'MOTOR',
    status: 'CANCELLED',
    endDate: isoDaysFromToday(60),
    premium: 12300,
  },
]

export const policiesHandler = http.get('*/policies', () => HttpResponse.json(policiesFixture))

export const handlers: RequestHandler[] = [
  http.get('*/policyholders', () => HttpResponse.json(policyholdersFixture)),
  policiesHandler,
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
