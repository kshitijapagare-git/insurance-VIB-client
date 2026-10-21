import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { HttpResponse, delay, http } from 'msw'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, test } from 'vitest'
import App from '../App'
import { policiesFixture } from '../mocks/handlers'
import { server } from '../mocks/server'
import { NotificationProvider } from '../notifications/NotificationContext'
import { formatCurrency } from '../policy/format'

const activePolicy = policiesFixture[0]
const expiredPolicy = policiesFixture[2]
const cancelledPolicy = policiesFixture[3]

function renderAt(path: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </NotificationProvider>
    </QueryClientProvider>,
  )
}

const cancelPolicyButton = () => screen.queryByRole('button', { name: 'Cancel policy' })

describe('PolicyDetailPage', () => {
  test('shows the policy and a Cancel policy button while the policy is ACTIVE', async () => {
    renderAt(`/policies/${activePolicy.id}`)

    expect(await screen.findByRole('heading', { name: activePolicy.policyNumber })).toBeInTheDocument()
    expect(screen.getByText(activePolicy.holderName)).toBeInTheDocument()
    expect(screen.getByText(activePolicy.type)).toBeInTheDocument()
    expect(screen.getByText(activePolicy.endDate)).toBeInTheDocument()
    expect(screen.getByText(formatCurrency(activePolicy.premium))).toBeInTheDocument()
    expect(screen.getByText('ACTIVE')).toBeInTheDocument()

    expect(cancelPolicyButton()).toBeInTheDocument()
  })

  test('omits the Cancel policy button for an EXPIRED policy', async () => {
    renderAt(`/policies/${expiredPolicy.id}`)

    expect(await screen.findByRole('heading', { name: expiredPolicy.policyNumber })).toBeInTheDocument()
    expect(screen.getByText('EXPIRED')).toBeInTheDocument()

    expect(cancelPolicyButton()).not.toBeInTheDocument()
  })

  test('omits the Cancel policy button for a CANCELLED policy', async () => {
    renderAt(`/policies/${cancelledPolicy.id}`)

    expect(await screen.findByRole('heading', { name: cancelledPolicy.policyNumber })).toBeInTheDocument()
    expect(screen.getByText('CANCELLED')).toBeInTheDocument()

    expect(cancelPolicyButton()).not.toBeInTheDocument()
  })

  test('opens the cancellation dialog for an ACTIVE policy', async () => {
    renderAt(`/policies/${activePolicy.id}`)

    fireEvent.click(await screen.findByRole('button', { name: 'Cancel policy' }))

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Reason for cancellation').tagName).toBe('TEXTAREA')
    expect(within(dialog).getByText('Estimated refund')).toBeInTheDocument()
    // Still on the form step: the cancellation has not been confirmed yet.
    expect(within(dialog).queryByRole('button', { name: 'Confirm cancellation' })).not.toBeInTheDocument()
  })

  test('shows a loading indicator while the policy request is in flight', async () => {
    server.use(
      http.get('*/policies/:id', async () => {
        await delay(300)
        return HttpResponse.json(activePolicy)
      }),
    )

    renderAt(`/policies/${activePolicy.id}`)

    expect(await screen.findByLabelText('Loading policy')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: activePolicy.policyNumber })).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByLabelText('Loading policy')).not.toBeInTheDocument())
  })

  test('shows an error Alert when the policy request fails', async () => {
    server.use(
      http.get('*/policies/:id', () =>
        HttpResponse.json({ message: 'Policy service unavailable' }, { status: 500 }),
      ),
    )

    renderAt(`/policies/${activePolicy.id}`)

    // Scoped to the page body: the shared error interceptor also surfaces it in a Snackbar.
    const main = screen.getByRole('main')
    expect(await within(main).findByText('Policy service unavailable')).toBeInTheDocument()
    expect(cancelPolicyButton()).not.toBeInTheDocument()
  })

  test('/policies/new still renders the new-policy form rather than the detail page', async () => {
    renderAt('/policies/new')

    expect(await screen.findByRole('heading', { name: 'New policy' })).toBeInTheDocument()
    expect(cancelPolicyButton()).not.toBeInTheDocument()
  })
})
