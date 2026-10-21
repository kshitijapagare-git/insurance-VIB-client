import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './layout/AppLayout'
import { PoliciesPage } from './pages/PoliciesPage'
import { PolicyFormPage } from './pages/PolicyFormPage'
import { PolicyholdersPage } from './pages/PolicyholdersPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route path="policyholders" element={<PolicyholdersPage />} />
        <Route path="policies" element={<PoliciesPage />} />
        <Route path="policies/new" element={<PolicyFormPage />} />
      </Route>
    </Routes>
  )
}
