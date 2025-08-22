import React, { useMemo, useEffect, useState } from 'react'
import AppointmentCard from './AppointmentCard'
import { formatTime, formatDateTime } from '../utils/dateUtils'
interface DashboardSectionProps {
  patientData: any
  activeAppointmentsTab: 'upcoming' | 'completed' | 'cancelled'
  onAppointmentsTabClick: (tab: 'upcoming' | 'completed' | 'cancelled') => void
  onOpenModal: (modalType: string) => void
  onEditAppointment: (appointment: any) => void
  onDeleteAppointment: (appointmentId: string) => void
}

const DashboardSection: React.FC<DashboardSectionProps> = ({
  patientData,
  activeAppointmentsTab,
  onAppointmentsTabClick,
  onOpenModal,
  onEditAppointment,
  onDeleteAppointment
}) => {

  // Filter appointments based on active tab
  const filteredAppointments = useMemo(() => {
    if (!patientData?.activity?.appointments?.length) return []
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return patientData.activity.appointments.filter((appointment: any) => {
      const appointmentDate = new Date(appointment.date)
      const appointmentDateTime = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate())
      
      switch (activeAppointmentsTab) {
        case 'upcoming':
          return appointmentDateTime >= today && 
                 ['scheduled', 'confirmed', 'pending'].includes(appointment.status)
        case 'completed':
          return appointment.status === 'completed'
        case 'cancelled':
          return appointment.status === 'cancelled'
        default:
          return true
      }
    }).sort((a: any, b: any) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return activeAppointmentsTab === 'completed' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
    })
  }, [patientData?.activity?.appointments, activeAppointmentsTab])



  const getUserDisplayName = () => {
    if (patientData?.personalInfo?.fullName && patientData.personalInfo.fullName.trim()) {
      return patientData.personalInfo.fullName
    }
    if (patientData?.personalInfo?.firstName && patientData.personalInfo.lastName) {
      return `${patientData.personalInfo.firstName} ${patientData.personalInfo.lastName}`
    }
    return 'Patient'
  }

  return (
    <section className="content-section active">
      {/* Greeting Section */}
      <div className="greeting">
        <h1>Hi, <span>{getUserDisplayName()}!</span></h1>
        <h2>Welcome to your personal health dashboard</h2>
      </div>
    
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <h3>{patientData?.activity?.appointments?.filter((apt: any) => apt.status === 'scheduled').length || 0}</h3>
            <p>Upcoming Appointments</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-file-medical"></i>
          </div>
          <div className="stat-info">
            <h3>{patientData?.activity?.appointments?.length || 0}</h3>
            <p>Total Appointments</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-pills"></i>
          </div>
          <div className="stat-info">
            <h3>{patientData?.medicalInfo?.conditions ? Object.values(patientData.medicalInfo.conditions).flat().length : 0}</h3>
            <p>Medical Conditions</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fas fa-heartbeat"></i>
          </div>
          <div className="stat-info">
            <h3>{patientData?.profileComplete ? 'Complete' : 'Incomplete'}</h3>
            <p>Profile Status</p>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button className="action-btn" onClick={() => onOpenModal('bookAppointment')}>
            <i className="fas fa-calendar-plus"></i>
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      <div className="dashboard-section">
        <h3>Appointments</h3>
        

        
        {/* Appointments Tabs */}
        <div className="content-tabs" style={{ marginBottom: '20px' }}>
          <button 
            className={`tab-link ${activeAppointmentsTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => onAppointmentsTabClick('upcoming')}
          >
            Upcoming
            <span className="tab-count">
              {patientData?.activity?.appointments?.filter((apt: any) => 
                ['scheduled', 'confirmed', 'pending'].includes(apt.status) && 
                new Date(apt.date) >= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate())
              ).length || 0}
            </span>
          </button>
          <button 
            className={`tab-link ${activeAppointmentsTab === 'completed' ? 'active' : ''}`}
            onClick={() => onAppointmentsTabClick('completed')}
          >
            Completed
            <span className="tab-count">
              {patientData?.activity?.appointments?.filter((apt: any) => apt.status === 'completed').length || 0}
            </span>
          </button>
          <button 
            className={`tab-link ${activeAppointmentsTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => onAppointmentsTabClick('cancelled')}
          >
            Cancelled
            <span className="tab-count">
              {patientData?.activity?.appointments?.filter((apt: any) => apt.status === 'cancelled').length || 0}
            </span>
          </button>
        </div>
        
        <div className="appointments-list">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((appointment: any) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onEdit={onEditAppointment}
                onDelete={onDeleteAppointment}
                formatTime={formatTime}
                formatDateTime={formatDateTime}
              />
            ))
          ) : (
            <div className="no-appointments">
              <p>
                {activeAppointmentsTab === 'upcoming' && "No upcoming appointments scheduled."}
                {activeAppointmentsTab === 'completed' && "No completed appointments yet."}
                {activeAppointmentsTab === 'cancelled' && "No cancelled appointments."}
              </p>
              {activeAppointmentsTab === 'upcoming' && (
                <button 
                  className="btn-primary" 
                  onClick={() => onOpenModal('bookAppointment')}
                >
                  <i className="fas fa-calendar-plus"></i>
                  Book Appointment
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default React.memo(DashboardSection)


