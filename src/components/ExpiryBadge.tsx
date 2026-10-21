import { Chip } from '@mui/material'
import { differenceInCalendarDays, isValid, parseISO } from 'date-fns'

const EXPIRING_SOON_DAYS = 30

export function ExpiryBadge({ endDate }: { endDate: string }) {
  const end = parseISO(endDate)

  // An unparseable date would otherwise produce NaN days and render "Expires in NaN days".
  if (!isValid(end)) {
    return null
  }

  // Calendar-day difference in the local time zone, so a late-in-the-day clock does not round it down.
  const daysLeft = differenceInCalendarDays(end, new Date())

  // Far-off renewals need no nudge, and an already expired policy must never show negative days.
  if (daysLeft > EXPIRING_SOON_DAYS || daysLeft < 0) {
    return null
  }

  return <Chip label={`Expires in ${daysLeft} days`} color="warning" size="small" />
}
