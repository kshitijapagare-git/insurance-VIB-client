import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { getErrorMessage } from '../api/errors'
import { useDebounce } from '../hooks/useDebounce'
import { usePolicyholders } from '../hooks/usePolicyholders'
import { usePremiumQuote } from '../hooks/usePremiumQuote'
import { formatCurrency } from '../policy/format'
import { premiumQuoteParamsSchema } from '../policy/schema'
import { POLICY_TYPES, type PremiumQuoteParams } from '../policy/types'

const QUOTE_DEBOUNCE_MS = 400

function PremiumRow({ label, value }: { label: string; value: number }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{formatCurrency(value)}</Typography>
    </Box>
  )
}

export function PolicyFormPage() {
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<PremiumQuoteParams>({
    resolver: zodResolver(premiumQuoteParamsSchema),
    mode: 'onChange',
  })

  const holderId = watch('holderId')
  const type = watch('type')
  const sumInsured = watch('sumInsured')
  const term = watch('term')

  const policyholders = usePolicyholders()

  // MOTOR policies are always issued for a single year, so the term is fixed at 1 and locked.
  useEffect(() => {
    if (type === 'MOTOR') {
      setValue('term', 1, { shouldValidate: true })
    }
  }, [type, setValue])

  // Keyed on the watched primitives so an unrelated re-render does not restart the debounce timer.
  const params = useMemo<Partial<PremiumQuoteParams>>(
    () => ({ holderId, type, sumInsured, term }),
    [holderId, type, sumInsured, term],
  )

  const debouncedParams = useDebounce(params, QUOTE_DEBOUNCE_MS)
  const quote = usePremiumQuote(debouncedParams, { debounced: true })

  const isMotor = type === 'MOTOR'
  // An emptied number input yields NaN, which would render as "NaN" in a controlled field.
  const termValue = Number.isFinite(term) ? String(term) : ''

  // Nothing is persisted yet: the request defines no save endpoint, so submitting only
  // validates the form and the quoted premium stays on screen for the agent to read out.
  const handleSave = () => undefined

  return (
    <Box component="form" onSubmit={handleSubmit(handleSave)} sx={{ maxWidth: 480 }}>
      <Typography variant="h4" gutterBottom>
        New policy
      </Typography>

      <Autocomplete
        options={policyholders.data ?? []}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        loading={policyholders.isLoading}
        onChange={(_, option) => setValue('holderId', option ? option.id : '', { shouldValidate: true })}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Policyholder"
            fullWidth
            error={Boolean(errors.holderId)}
            helperText={
              errors.holderId?.message ?? (policyholders.isError ? 'Could not load policyholders' : undefined)
            }
          />
        )}
      />

      <TextField
        {...register('type')}
        select
        label="Policy type"
        fullWidth
        margin="normal"
        value={type ?? ''}
        error={Boolean(errors.type)}
        helperText={errors.type?.message}
      >
        {POLICY_TYPES.map((policyType) => (
          <MenuItem key={policyType} value={policyType}>
            {policyType}
          </MenuItem>
        ))}
      </TextField>

      <TextField
        {...register('sumInsured', { valueAsNumber: true })}
        label="Sum insured"
        type="number"
        fullWidth
        margin="normal"
        error={Boolean(errors.sumInsured)}
        helperText={errors.sumInsured?.message}
      />

      <TextField
        {...register('term', { valueAsNumber: true })}
        label="Term (years)"
        type="number"
        fullWidth
        margin="normal"
        value={termValue}
        disabled={isMotor}
        error={Boolean(errors.term)}
        helperText={errors.term?.message}
      />

      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Premium breakdown
          </Typography>
          {quote.isLoading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress aria-label="Loading premium quote" />
            </Box>
          )}
          {quote.isError && <Alert severity="error">{getErrorMessage(quote.error)}</Alert>}
          {quote.data && (
            <Stack spacing={1}>
              <PremiumRow label="Base premium" value={quote.data.basePremium} />
              <PremiumRow label="Age loading" value={quote.data.ageLoading} />
              <PremiumRow label="GST" value={quote.data.gst} />
              <PremiumRow label="Total" value={quote.data.total} />
            </Stack>
          )}
          {!quote.isLoading && !quote.isError && !quote.data && (
            <Typography variant="body2" color="text.secondary">
              Fill in the policy details to see the premium.
            </Typography>
          )}
        </CardContent>
      </Card>

      <TextField
        label="Premium"
        fullWidth
        margin="normal"
        value={quote.data ? formatCurrency(quote.data.total) : ''}
        slotProps={{ input: { readOnly: true } }}
      />

      <Button
        type="submit"
        variant="contained"
        sx={{ mt: 3 }}
        disabled={quote.isLoading || quote.isError || !quote.data}
      >
        Save
      </Button>
    </Box>
  )
}
