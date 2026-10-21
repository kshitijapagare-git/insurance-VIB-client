import { Typography } from '@mui/material'
import { ExpiringSoonWidget } from '../components/ExpiringSoonWidget'

export function PoliciesPage() {
  return (
    <>
      <ExpiringSoonWidget />
      <Typography variant="h4">Policies</Typography>
    </>
  )
}
