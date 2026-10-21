import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { PoliciesPage } from './pages/PoliciesPage'
import { PolicyDetailPage } from './pages/PolicyDetailPage'
import { PolicyFormPage } from './pages/PolicyFormPage'
import { PolicyholdersPage } from './pages/PolicyholdersPage'

export default function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route path="policyholders" element={<PolicyholdersPage />} />
          <Route path="policies" element={<PoliciesPage />} />
          <Route path="policies/new" element={<PolicyFormPage />} />
          <Route path="policies/:id" element={<PolicyDetailPage />} />
        </Route>
      </Routes>
    </LocalizationProvider>
  )
}
