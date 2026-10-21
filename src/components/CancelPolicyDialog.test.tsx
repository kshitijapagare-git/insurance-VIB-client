import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { format, parseISO, subDays } from 'date-fns'
import { HttpResponse, http } from 'msw'
import { useState, type ReactNode } from 'react'
import { afterEach, vi } from 'vitest'
import { z } from 'zod'
import { policiesFixture } from '../mocks/handlers'
import { server } from '../mocks/server'
import { NotificationProvider } from '../notifications/NotificationContext'
import { formatCurrency } from '../policy/format'
import { estimateRefund } from '../policy/refund'
import type { PolicySummary } from '../policy/types'
import { CancelPolicyDialog } from './CancelPolicyDialog'

const activePolicy = policiesFixture[0]
const VALID_REASON = 'Customer sold the vehicle and no longer needs the cover'

const REASON_LABEL = 'Reason for cancellation'
const REVIEW_BUTTON = 'Review cancellation'
const CONFIRM_BUTTON = 'Confirm cancellation'
const CONFIRM_DATE_FORMAT = 'dd MMM yyyy'

// Reason lengths either side of the 10–500 character bounds the schema enforces.
const REASON_LENGTH_CASES: { length: number; blockedMessage: string | null }[] = [
  { length: 9, blockedMessage: 'Reason must be at least 10 characters' },
  { length: 10, blockedMessage: null },
  { length: 500, blockedMessage: null },
  { length: 501, blockedMessage: 'Reason must be at most 500 characters' },
]

interface RecordedCancelRequest {
  id: string
  reason: string
  effectiveDate: string
}

const cancelRequestBodySchema = z.object({ reason: z.string(), effectiveDate: z.string() })

function renderDialog(policy: PolicySummary = activePolicy, onClose: () => void = () => {}) {
  function DialogHarness() {
    const [open, setOpen] = useState(true)
    return (
      <CancelPolicyDialog
        open={open}
        policy={policy}
        onClose={() => {
          onClose()
          setOpen(false)
        }}
      />
    )
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  function Providers({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>{children}</LocalizationProvider>
        </NotificationProvider>
      </QueryClientProvider>
    )
  }

  return render(<DialogHarness />, { wrapper: Providers })
}

function expectedRefundFor(effectiveDate: Date, policy: PolicySummary = activePolicy) {
  return estimateRefund({
    premium: policy.premium,
    startDate: policy.startDate,
    endDate: policy.endDate,
    effectiveDate,
  })
}

function typeReason(reason: string) {
  fireEvent.change(screen.getByLabelText(REASON_LABEL), { target: { value: reason } })
}

async function goToConfirmationStep(reason: string = VALID_REASON) {
  typeReason(reason)
  fireEvent.click(screen.getByRole('button', { name: REVIEW_BUTTON }))
  await screen.findByRole('button', { name: CONFIRM_BUTTON })
}

/** Stands in for the cancel endpoint so a test can see exactly what was submitted, or that nothing was. */
function recordCancelRequests(refundAmount: number = 0): RecordedCancelRequest[] {
  const requests: RecordedCancelRequest[] = []
  server.use(
    http.post('*/policies/:id/cancel', async ({ params, request }) => {
      const body = cancelRequestBodySchema.parse(await request.json())
      requests.push({ id: String(params.id), reason: body.reason, effectiveDate: body.effectiveDate })
      return HttpResponse.json({ refundAmount })
    }),
  )
  return requests
}

afterEach(() => {
  vi.useRealTimers()
})

describe('CancelPolicyDialog', () => {
  test('opens on the form step with a multiline reason, a date picker and the estimated refund', () => {
    renderDialog()

    expect(screen.getByLabelText(REASON_LABEL).tagName).toBe('TEXTAREA')
    // The picker's label is rendered by the MUI X text field, once more in the outlined notch.
    expect(screen.getAllByText('Effective date').length).toBeGreaterThan(0)
    expect(screen.getByText('Estimated refund')).toBeInTheDocument()
    expect(screen.getByText(formatCurrency(expectedRefundFor(new Date())))).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: CONFIRM_BUTTON })).not.toBeInTheDocument()
  })

  test('shows a live character counter alongside the validation message', async () => {
    renderDialog()

    expect(screen.getByText(/0 \/ 500 characters/)).toBeInTheDocument()

    typeReason('Too short')
    expect(screen.getByText(/9 \/ 500 characters/)).toBeInTheDocument()
    expect(await screen.findByText(/Reason must be at least 10 characters/)).toBeInTheDocument()

    typeReason(VALID_REASON)
    expect(screen.getByText(new RegExp(`${VALID_REASON.length} / 500 characters`))).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByText(/Reason must be at least 10 characters/)).not.toBeInTheDocument(),
    )
  })

  test.each(REASON_LENGTH_CASES)('a reason of $length characters only advances when in range', async ({
    length,
    blockedMessage,
  }) => {
    const requests = recordCancelRequests()
    renderDialog()

    typeReason('r'.repeat(length))
    fireEvent.click(screen.getByRole('button', { name: REVIEW_BUTTON }))

    if (blockedMessage === null) {
      expect(await screen.findByRole('button', { name: CONFIRM_BUTTON })).toBeInTheDocument()
    } else {
      expect(await screen.findByText(new RegExp(blockedMessage))).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: CONFIRM_BUTTON })).not.toBeInTheDocument()
    }

    // Advancing to the confirmation step is a step change only: nothing is ever submitted from it.
    expect(requests).toHaveLength(0)
  })

  test('summarises the cancellation on the confirmation step and Back keeps the form values', async () => {
    renderDialog()
    await goToConfirmationStep()

    expect(screen.getByText(activePolicy.policyNumber)).toBeInTheDocument()
    expect(screen.getByText(VALID_REASON)).toBeInTheDocument()
    expect(screen.getByText(format(new Date(), CONFIRM_DATE_FORMAT))).toBeInTheDocument()
    expect(screen.getByText(formatCurrency(expectedRefundFor(new Date())))).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(await screen.findByRole('button', { name: REVIEW_BUTTON })).toBeInTheDocument()
    expect(screen.getByLabelText(REASON_LABEL)).toHaveValue(VALID_REASON)
    expect(screen.getByText(formatCurrency(expectedRefundFor(new Date())))).toBeInTheDocument()
  })

  test('Confirm submits the typed reason and the chosen date, then reports the refund in a success Snackbar', async () => {
    const refundAmount = expectedRefundFor(new Date())
    const requests = recordCancelRequests(refundAmount)
    const onClose = vi.fn()
    renderDialog(activePolicy, onClose)

    await goToConfirmationStep()
    fireEvent.click(screen.getByRole('button', { name: CONFIRM_BUTTON }))

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(requests[0]).toEqual({
      id: activePolicy.id,
      reason: VALID_REASON,
      effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    })

    const message = await screen.findByText(new RegExp(`Policy ${activePolicy.policyNumber} cancelled`))
    expect(message).toHaveTextContent(`Policy ${activePolicy.policyNumber} cancelled — refund ${formatCurrency(refundAmount)}`)
    expect(message.closest('.MuiAlert-root')).toHaveClass('MuiAlert-colorSuccess')

    expect(onClose).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('shows the server message and stays open when the cancellation is rejected', async () => {
    server.use(
      http.post('*/policies/:id/cancel', () =>
        HttpResponse.json({ message: 'Policy is already cancelled' }, { status: 409 }),
      ),
    )
    renderDialog()

    await goToConfirmationStep()
    fireEvent.click(screen.getByRole('button', { name: CONFIRM_BUTTON }))

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Policy is already cancelled')
    expect(within(dialog).getByRole('button', { name: CONFIRM_BUTTON })).toBeInTheDocument()
  })

  test('refuses an effective date after the policy end date without submitting', async () => {
    // A policy that already ended: today, the dialog's default effective date, is out of range.
    const endedPolicy: PolicySummary = {
      ...activePolicy,
      startDate: format(subDays(new Date(), 400), 'yyyy-MM-dd'),
      endDate: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
    }
    const requests = recordCancelRequests()
    renderDialog(endedPolicy)

    // Clamped at zero rather than a negative refund, since no day of the term is left.
    expect(screen.getByText(formatCurrency(0))).toBeInTheDocument()

    typeReason(VALID_REASON)
    fireEvent.click(screen.getByRole('button', { name: REVIEW_BUTTON }))

    expect(await screen.findByText(/Effective date cannot be after the policy end date/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: CONFIRM_BUTTON })).not.toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  test('refuses an effective date before today without submitting', async () => {
    // Only Date is faked, so the dialog's default effective date is today while every timer the
    // testing library waits on keeps running; moving the clock models a date that slipped behind today.
    vi.useFakeTimers({ toFake: ['Date'] })
    const endDate = parseISO(activePolicy.endDate)
    vi.setSystemTime(subDays(endDate, 10))

    const requests = recordCancelRequests()
    renderDialog()
    vi.setSystemTime(subDays(endDate, 8))

    typeReason(VALID_REASON)
    fireEvent.click(screen.getByRole('button', { name: REVIEW_BUTTON }))

    expect(await screen.findByText(/Effective date cannot be before today/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: CONFIRM_BUTTON })).not.toBeInTheDocument()
    expect(requests).toHaveLength(0)
  })

  test('estimates the refund from the effective date, which defaults to today', () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    const endDate = parseISO(activePolicy.endDate)

    vi.setSystemTime(subDays(endDate, 20))
    const earlierRender = renderDialog()
    const earlierRefund = expectedRefundFor(new Date())
    expect(screen.getByText(formatCurrency(earlierRefund))).toBeInTheDocument()
    earlierRender.unmount()

    vi.setSystemTime(subDays(endDate, 10))
    renderDialog()
    const laterRefund = expectedRefundFor(new Date())
    expect(screen.getByText(formatCurrency(laterRefund))).toBeInTheDocument()

    // Fewer days remaining means a smaller refund, so the estimate follows the effective date.
    expect(laterRefund).toBeLessThan(earlierRefund)
  })
})
