import { differenceInCalendarDays, isValid, parseISO } from 'date-fns'

export interface RefundEstimateInput {
  premium: number
  /** ISO 'yyyy-MM-dd' */
  startDate: string
  /** ISO 'yyyy-MM-dd' */
  endDate: string
  effectiveDate: Date
}

/**
 * Pro-rata refund estimate: premium × days remaining until endDate ÷ total term days.
 * Returns 0 rather than NaN for unparseable dates or a term with no positive length.
 */
export function estimateRefund({ premium, startDate, endDate, effectiveDate }: RefundEstimateInput): number {
  const start = parseISO(startDate)
  const end = parseISO(endDate)

  if (!isValid(start) || !isValid(end) || !isValid(effectiveDate) || !Number.isFinite(premium)) {
    return 0
  }

  const totalDays = differenceInCalendarDays(end, start)
  if (totalDays <= 0) {
    return 0
  }

  // Calendar days in the local time zone, so a date picked at any clock time counts as one day.
  const remainingDays = differenceInCalendarDays(end, effectiveDate)
  // Clamped to the term: an effective date past the end date must never refund a negative amount.
  const daysLeft = Math.min(Math.max(remainingDays, 0), totalDays)

  return Math.round((premium * daysLeft) / totalDays)
}
