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
