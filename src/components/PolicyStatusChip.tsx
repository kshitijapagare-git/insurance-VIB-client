import { Chip, type ChipProps } from '@mui/material'
import type { PolicyStatus } from '../policy/types'

// Exhaustive over PolicyStatus, so a new status value cannot silently fall back to a default colour.
const STATUS_CHIP_COLORS: Record<PolicyStatus, ChipProps['color']> = {
  ACTIVE: 'success',
  EXPIRED: 'default',
  CANCELLED: 'error',
}

export function PolicyStatusChip({ status }: { status: PolicyStatus }) {
  return <Chip label={status} color={STATUS_CHIP_COLORS[status]} size="small" />
}
