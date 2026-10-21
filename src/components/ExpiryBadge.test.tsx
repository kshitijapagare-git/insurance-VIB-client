import { render, screen } from '@testing-library/react'
import { addDays, format } from 'date-fns'
import { afterEach, beforeEach, vi } from 'vitest'
import { ExpiryBadge } from './ExpiryBadge'

// Late in the day on purpose: a calendar-day difference must not be rounded down by elapsed hours.
const TODAY = new Date(2026, 0, 15, 18, 45)

const endDateIn = (days: number) => format(addDays(TODAY, days), 'yyyy-MM-dd')

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(TODAY)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('ExpiryBadge', () => {
  test('renders nothing when more than 30 days are left', () => {
    const { container } = render(<ExpiryBadge endDate={endDateIn(31)} />)

    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText(/Expires in/)).not.toBeInTheDocument()
  })

  test('renders an amber "Expires in 30 days" chip when exactly 30 days are left', () => {
    render(<ExpiryBadge endDate={endDateIn(30)} />)

    const label = screen.getByText('Expires in 30 days')
    const chip = label.closest('.MuiChip-root')
    expect(chip).toHaveClass('MuiChip-colorWarning')
  })

  test('counts whole calendar days rather than elapsed hours', () => {
    render(<ExpiryBadge endDate={endDateIn(1)} />)

    expect(screen.getByText('Expires in 1 days')).toBeInTheDocument()
  })

  test('renders "Expires in 0 days" when the policy ends today', () => {
    render(<ExpiryBadge endDate={endDateIn(0)} />)

    expect(screen.getByText('Expires in 0 days')).toBeInTheDocument()
  })

  test('renders nothing and shows no negative day count for a past end date', () => {
    const { container } = render(<ExpiryBadge endDate={endDateIn(-5)} />)

    expect(container).toBeEmptyDOMElement()
    expect(container.textContent).not.toMatch(/-\d/)
    expect(screen.queryByText(/Expires in/)).not.toBeInTheDocument()
  })
})
