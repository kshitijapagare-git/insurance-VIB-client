import { addDays, format, parseISO } from 'date-fns'
import { http, HttpResponse, type RequestHandler } from 'msw'
import { z } from 'zod'
import { estimateRefund } from '../policy/refund'
import type { PolicyholderOption, PolicyStatus, PolicySummary, PremiumQuote } from '../policy/types'

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
// Every startDate is a year before its endDate, so a pro-rata refund estimate has a full term to work with.
export const policiesFixture: PolicySummary[] = [
  {
    id: 'pol-1',
    policyNumber: 'POL-1001',
    holderName: 'Asha Mehta',
    type: 'MOTOR',
    status: 'ACTIVE',
    startDate: isoDaysFromToday(-340),
    endDate: isoDaysFromToday(25),
    premium: 15930,
  },
  {
    id: 'pol-2',
    policyNumber: 'POL-1002',
    holderName: 'Rahul Sharma',
    type: 'LIFE',
    status: 'ACTIVE',
    startDate: isoDaysFromToday(-360),
    endDate: isoDaysFromToday(5),
    premium: 21450,
  },
  {
    id: 'pol-3',
    policyNumber: 'POL-1003',
    holderName: 'Meera Iyer',
    type: 'HEALTH',
    status: 'EXPIRED',
    startDate: isoDaysFromToday(-369),
    endDate: isoDaysFromToday(-4),
    premium: 9800,
  },
  {
    id: 'pol-4',
    policyNumber: 'POL-1004',
    holderName: 'Vikram Rao',
    type: 'MOTOR',
    status: 'CANCELLED',
    startDate: isoDaysFromToday(-305),
    endDate: isoDaysFromToday(60),
    premium: 12300,
  },
]

// Stands in for the server's own record of a status change: a cancelled policy must read back
// as CANCELLED from both the list and the detail endpoint. resetPolicyMocks clears it per test.
export const policyStatusOverrides = new Map<string, PolicyStatus>()

export function resetPolicyMocks() {
  policyStatusOverrides.clear()
}

const withStatusOverrides = (policies: PolicySummary[]): PolicySummary[] =>
  policies.map((policy) => {
    const status = policyStatusOverrides.get(policy.id)
    return status === undefined ? policy : { ...policy, status }
  })

export const policiesHandler = http.get('*/policies', () =>
  HttpResponse.json(withStatusOverrides(policiesFixture)),
)

export const policyDetailHandler = http.get('*/policies/:id', ({ params }) => {
  const policy = policiesFixture.find((fixture) => fixture.id === params.id)
  if (!policy) {
    return HttpResponse.json({ message: `Policy ${params.id} not found` }, { status: 404 })
  }
  return HttpResponse.json(withStatusOverrides([policy])[0])
})

const cancelPolicyBodySchema = z.object({
  reason: z.string().min(1),
  effectiveDate: z.string().min(1),
})

// No cancellation endpoint exists yet, so this handler stands in for it: the refund comes from the
// same helper the dialog uses, and the new status is recorded so a refetched detail reads CANCELLED.
export const cancelPolicyHandler = http.post('*/policies/:id/cancel', async ({ params, request }) => {
  const policy = policiesFixture.find((fixture) => fixture.id === params.id)
  if (!policy) {
    return HttpResponse.json({ message: `Policy ${params.id} not found` }, { status: 404 })
  }

  const parsed = cancelPolicyBodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return HttpResponse.json(
      { message: 'A cancellation reason and effective date are required' },
      { status: 400 },
    )
  }

  const refundAmount = estimateRefund({
    premium: policy.premium,
    startDate: policy.startDate,
    endDate: policy.endDate,
    effectiveDate: parseISO(parsed.data.effectiveDate),
  })

  policyStatusOverrides.set(policy.id, 'CANCELLED')

  return HttpResponse.json({ refundAmount })
})

export const handlers: RequestHandler[] = [
  http.get('*/policyholders', () => HttpResponse.json(policyholdersFixture)),
  policiesHandler,
  policyDetailHandler,
  cancelPolicyHandler,
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
