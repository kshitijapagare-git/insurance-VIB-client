import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { getErrorMessage } from '../api/errors'
import { CancelPolicyDialog } from '../components/CancelPolicyDialog'
import { PolicyStatusChip } from '../components/PolicyStatusChip'
import { usePolicy } from '../hooks/usePolicy'
import { formatCurrency } from '../policy/format'

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ textAlign: 'right' }}>
        {value}
      </Typography>
    </Stack>
  )
}

export function PolicyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const policy = usePolicy(id)

  const [dialogOpen, setDialogOpen] = useState(false)

  if (policy.isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress aria-label="Loading policy" />
      </Box>
    )
  }

  if (policy.isError) {
    return <Alert severity="error">{getErrorMessage(policy.error)}</Alert>
  }

  if (!policy.data) {
    return (
      <Typography variant="body2" color="text.secondary">
        Policy not found.
      </Typography>
    )
  }

  return (
    <Box sx={{ maxWidth: 480 }}>
      <Typography variant="h4" gutterBottom>
        {policy.data.policyNumber}
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={1}>
            <DetailRow label="Policyholder" value={policy.data.holderName} />
            <DetailRow label="Type" value={policy.data.type} />
            <DetailRow label="End date" value={policy.data.endDate} />
            <DetailRow label="Premium" value={formatCurrency(policy.data.premium)} />
            <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <PolicyStatusChip status={policy.data.status} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Only a policy that is still in force can be cancelled, so nothing else gets the action. */}
      {policy.data.status === 'ACTIVE' && (
        <>
          <Button variant="outlined" color="error" sx={{ mt: 3 }} onClick={() => setDialogOpen(true)}>
            Cancel policy
          </Button>
          <CancelPolicyDialog
            open={dialogOpen}
            policy={policy.data}
            onClose={() => setDialogOpen(false)}
          />
        </>
      )}
    </Box>
  )
}
