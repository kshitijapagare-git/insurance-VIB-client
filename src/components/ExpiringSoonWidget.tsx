import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'
import { getErrorMessage } from '../api/errors'
import { useExpiringPolicies } from '../hooks/useExpiringPolicies'
import { formatCurrency } from '../policy/format'
import { ExpiryBadge } from './ExpiryBadge'
import { PolicyStatusChip } from './PolicyStatusChip'

const EXPIRING_SOON_WINDOW_DAYS = 30
const MAX_WIDGET_ROWS = 10

export function ExpiringSoonWidget() {
  const policies = useExpiringPolicies(EXPIRING_SOON_WINDOW_DAYS)

  // Soonest expiry first, then the ten most urgent; ISO 'yyyy-MM-dd' strings sort chronologically
  // as text, and the copy keeps the query cache's own array in the order the server returned it.
  const soonest = useMemo(
    () =>
      [...(policies.data ?? [])]
        .sort((a, b) => a.endDate.localeCompare(b.endDate))
        .slice(0, MAX_WIDGET_ROWS),
    [policies.data],
  )

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Expiring soon
        </Typography>
        {policies.isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress aria-label="Loading expiring policies" />
          </Box>
        )}
        {policies.isError && <Alert severity="error">{getErrorMessage(policies.error)}</Alert>}
        {!policies.isLoading && !policies.isError && soonest.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No policies are expiring in the next {EXPIRING_SOON_WINDOW_DAYS} days.
          </Typography>
        )}
        {!policies.isError && soonest.length > 0 && (
          <Stack component="ul" spacing={1} sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {soonest.map((policy) => (
              <Stack
                key={policy.id}
                component="li"
                direction="row"
                spacing={1}
                sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}
              >
                <Box>
                  <Typography variant="body2">{policy.policyNumber}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {policy.holderName} · {formatCurrency(policy.premium)}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <ExpiryBadge endDate={policy.endDate} />
                  <PolicyStatusChip status={policy.status} />
                </Stack>
              </Stack>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  )
}
