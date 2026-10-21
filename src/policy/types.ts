export type PolicyType = 'MOTOR' | 'LIFE' | 'HEALTH'

export const POLICY_TYPES: readonly PolicyType[] = ['MOTOR', 'LIFE', 'HEALTH']

export interface PolicyholderOption {
  id: string
  name: string
}

export interface PremiumQuoteParams {
  holderId: string
  type: PolicyType
  sumInsured: number
  term: number
}

export interface PremiumQuote {
  basePremium: number
  ageLoading: number
  gst: number
  total: number
}

export type PolicyStatus = 'ACTIVE' | 'EXPIRED' | 'CANCELLED'

export interface PolicySummary {
  id: string
  policyNumber: string
  holderName: string
  type: PolicyType
  status: PolicyStatus
  /** ISO 'yyyy-MM-dd' */
  endDate: string
  premium: number
}
