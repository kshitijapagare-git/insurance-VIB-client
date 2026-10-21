import { describe, expect, test } from 'vitest'
import { estimateRefund } from './refund'

// A ten-day term so the pro-rata fractions are exact and easy to read.
const startDate = '2025-01-01'
const endDate = '2025-01-11'
const premium = 1000

describe('estimateRefund', () => {
  test('refunds half the premium for an effective date halfway through the term', () => {
    expect(estimateRefund({ premium, startDate, endDate, effectiveDate: new Date(2025, 0, 6) })).toBe(500)
  })

  test('refunds the full premium on the first day of the term', () => {
    expect(estimateRefund({ premium, startDate, endDate, effectiveDate: new Date(2025, 0, 1) })).toBe(1000)
  })

  test('refunds nothing on the last day of the term', () => {
    expect(estimateRefund({ premium, startDate, endDate, effectiveDate: new Date(2025, 0, 11) })).toBe(0)
  })

  test('refunds nothing, never a negative amount, after the end date', () => {
    expect(estimateRefund({ premium, startDate, endDate, effectiveDate: new Date(2025, 0, 20) })).toBe(0)
  })

  test('rounds the pro-rata share to a whole rupee', () => {
    // Three-day term, one day remaining: 1000 × 1 / 3 = 333.33…
    expect(
      estimateRefund({
        premium,
        startDate: '2025-03-01',
        endDate: '2025-03-04',
        effectiveDate: new Date(2025, 2, 3),
      }),
    ).toBe(333)
  })

  test('returns 0 for an unparseable start or end date', () => {
    expect(estimateRefund({ premium, startDate: 'not-a-date', endDate, effectiveDate: new Date(2025, 0, 6) })).toBe(0)
    expect(estimateRefund({ premium, startDate, endDate: 'not-a-date', effectiveDate: new Date(2025, 0, 6) })).toBe(0)
  })

  test('returns 0 for an unparseable effective date', () => {
    expect(estimateRefund({ premium, startDate, endDate, effectiveDate: new Date('not-a-date') })).toBe(0)
  })

  test('returns 0 when the term has no positive length', () => {
    // endDate before startDate, and a zero-length term.
    expect(estimateRefund({ premium, startDate: endDate, endDate: startDate, effectiveDate: new Date(2025, 0, 1) })).toBe(0)
    expect(estimateRefund({ premium, startDate, endDate: startDate, effectiveDate: new Date(2025, 0, 1) })).toBe(0)
  })
})
