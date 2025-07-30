import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../config/firebase'
import { signOut } from 'firebase/auth'
import '../styles/shared-header.css'
import '../styles/dashboard.css'
import '../styles/csp-utilities.css'

// Types for better type safety
interface User {
  displayName: string | null
  email: string | null
  uid: string
}

interface Appointment {
  id: string
  doctorName: string
  specialty: string
  time: string
  patientName: string
  type: string
  status: 'confirmed' | 'pending' | 'virtual'
}

interface Activity {
  id: string
  type: 'patient' | 'appointment' | 'upload'
  title: string
  description: string
  timestamp: string
  icon: string
}

interface PatientRecord {
  id: string
  date: string
  day: string
  time: string
  issue: string
  patientName: string
  hasDocuments: boolean
}

interface AvailabilitySlot {
  id: string
  clinic: string
  time: string
  date: string
}

interface DashboardStats {
  totalPatients: number
  staffMembers: number
  todayAppointments: number
  virtualConsultations: number
}

interface QuickAction {
  id: string
  title: string
  icon: string
  action: string
  description: string
}

const Dashboard: React.FC = React.memo(() => {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<'dashboard' | 'patient-records' | 'my-availability' | 'my-consults' | 'online-consult' | 'help'>('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('Yesterday')
  const [availabilityEnabled, setAvailabilityEnabled] = useState(true)
  const [consultationTypes, setConsultationTypes] = useState({
    whatsapp: false,
    video: true,
    phone: false
  })
  const [consultationDuration, setConsultationDuration] = useState('30')
  const [consultationFees, setConsultationFees] = useState('500')
  const [lastActivity, setLastActivity] = useState<Date>(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const sidebarRef = useRef<HTMLElement>(null)
  const sidebarOverlayRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  // Memoized data for better performance
  const appointments: Appointment[] = useMemo(() => [
    {
      id: '1',
      doctorName: 'Dr. Maria Santos',
      specialty: 'Cardiology - Room 301',
      time: '9:30 AM',
      patientName: 'John Doe (Consultation)',
      type: 'in-person',
      status: 'confirmed'
    },
    {
      id: '2',
      doctorName: 'Dr. Juan Dela Cruz',
      specialty: 'Pediatrics - Room 205',
      time: '11:00 AM',
      patientName: 'Sarah Johnson (Follow-up)',
      type: 'in-person',
      status: 'pending'
    },
    {
      id: '3',
      doctorName: 'Dr. Ana Gonzales',
      specialty: 'Dermatology - Room 102',
      time: '2:30 PM',
      patientName: 'Mike Chen (Virtual)',
      type: 'virtual',
      status: 'virtual'
    }
  ], [])

  const activities: Activity[] = useMemo(() => [
    {
      id: '1',
      type: 'patient',
      title: 'New Patient Registered',
      description: 'Maria Santos joined the patient portal',
      timestamp: '2 hours ago',
      icon: 'fas fa-user-plus'
    },
    {
      id: '2',
      type: 'appointment',
      title: 'Appointment Confirmed',
      description: 'Dr. Juan Dela Cruz - Pediatrics consultation',
      timestamp: '4 hours ago',
      icon: 'fas fa-calendar-check'
    },
    {
      id: '3',
      type: 'upload',
      title: 'Lab Results Uploaded',
      description: 'Blood work results for Patient #2547',
      timestamp: '1 day ago',
      icon: 'fas fa-file-upload'
    }
  ], [])

  const patientRecords: PatientRecord[] = useMemo(() => [
    {
      id: '1',
      date: '15',
      day: 'Thu',
      time: '09:00am - 09:30am',
      issue: 'Fever',
      patientName: 'Stephine Claire',
      hasDocuments: true
    },
    {
      id: '2',
      date: '16',
      day: 'Fri',
      time: '09:00am - 09:30am',
      issue: 'Fever',
      patientName: 'Stephine Claire',
      hasDocuments: true
    },
    {
      id: '3',
      date: '19',
      day: 'Mon',
      time: '09:00am - 09:30am',
      issue: 'Fever',
      patientName: 'Stephine Claire',
      hasDocuments: false
    }
  ], [])

  const availabilitySlots: AvailabilitySlot[] = useMemo(() => [
    {
      id: '1',
      clinic: 'Sit at clinic 1',
      time: '10:00am - 11:00am',
      date: 'Nov 01, 2022'
    },
    {
      id: '2',
      clinic: 'Sit at clinic 2',
      time: '10:00am - 11:00am',
      date: 'Nov 01, 2022'
    },
    {
      id: '3',
      clinic: 'Sit at clinic 3',
      time: '10:00am - 11:00am',
      date: 'Nov 01, 2022'
    }
  ], [])

  // Dashboard statistics
  const dashboardStats: DashboardStats = useMemo(() => ({
    totalPatients: 2547,
    staffMembers: 45,
    todayAppointments: 128,
    virtualConsultations: 34
  }), [])

  // Quick actions configuration
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'add-patient',
      title: 'Register Patient',
      icon: 'fas fa-user-plus',
      action: 'add-patient',
      description: 'Add a new patient to the system'
    },
    {
      id: 'schedule',
      title: 'Schedule Appointment',
      icon: 'fas fa-calendar-plus',
      action: 'schedule',
      description: 'Book a new appointment'
    },
    {
      id: 'add-staff',
      title: 'Add Staff Member',
      icon: 'fas fa-user-md',
      action: 'add-staff',
      description: 'Register a new staff member'
    },
    {
      id: 'reports',
      title: 'View Reports',
      icon: 'fas fa-chart-bar',
      action: 'reports',
      description: 'Access analytics and reports'
    }
  ], [])

  useEffect(() => {
    // Check authentication
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user)
        setIsLoading(false)
      } else {
        navigate('/business-sign-in')
      }
    })

    return () => unsubscribe()
  }, [navigate])

  // Auto-refresh user activity
  useEffect(() => {
    const interval = setInterval(() => {
      setLastActivity(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }, [navigate])

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev)
  }, [])

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
  }, [])

  const handleNavClick = useCallback((section: 'dashboard' | 'patient-records' | 'my-availability' | 'my-consults' | 'online-consult' | 'help') => {
    setActiveSection(section)
    closeSidebar()
  }, [closeSidebar])

  const handleTabClick = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])

  const handleQuickAction = useCallback((action: string) => {
    console.log(`Executing quick action: ${action}`)
    
    switch (action) {
      case 'add-patient':
        showNotification('Opening patient registration form...', 'info')
        // In production, this would open a modal or navigate to registration
        break
      case 'schedule':
        showNotification('Opening appointment scheduler...', 'info')
        // In production, this would open the appointment booking interface
        break
      case 'add-staff':
        showNotification('Opening staff registration form...', 'info')
        // In production, this would open staff management interface
        break
      case 'reports':
        showNotification('Loading analytics dashboard...', 'info')
        // In production, this would navigate to reports section
        break
      default:
        showNotification('Action not implemented yet', 'warning')
        break
    }
  }, [])

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }, [])

  const formatMonth = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [])

  const getUserInitials = useCallback(() => {
    if (!user?.displayName) return 'MMC'
    return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
  }, [user?.displayName])

  const getUserDisplayName = useCallback(() => {
    return user?.displayName || 'Manila Medical Center'
  }, [user?.displayName])

  const showNotification = useCallback((message: string, type: string = 'info') => {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification')
    existingNotifications.forEach(notification => notification.remove())
    
    // Create notification
    const notification = document.createElement('div')
    notification.className = `notification notification-${type}`
    notification.innerHTML = `
      <div class="notification-content">
        <i class="fas fa-${getNotificationIcon(type)}"></i>
        <span>${message}</span>
        <button class="notification-close">&times;</button>
      </div>
    `
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${getNotificationColor(type)};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-family: 'Inter', sans-serif;
      font-size: 14px;
      max-width: 350px;
      animation: slideIn 0.3s ease-out;
    `
    
    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close')
    closeBtn?.addEventListener('click', () => notification.remove())
    
    // Add to page
    document.body.appendChild(notification)
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideOut 0.3s ease-in'
        setTimeout(() => notification.remove(), 300)
      }
    }, 5000)
  }, [])

  const getNotificationIcon = useCallback((type: string) => {
    const icons: { [key: string]: string } = {
      success: 'check-circle',
      error: 'exclamation-circle',
      warning: 'exclamation-triangle',
      info: 'info-circle'
    }
    return icons[type] || icons.info
  }, [])

  const getNotificationColor = useCallback((type: string) => {
    const colors: { [key: string]: string } = {
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    }
    return colors[type] || colors.info
  }, [])

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeSidebar()
      }
      if (event.key === 'm' && event.ctrlKey) {
        event.preventDefault()
        toggleSidebar()
      }
      if (event.key === 'r' && event.ctrlKey) {
        event.preventDefault()
        handleRefresh()
      }
      if (event.key === 'h' && event.ctrlKey) {
        event.preventDefault()
        handleNavClick('help')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeSidebar, toggleSidebar])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    showNotification('Refreshing dashboard data...', 'info')
    
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false)
      showNotification('Dashboard refreshed successfully!', 'success')
    }, 1500)
  }, [])

  if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-message">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-layout" role="application" aria-label="Healthcare Management Dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'active' : ''}`} ref={sidebarRef} role="navigation" aria-label="Main navigation">
        <div className="sidebar-header">
          <div className="logo">
            <i className="fas fa-heartbeat" aria-hidden="true"></i>
            <span>LingapLink</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-items">
            <li className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}>
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('dashboard'); }}
                aria-current={activeSection === 'dashboard' ? 'page' : undefined}
              >
                <i className="fas fa-th-large" aria-hidden="true"></i>
                <span>Dashboard</span>
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'patient-records' ? 'active' : ''}`}>
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('patient-records'); }}
                aria-current={activeSection === 'patient-records' ? 'page' : undefined}
              >
                <i className="fas fa-folder-open" aria-hidden="true"></i>
                <span>Patient Records</span>
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'my-availability' ? 'active' : ''}`}>
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('my-availability'); }}
                aria-current={activeSection === 'my-availability' ? 'page' : undefined}
              >
                <i className="far fa-calendar-check" aria-hidden="true"></i>
                <span>My Availability</span>
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'my-consults' ? 'active' : ''}`}>
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('my-consults'); }}
                aria-current={activeSection === 'my-consults' ? 'page' : undefined}
              >
                <i className="fas fa-notes-medical" aria-hidden="true"></i>
                <span>My Consults</span>
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'online-consult' ? 'active' : ''}`}>
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('online-consult'); }}
                aria-current={activeSection === 'online-consult' ? 'page' : undefined}
              >
                <i className="fas fa-laptop-medical" aria-hidden="true"></i>
                <span>Online Consult</span>
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'help' ? 'active' : ''}`}>
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('help'); }}
                aria-current={activeSection === 'help' ? 'page' : undefined}
              >
                <i className="fas fa-question-circle" aria-hidden="true"></i>
                <span>Help</span>
              </button>
            </li>
            <li className="nav-item">
              <button className="nav-link" onClick={handleLogout}>
                <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
        </div>
      </aside>
      
      {/* Sidebar Overlay for Mobile */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} ref={sidebarOverlayRef} onClick={closeSidebar}></div>

      {/* Main Content */}
      <main className="main-content" ref={mainContentRef}>
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleSidebar}
              aria-label="Toggle mobile menu"
            >
              <i className="fas fa-bars" aria-hidden="true"></i>
            </button>
            
            <button 
              className="refresh-btn" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh dashboard data"
              title="Refresh dashboard (Ctrl+R)"
            >
              <i className={`fas fa-sync-alt ${isRefreshing ? 'fa-spin' : ''}`} aria-hidden="true"></i>
            </button>
          </div>
          
          <div className="user-info">
            <div className="language-selector">
              <select id="language-select" aria-label="Select language">
                <option value="en">EN</option>
                <option value="tl">TL</option>
              </select>
            </div>
            
            <div className="notifications" role="button" tabIndex={0} aria-label="View notifications (3 unread)">
              <i className="fas fa-bell" aria-hidden="true"></i>
              <span className="notification-badge" aria-label="3 unread notifications">3</span>
            </div>
            
            <div className="user-avatar" role="button" tabIndex={0} aria-label={`User menu for ${getUserDisplayName()}`}>
              <span aria-hidden="true">{getUserInitials()}</span>
            </div>
          </div>
        </div>
        
        <div className="main-container">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <section className="content-section active">
              <div className="section-header">
                <h1>Hi, <span>{getUserDisplayName()}!</span></h1>
                <p>Welcome to your healthcare facility management dashboard</p>
              </div>
            
              <div className="stats-grid" ref={statsRef} role="region" aria-label="Dashboard statistics">
                <div className="stat-card" role="article" aria-label="Total patients statistic">
                  <div className="stat-icon">
                    <i className="fas fa-users" aria-hidden="true"></i>
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-number" data-target={dashboardStats.totalPatients}>
                      {dashboardStats.totalPatients.toLocaleString()}
                    </h3>
                    <p>Total Patients</p>
                  </div>
                </div>
                
                <div className="stat-card" role="article" aria-label="Staff members statistic">
                  <div className="stat-icon">
                    <i className="fas fa-id-badge" aria-hidden="true"></i>
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-number" data-target={dashboardStats.staffMembers}>
                      {dashboardStats.staffMembers}
                    </h3>
                    <p>Staff Members</p>
                  </div>
                </div>
                
                <div className="stat-card" role="article" aria-label="Today's appointments statistic">
                  <div className="stat-icon">
                    <i className="fas fa-calendar-check" aria-hidden="true"></i>
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-number" data-target={dashboardStats.todayAppointments}>
                      {dashboardStats.todayAppointments}
                    </h3>
                    <p>Today's Appointments</p>
                  </div>
                </div>
                
                <div className="stat-card" role="article" aria-label="Virtual consultations statistic">
                  <div className="stat-icon">
                    <i className="fas fa-video" aria-hidden="true"></i>
                  </div>
                  <div className="stat-info">
                    <h3 className="stat-number" data-target={dashboardStats.virtualConsultations}>
                      {dashboardStats.virtualConsultations}
                    </h3>
                    <p>Virtual Consultations</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions" role="region" aria-label="Quick actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons" role="group" aria-label="Available quick actions">
                  {quickActions.map((action) => (
                    <button 
                      key={action.id}
                      className="btn btn-outline action-btn" 
                      onClick={() => handleQuickAction(action.action)}
                      aria-label={action.description}
                      title={action.description}
                    >
                      <i className={action.icon} aria-hidden="true"></i>
                      <span>{action.title}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="dashboard-section" role="region" aria-label="Today's schedule">
                <h3>Today's Schedule</h3>
                <div className="appointments-list" role="list" aria-label="List of today's appointments">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="appointment-card" role="listitem">
                      <div className="appointment-date" aria-label={`Appointment time: ${appointment.time}`}>
                        <span className="date">{appointment.time.split(' ')[0]}</span>
                        <span className="month">{appointment.time.split(' ')[1]}</span>
                      </div>
                      <div className="appointment-info">
                        <h4>{appointment.doctorName}</h4>
                        <p>{appointment.specialty}</p>
                        <div className="appointment-time">Patient: {appointment.patientName}</div>
                      </div>
                      <div className="appointment-actions">
                        <span className={`status ${appointment.status}`} aria-label={`Appointment status: ${appointment.status}`}>
                          {appointment.status === 'confirmed' ? 'Confirmed' : 
                           appointment.status === 'pending' ? 'Pending' : 'Virtual'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dashboard-section" role="region" aria-label="Recent activities">
                <h3>Recent Activities</h3>
                <div className="activity-list" role="list" aria-label="List of recent activities">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-item" role="listitem">
                      <div className="activity-icon" aria-hidden="true">
                        <i className={activity.icon}></i>
                      </div>
                      <div className="activity-content">
                        <h4>{activity.title}</h4>
                        <p>{activity.description}</p>
                        <div className="activity-time" aria-label={`Activity occurred ${activity.timestamp}`}>
                          {activity.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Patient Records Section */}
          {activeSection === 'patient-records' && (
            <section className="content-section active">
              <div className="section-header-flex">
                <div className="section-title">
                  <p className="greeting-text">Hi, Doctor!</p>
                  <h1 className="section-main-title">Patient Records</h1>
                </div>
                <div className="section-controls">
                  <select className="date-dropdown">
                    <option>May'23</option>
                    <option>Apr'23</option>
                    <option>Mar'23</option>
                  </select>
                </div>
              </div>

              <div className="content-tabs">
                <button 
                  className={`tab-link ${activeTab === 'Yesterday' ? 'active' : ''}`}
                  onClick={() => handleTabClick('Yesterday')}
                >
                  Yesterday
                </button>
                <button 
                  className={`tab-link ${activeTab === 'Today' ? 'active' : ''}`}
                  onClick={() => handleTabClick('Today')}
                >
                  Today
                </button>
                <button 
                  className={`tab-link ${activeTab === 'Past' ? 'active' : ''}`}
                  onClick={() => handleTabClick('Past')}
                >
                  Past
                </button>
              </div>
              
              <div className="records-list">
                {patientRecords.map((record) => (
                  <div key={record.id} className="record-item-card">
                    <div className="date-box">
                      <span className="day">{record.day}</span>
                      <span className="date-num">{record.date}</span>
                    </div>
                    <div className="record-divider-v"></div>
                    <div className="record-details-grid">
                      <div className="detail-item-flex">
                        <i className="far fa-clock"></i>
                        <span>{record.time}</span>
                      </div>
                      <div className="detail-item-flex">
                        <span>Issue: {record.issue}</span>
                      </div>
                      <div className="detail-item-flex">
                        <i className="far fa-user"></i>
                        <span>{record.patientName}</span>
                      </div>
                      <div className="detail-item-flex">
                        {record.hasDocuments ? (
                          <a href="#">View Documents</a>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </div>
                    <div className="record-actions-dropdown">
                      <select>
                        <option>Edit</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* My Availability Section */}
          {activeSection === 'my-availability' && (
            <section className="content-section active">
              <div className="section-header-flex">
                <div className="section-title">
                  <p className="greeting-text">Hi, Doctor!</p>
                  <h1 className="section-main-title">My Availability</h1>
                </div>
              </div>
              <div className="availability-grid">
                <div className="availability-calendar-container">
                  <div className="calendar-controls">
                    <h3>{formatMonth(currentMonth)}</h3>
                    <div className="calendar-nav-arrows">
                      <button className="arrow-btn" onClick={() => navigateMonth('prev')}>&lt;</button>
                      <button className="arrow-btn" onClick={() => navigateMonth('next')}>&gt;</button>
                    </div>
                  </div>
                  <div className="calendar-grid-view">
                    <div className="calendar-header-days">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                    <div className="calendar-body-days">
                      {/* Calendar days would be generated here */}
                      <div className="day-cell-avail other-month">31</div>
                      <div className="day-cell-avail">01</div>
                      <div className="day-cell-avail">02</div>
                      <div className="day-cell-avail">03<div className="tags-wrapper"><span className="avail-tag">01</span></div></div>
                      <div className="day-cell-avail">04<div className="tags-wrapper"><span className="avail-tag">02</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">05<div className="tags-wrapper"><span className="avail-tag">01</span><span className="avail-tag">02</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">06<div className="tags-wrapper"><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">07<div className="tags-wrapper"><span className="avail-tag">02</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">08</div>
                      <div className="day-cell-avail">09<div className="tags-wrapper"><span className="avail-tag">01</span><span className="avail-tag">02</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">10<div className="tags-wrapper"><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">11</div>
                      <div className="day-cell-avail">12<div className="tags-wrapper"><span className="avail-tag">02</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">13<div className="tags-wrapper"><span className="avail-tag">01</span><span className="avail-tag">02</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">14<div className="tags-wrapper"><span className="avail-tag">01</span><span className="avail-tag">02</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">15</div>
                      <div className="day-cell-avail">16<div className="tags-wrapper"><span className="avail-tag">02</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">17</div>
                      <div className="day-cell-avail">18<div className="tags-wrapper"><span className="avail-tag">01</span><span className="avail-tag">02</span></div></div>
                      <div className="day-cell-avail">19<div className="tags-wrapper"><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">20<div className="tags-wrapper"><span className="avail-tag">01</span><span className="avail-tag">02</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">21<div className="tags-wrapper"><span className="avail-tag">01</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">22</div>
                      <div className="day-cell-avail">23<div className="tags-wrapper"><span className="avail-tag">01</span><span className="avail-tag">02</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">24</div>
                      <div className="day-cell-avail">25</div>
                      <div className="day-cell-avail">26<div className="tags-wrapper"><span className="avail-tag">01</span><span className="avail-tag">02</span></div></div>
                      <div className="day-cell-avail">27</div>
                      <div className="day-cell-avail">28</div>
                      <div className="day-cell-avail">29<div className="tags-wrapper"><span className="avail-tag">01</span><span className="avail-tag">02</span><span className="avail-tag">03</span></div></div>
                      <div className="day-cell-avail">30</div>
                      <div className="day-cell-avail other-month">01<div className="tags-wrapper"><span className="avail-tag faded">01</span><span className="avail-tag faded">02</span><span className="avail-tag faded">03</span></div></div>
                      <div className="day-cell-avail other-month">02</div>
                      <div className="day-cell-avail other-month">03</div>
                      <div className="day-cell-avail other-month">04</div>
                    </div>
                  </div>
                </div>
                <div className="upcoming-appointments-list">
                  <h3>Upcoming</h3>
                  <div className="upcoming-group">
                    <p className="group-title">Today</p>
                    {availabilitySlots.map((slot) => (
                      <div key={slot.id} className="appointment-info-card">
                        <p>{slot.clinic}</p>
                        <span>{slot.time}</span>
                        <span className="date-text">{slot.date}</span>
                      </div>
                    ))}
                  </div>
                  <div className="upcoming-group">
                    <p className="group-title">Tomorrow</p>
                    {availabilitySlots.map((slot) => (
                      <div key={`tomorrow-${slot.id}`} className="appointment-info-card">
                        <p>{slot.clinic}</p>
                        <span>{slot.time}</span>
                        <span className="date-text">{slot.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* My Consults Section */}
          {activeSection === 'my-consults' && (
            <section className="content-section active">
              <div className="section-header-flex">
                <div className="section-title">
                  <p className="greeting-text">Hi, Doctor!</p>
                  <h1 className="section-main-title">Appointments</h1>
                </div>
                <div className="section-controls">
                  <select className="date-dropdown">
                    <option>May'23</option>
                  </select>
                  <button className="btn btn-primary">
                    <i className="fas fa-plus"></i> New Appointment
                  </button>
                </div>
              </div>

              <div className="content-tabs">
                <button className="tab-link active">Upcoming</button>
                <button className="tab-link">Past</button>
                <button className="tab-link">Cancelled</button>
              </div>
              
              <div className="records-list">
                {patientRecords.map((record) => (
                  <div key={record.id} className="record-item-card">
                    <div className="date-box">
                      <span className="day">{record.day}</span>
                      <span className="date-num">{record.date}</span>
                    </div>
                    <div className="record-divider-v"></div>
                    <div className="record-details-grid">
                      <div className="detail-item-flex">
                        <i className="far fa-clock"></i>
                        <span>{record.time}</span>
                      </div>
                      <div className="detail-item-flex">
                        <span>Issue: {record.issue}</span>
                      </div>
                      <div className="detail-item-flex">
                        <i className="far fa-user"></i>
                        <span>{record.patientName}</span>
                      </div>
                      <div className="detail-item-flex">
                        {record.hasDocuments ? (
                          <a href="#">View Documents</a>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </div>
                    <div className="record-actions-dropdown">
                      <select>
                        <option>Edit</option>
                      </select>
                    </div>
                  </div>
                ))}

                <h3 className="records-group-title">June'23</h3>
                {patientRecords.slice(0, 3).map((record, index) => (
                  <div key={`june-${index}`} className="record-item-card">
                    <div className="date-box">
                      <span className="day">{['Mon', 'Tue', 'Wed'][index]}</span>
                      <span className="date-num">{['02', '03', '04'][index]}</span>
                    </div>
                    <div className="record-divider-v"></div>
                    <div className="record-details-grid">
                      <div className="detail-item-flex">
                        <i className="far fa-clock"></i>
                        <span>{record.time}</span>
                      </div>
                      <div className="detail-item-flex">
                        <span>Issue: {record.issue}</span>
                      </div>
                      <div className="detail-item-flex">
                        <i className="far fa-user"></i>
                        <span>{record.patientName}</span>
                      </div>
                      <div className="detail-item-flex">
                        {record.hasDocuments ? (
                          <a href="#">View Documents</a>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </div>
                    <div className="record-actions-dropdown">
                      <select>
                        <option>Edit</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Online Consult Section */}
          {activeSection === 'online-consult' && (
            <section className="content-section active">
              <div className="section-header-flex">
                <div className="section-title">
                  <p className="greeting-text">Hi, Doctor!</p>
                  <h1 className="section-main-title">Online Consult</h1>
                </div>
              </div>
              <div className="form-container-card">
                <div className="form-header">
                  <h3>Consultation Info</h3>
                  <p>Lorem ipsum dolor sit amet consectetur. Aliquet at adipiscing et at. Urna cursus justo nunc viverra et ipsum pellentesque sit imperdiet. Sed tortor egestas facilisis purus integer euismod. Vel amet quisque suspendisse in ut magna bibendum.</p>
                </div>
                <form className="consult-form">
                  <div className="form-row">
                    <div className="form-group-flex">
                      <label>Availability</label>
                      <div className="radio-group">
                        <label className="radio-label">
                          <input 
                            type="radio" 
                            name="availability" 
                            checked={!availabilityEnabled}
                            onChange={() => setAvailabilityEnabled(false)}
                          /> 
                          Disable
                        </label>
                        <label className="radio-label">
                          <input 
                            type="radio" 
                            name="availability" 
                            checked={availabilityEnabled}
                            onChange={() => setAvailabilityEnabled(true)}
                          /> 
                          Enable
                        </label>
                      </div>
                    </div>
                    <div className="form-group-flex">
                      <label>Type Of Availability</label>
                      <div className="checkbox-group-row">
                        <label className="checkbox-label">
                          <input 
                            type="checkbox" 
                            checked={consultationTypes.whatsapp}
                            onChange={(e) => setConsultationTypes(prev => ({ ...prev, whatsapp: e.target.checked }))}
                          /> 
                          Whatsapp chat
                        </label>
                        <label className="checkbox-label">
                          <input 
                            type="checkbox" 
                            checked={consultationTypes.video}
                            onChange={(e) => setConsultationTypes(prev => ({ ...prev, video: e.target.checked }))}
                          /> 
                          Video call
                        </label>
                        <label className="checkbox-label">
                          <input 
                            type="checkbox" 
                            checked={consultationTypes.phone}
                            onChange={(e) => setConsultationTypes(prev => ({ ...prev, phone: e.target.checked }))}
                          /> 
                          Phone Call
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group-flex">
                      <label htmlFor="duration">Duration</label>
                      <select 
                        id="duration" 
                        className="form-control"
                        value={consultationDuration}
                        onChange={(e) => setConsultationDuration(e.target.value)}
                      >
                        <option value="30">30 mins</option>
                        <option value="45">45 mins</option>
                        <option value="60">60 mins</option>
                      </select>
                    </div>
                    <div className="form-group-flex">
                      <label htmlFor="fees">Fees</label>
                      <input 
                        type="text" 
                        id="fees" 
                        className="form-control" 
                        value={`zł ${consultationFees}`}
                        onChange={(e) => setConsultationFees(e.target.value.replace('zł ', ''))}
                      />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn btn-outline">Reset</button>
                    <button type="submit" className="btn btn-primary">Save</button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {/* Help Section */}
          {activeSection === 'help' && (
            <section className="content-section active">
              <div className="section-header">
                <h1>Help & Support</h1>
                <p>Get help with managing your healthcare facility</p>
              </div>
              
              <div className="help-search">
                <div className="search-box">
                  <i className="fas fa-search" aria-hidden="true"></i>
                  <input type="text" placeholder="Search for help articles..." aria-label="Search for help articles" />
                </div>
              </div>
              
              <div className="help-categories">
                <h3>Help Categories</h3>
                <div className="category-grid">
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-tachometer-alt" aria-hidden="true"></i>
                    </div>
                    <h4>Dashboard Overview</h4>
                    <p>Learn about your facility dashboard features and navigation</p>
                  </div>
                  
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-users" aria-hidden="true"></i>
                    </div>
                    <h4>Patient Management</h4>
                    <p>Add, edit, and manage patient records effectively</p>
                  </div>
                  
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-calendar-alt" aria-hidden="true"></i>
                    </div>
                    <h4>Staff Scheduling</h4>
                    <p>Manage staff schedules and facility availability</p>
                  </div>
                  
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-video" aria-hidden="true"></i>
                    </div>
                    <h4>Virtual Care Setup</h4>
                    <p>Configure and manage virtual healthcare services</p>
                  </div>
                  
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-chart-bar" aria-hidden="true"></i>
                    </div>
                    <h4>Reports & Analytics</h4>
                    <p>Generate and analyze facility performance reports</p>
                  </div>
                  
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-shield-alt" aria-hidden="true"></i>
                    </div>
                    <h4>Security & Compliance</h4>
                    <p>Understand data protection and healthcare compliance</p>
                  </div>
                </div>
              </div>

              <div className="faq-section">
                <h3>Frequently Asked Questions</h3>
                <div className="faq-list">
                  <div className="faq-item">
                    <button className="faq-question">
                      <span>How do I register a new patient in the system?</span>
                      <i className="fas fa-chevron-down" aria-hidden="true"></i>
                    </button>
                    <div className="faq-answer">
                      <p>To register a new patient, go to the Patient Records section and click the "New Patient" button. Fill in the required information including personal details, medical history, and contact information.</p>
                    </div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      <span>How can I manage staff schedules for my facility?</span>
                      <i className="fas fa-chevron-down" aria-hidden="true"></i>
                    </button>
                    <div className="faq-answer">
                      <p>Use the Staff Scheduling section to view and manage all medical staff schedules. You can assign shifts, track availability, and coordinate department coverage from the calendar interface.</p>
                    </div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      <span>How do I set up virtual care services for my facility?</span>
                      <i className="fas fa-chevron-down" aria-hidden="true"></i>
                    </button>
                    <div className="faq-answer">
                      <p>Go to the Virtual Care section and enable virtual services. Configure available consultation types (video, phone, chat), set operating hours, and establish consultation fees for your facility.</p>
                    </div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      <span>Can I export facility data and generate reports?</span>
                      <i className="fas fa-chevron-down" aria-hidden="true"></i>
                    </button>
                    <div className="faq-answer">
                      <p>Yes, you can export patient data and generate comprehensive facility reports from the dashboard. Use the "View Reports" quick action for detailed analytics and export options.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="help-categories">
                <h3>Need More Help?</h3>
                <div className="category-grid">
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-phone" aria-hidden="true"></i>
                    </div>
                    <h4>Phone Support</h4>
                    <p>Call us at +63 2 8123 4567. Available 24/7</p>
                  </div>
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-envelope" aria-hidden="true"></i>
                    </div>
                    <h4>Email Support</h4>
                    <p>support@lingaplink.ph. Response within 24 hours</p>
                  </div>
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-comments" aria-hidden="true"></i>
                    </div>
                    <h4>Live Chat</h4>
                    <p>Chat with our support team</p>
                    <button className="btn btn-primary btn-sm" style={{ marginTop: '1rem' }}>Start Chat</button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  )
})

Dashboard.displayName = 'Dashboard'

export default Dashboard 