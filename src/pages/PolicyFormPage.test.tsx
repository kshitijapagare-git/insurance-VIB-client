import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, fireEvent, render, screen, waitFor, type RenderResult } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, vi } from 'vitest'
import { policyholdersFixture, premiumQuoteFixture } from '../mocks/handlers'
import { server } from '../mocks/server'
import { formatCurrency } from '../policy/format'
import type { PolicyType } from '../policy/types'
import { PolicyFormPage } from './PolicyFormPage'

interface RecordedQuoteRequest {
  holderId: string | null
  type: string | null
  sumInsured: string | null
  term: string | null
}

function renderFormPage(): RenderResult {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PolicyFormPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function recordQuoteRequests(): RecordedQuoteRequest[] {
  const requests: RecordedQuoteRequest[] = []
  server.use(
    http.get('*/premium-quote', ({ request }) => {
      const url = new URL(request.url)
      requests.push({
        holderId: url.searchParams.get('holderId'),
        type: url.searchParams.get('type'),
        sumInsured: url.searchParams.get('sumInsured'),
        term: url.searchParams.get('term'),
      })
      return HttpResponse.json(premiumQuoteFixture)
    }),
  )
  return requests
}

async function selectPolicyholder(name: string = policyholdersFixture[0].name) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Policyholder' }))
  fireEvent.click(await screen.findByRole('option', { name }))
}

async function selectPolicyType(policyType: PolicyType) {
  fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Policy type' }))
  fireEvent.click(await screen.findByRole('option', { name: policyType }))
}

async function fillForm({ sumInsured = '500000', term = '5' }: { sumInsured?: string; term?: string } = {}) {
  await selectPolicyholder()
  await selectPolicyType('LIFE')
  fireEvent.change(screen.getByLabelText('Term (years)'), { target: { value: term } })
  fireEvent.change(screen.getByLabelText('Sum insured'), { target: { value: sumInsured } })
}

afterEach(() => {
  vi.useRealTimers()
})

test('a burst of sum insured edits produces one quote request with the final values after 400 ms', async () => {
  const quoteRequests = recordQuoteRequests()
  renderFormPage()

  await fillForm()
  // Let the quote for the first complete set of inputs finish, then start counting from zero.
  await waitFor(() => expect(quoteRequests).toHaveLength(1))
  quoteRequests.length = 0

  const sumInsuredInput = screen.getByLabelText('Sum insured')

  vi.useFakeTimers()
  fireEvent.change(sumInsuredInput, { target: { value: '600000' } })
  fireEvent.change(sumInsuredInput, { target: { value: '700000' } })
  fireEvent.change(sumInsuredInput, { target: { value: '800000' } })

  await act(async () => {
    await vi.advanceTimersByTimeAsync(399)
  })
  expect(quoteRequests).toHaveLength(0)

  await act(async () => {
    await vi.advanceTimersByTimeAsync(4000)
  })
  vi.useRealTimers()

  await waitFor(() => expect(quoteRequests).toHaveLength(1))
  expect(quoteRequests[0]).toEqual({
    holderId: policyholdersFixture[0].id,
    type: 'LIFE',
    sumInsured: '800000',
    term: '5',
  })
})

test('shows a progress indicator while the quote is loading and the breakdown once it resolves', async () => {
  server.use(
    http.get('*/premium-quote', async () => {
      await delay(300)
      return HttpResponse.json(premiumQuoteFixture)
    }),
  )

  renderFormPage()
  await fillForm()

  expect(await screen.findByLabelText('Loading premium quote')).toBeInTheDocument()
  expect(screen.queryByText(formatCurrency(premiumQuoteFixture.total))).not.toBeInTheDocument()

  expect(await screen.findByText(formatCurrency(premiumQuoteFixture.total))).toBeInTheDocument()
  expect(screen.getByText('Base premium')).toBeInTheDocument()
  expect(screen.getByText(formatCurrency(premiumQuoteFixture.basePremium))).toBeInTheDocument()
  expect(screen.getByText('Age loading')).toBeInTheDocument()
  expect(screen.getByText(formatCurrency(premiumQuoteFixture.ageLoading))).toBeInTheDocument()
  expect(screen.getByText('GST')).toBeInTheDocument()
  expect(screen.getByText(formatCurrency(premiumQuoteFixture.gst))).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByLabelText('Loading premium quote')).not.toBeInTheDocument())
})

test('shows an alert and disables Save when the quote request fails', async () => {
  server.use(
    http.get('*/premium-quote', () =>
      HttpResponse.json({ message: 'Quote service unavailable' }, { status: 500 }),
    ),
  )

  renderFormPage()
  await fillForm()

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('Quote service unavailable')
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
})

test('does not request a quote while the sum insured is out of range', async () => {
  const quoteRequests = recordQuoteRequests()
  renderFormPage()

  await selectPolicyholder()
  await selectPolicyType('LIFE')
  fireEvent.change(screen.getByLabelText('Term (years)'), { target: { value: '5' } })

  vi.useFakeTimers()
  fireEvent.change(screen.getByLabelText('Sum insured'), { target: { value: '5000' } })

  // Well past the 400 ms debounce, so an enabled quote would already have been requested.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2000)
  })
  vi.useRealTimers()

  expect(await screen.findByText('Sum insured must be at least 10,000')).toBeInTheDocument()
  expect(quoteRequests).toHaveLength(0)

  // Positive control: the same instance does request a quote once the value is in range.
  fireEvent.change(screen.getByLabelText('Sum insured'), { target: { value: '500000' } })
  await waitFor(() => expect(quoteRequests).toHaveLength(1))
  expect(quoteRequests[0]).toEqual({
    holderId: policyholdersFixture[0].id,
    type: 'LIFE',
    sumInsured: '500000',
    term: '5',
  })
})
