import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import LoginScreen from '@/auth/LoginScreen'
import AppLayout from '@/components/AppLayout'
import { LoadingState } from '@/components/States'
import Placeholder from '@/pages/Placeholder'

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-dvh">
        <LoadingState label="Sitzung wird geprüft" />
      </div>
    )
  }

  if (!session) return <LoginScreen />

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/heute" replace />} />
        <Route path="/heute" element={<Placeholder title="Heute" phase="Phase 4" />} />
        <Route path="/woche" element={<Placeholder title="Woche" phase="Phase 3" />} />
        <Route path="/rollen" element={<Placeholder title="Rollen & Ziele" phase="Phase 2" />} />
        <Route path="/mission" element={<Placeholder title="Mission" phase="Phase 2" />} />
        <Route path="*" element={<Navigate to="/heute" replace />} />
      </Route>
    </Routes>
  )
}
