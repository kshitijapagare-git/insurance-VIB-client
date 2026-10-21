import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { format, parseISO, startOfToday } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { getErrorMessage } from '../api/errors'
import { useCancelPolicy } from '../hooks/useCancelPolicy'
import { useNotify } from '../notifications/NotificationContext'
import { formatCurrency } from '../policy/format'
import { estimateRefund } from '../policy/refund'
import { createCancelPolicySchema, type CancelPolicyFormValues } from '../policy/schema'
import type { PolicySummary } from '../policy/types'

const REASON_MIN_LENGTH = 10
const REASON_MAX_LENGTH = 500

// Locale-stable and unambiguous on the confirmation summary; the request body stays ISO.
const CONFIRM_DATE_FORMAT = 'dd MMM yyyy'

function DialogSummaryRow({ label, value }: { label: string; value: string }) {
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

export function CancelPolicyDialog({
  open,
  policy,
  onClose,
}: {
  open: boolean
  policy: PolicySummary
  onClose: () => void
}) {
  const [step, setStep] = useState<'form' | 'confirm'>('form')
  const notify = useNotify()
  const cancellation = useCancelPolicy(policy.id)

  const today = startOfToday()
  const policyEndDate = useMemo(() => parseISO(policy.endDate), [policy.endDate])
  // The schema is a factory because the effective date is bounded by this policy's own end date.
  const resolver = useMemo(() => zodResolver(createCancelPolicySchema(policyEndDate)), [policyEndDate])

  const {
    register,
    control,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<CancelPolicyFormValues>({
    resolver,
    mode: 'onChange',
    // Defaulting to today means the agent sees an estimated refund as soon as the dialog opens.
    defaultValues: { reason: '', effectiveDate: today },
  })

  const reason = watch('reason') ?? ''
  const effectiveDate = watch('effectiveDate')

  // Reopening the dialog must always start on the form step, never wherever it was left.
  useEffect(() => {
    if (open) {
      setStep('form')
    }
  }, [open])

  const handleClose = () => {
    setStep('form')
    onClose()
  }

  const estimatedRefund = estimateRefund({
    premium: policy.premium,
    startDate: policy.startDate,
    endDate: policy.endDate,
    effectiveDate: effectiveDate ?? today,
  })

  const handleConfirm = () => {
    if (!effectiveDate) {
      return
    }

    cancellation.mutate(
      { reason, effectiveDate: format(effectiveDate, 'yyyy-MM-dd') },
      {
        onSuccess: (result) => {
          notify(
            `Policy ${policy.policyNumber} cancelled — refund ${formatCurrency(result.refundAmount)}`,
            'success',
          )
          handleClose()
        },
      },
    )
  }

  const reasonHelperText = errors.reason
    ? `${reason.length} / ${REASON_MAX_LENGTH} characters (minimum ${REASON_MIN_LENGTH}) · ${errors.reason.message}`
    : `${reason.length} / ${REASON_MAX_LENGTH} characters (minimum ${REASON_MIN_LENGTH})`

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>{step === 'form' ? 'Cancel policy' : 'Confirm cancellation'}</DialogTitle>
      {step === 'form' ? (
        // The form step only validates: submitting here advances to the confirmation step and
        // never reaches the mutation, so a cancellation always takes two deliberate clicks.
        <form onSubmit={handleSubmit(() => setStep('confirm'))}>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                {...register('reason')}
                label="Reason for cancellation"
                // Controlled from the watched value so the text survives the step's remount on Back.
                value={reason}
                multiline
                minRows={3}
                fullWidth
                error={Boolean(errors.reason)}
                helperText={reasonHelperText}
              />
              <Controller
                control={control}
                name="effectiveDate"
                render={({ field, fieldState }) => (
                  <DatePicker
                    label="Effective date"
                    value={field.value}
                    onChange={(date: Date | null) => field.onChange(date)}
                    minDate={today}
                    maxDate={policyEndDate}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        onBlur: field.onBlur,
                        error: Boolean(fieldState.error),
                        helperText: fieldState.error?.message,
                      },
                    }}
                  />
                )}
              />
              <DialogSummaryRow label="Estimated refund" value={formatCurrency(estimatedRefund)} />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Keep policy</Button>
            <Button type="submit" variant="contained">
              Review cancellation
            </Button>
          </DialogActions>
        </form>
      ) : (
        <>
          <DialogContent>
            <Stack spacing={1.5} sx={{ pt: 1 }}>
              <DialogSummaryRow label="Policy" value={policy.policyNumber} />
              <DialogSummaryRow label="Reason" value={reason} />
              <DialogSummaryRow
                label="Effective date"
                value={format(effectiveDate ?? today, CONFIRM_DATE_FORMAT)}
              />
              <DialogSummaryRow label="Estimated refund" value={formatCurrency(estimatedRefund)} />
              {cancellation.isError && <Alert severity="error">{getErrorMessage(cancellation.error)}</Alert>}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStep('form')} disabled={cancellation.isPending}>
              Back
            </Button>
            <Button
              onClick={handleConfirm}
              variant="contained"
              color="error"
              disabled={cancellation.isPending}
            >
              Confirm cancellation
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  )
}
