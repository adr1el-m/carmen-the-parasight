import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import PatientSignIn from './components/PatientSignIn'
import PatientSignUp from './components/PatientSignUp'
import PatientPortal from './components/PatientPortal'
import Dashboard from './components/Dashboard'
import PartnerSignUp from './components/PartnerSignUp'
import PartnerSignIn from './components/PartnerSignIn'
import './index.css'

const App: React.FC = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/patient-sign-in" element={<PatientSignIn />} />
        <Route path="/patient-sign-up" element={<PatientSignUp />} />
        <Route path="/patient-portal" element={<PatientPortal />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/partner-signup" element={<PartnerSignUp />} />
        <Route path="/partner-signin" element={<PartnerSignIn />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App 