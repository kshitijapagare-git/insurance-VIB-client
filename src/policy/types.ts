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
