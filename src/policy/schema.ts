import { differenceInCalendarDays, startOfDay } from 'date-fns'
import { z } from 'zod'
import type { PremiumQuoteParams } from './types'

export const premiumQuoteParamsSchema = z.object({
  holderId: z.string().min(1, { message: 'Select a policyholder' }),
  type: z.enum(['MOTOR', 'LIFE', 'HEALTH'], { message: 'Select a policy type' }),
  sumInsured: z
    .number({ message: 'Enter a sum insured between 10,000 and 10,000,000' })
    .min(10000, { message: 'Sum insured must be at least 10,000' })
    .max(10000000, { message: 'Sum insured must be at most 10,000,000' }),
  term: z
    .number({ message: 'Enter a term between 1 and 30 years' })
    .min(1, { message: 'Term must be at least 1 year' })
    .max(30, { message: 'Term must be at most 30 years' }),
}) satisfies z.ZodType<PremiumQuoteParams>

// A factory rather than a constant: the upper bound on the effective date is the individual
// policy's own end date, so the caller supplies it.
export const createCancelPolicySchema = (policyEndDate: Date) =>
  z
    .object({
      reason: z
        .string()
        .min(10, { message: 'Reason must be at least 10 characters' })
        .max(500, { message: 'Reason must be at most 500 characters' }),
      effectiveDate: z.date({ message: 'Choose an effective date' }),
    })
    // Compared in calendar days, so a picker's midnight value is not rejected by a later clock time.
    .refine((values) => differenceInCalendarDays(values.effectiveDate, startOfDay(new Date())) >= 0, {
      message: 'Effective date cannot be before today',
      path: ['effectiveDate'],
    })
    .refine((values) => differenceInCalendarDays(values.effectiveDate, policyEndDate) <= 0, {
      message: 'Effective date cannot be after the policy end date',
      path: ['effectiveDate'],
    })

export type CancelPolicyFormValues = z.infer<ReturnType<typeof createCancelPolicySchema>>
