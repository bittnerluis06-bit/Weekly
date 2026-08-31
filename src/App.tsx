import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import LoginScreen from '@/auth/LoginScreen'
import AppLayout from '@/components/AppLayout'
import { LoadingState } from '@/components/States'
import MissionPage from '@/pages/MissionPage'
import ReviewPage from '@/pages/ReviewPage'
import RolesPage from '@/pages/RolesPage'
import SettingsPage from '@/pages/SettingsPage'
import TodayPage from '@/pages/TodayPage'
import WeekPage from '@/pages/WeekPage'

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
        <Route path="/heute" element={<TodayPage />} />
        <Route path="/woche" element={<WeekPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/review/:weekId" element={<ReviewPage />} />
        <Route path="/einstellungen" element={<SettingsPage />} />
        <Route path="/rollen" element={<RolesPage />} />
        <Route path="/mission" element={<MissionPage />} />
        <Route path="*" element={<Navigate to="/heute" replace />} />
      </Route>
    </Routes>
  )
}
