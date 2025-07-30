import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../config/firebase'
import { signOut } from 'firebase/auth'
import '../styles/shared-header.css'
import '../styles/patientPortal.css'
import '../styles/csp-utilities.css'
import AdrielImg from '../assets/img/Adriel.png'
import FrancheskaImg from '../assets/img/Francheska.png'
import JuanitoImg from '../assets/img/juanito.png'
import MaxImg from '../assets/img/max.png'
import ThreshiaImg from '../assets/img/Threshia.png'

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
  date: string
  time: string
  type: 'virtual' | 'in-person'
  status: 'upcoming' | 'completed' | 'cancelled'
}

interface Activity {
  id: string
  type: 'appointment' | 'upload' | 'prescription'
  title: string
  description: string
  timestamp: string
  icon: string
}

const PatientPortal: React.FC = () => {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<'dashboard' | 'calendar' | 'profile' | 'help'>('dashboard')
  const [activeTab, setActiveTab] = useState<'general' | 'consultation-history' | 'patient-documents'>('general')
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 6, 1)) // July 2025
  const [showModal, setShowModal] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [lastActivity, setLastActivity] = useState<Date>(new Date())
  
  const sidebarRef = useRef<HTMLElement>(null)
  const sidebarOverlayRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Memoized data for better performance
  const appointments: Appointment[] = useMemo(() => [
    {
      id: '1',
      doctorName: 'Dr. Sarah Johnson',
      specialty: 'Cardiology Consultation',
      date: '2024-03-22',
      time: '10:30 AM',
      type: 'virtual',
      status: 'upcoming'
    }
  ], [])

  const activities: Activity[] = useMemo(() => [
    {
      id: '1',
      type: 'appointment',
      title: 'Appointment Scheduled',
      description: 'Cardiology consultation with Dr. Sarah Johnson',
      timestamp: '2 hours ago',
      icon: 'fas fa-calendar-plus'
    },
    {
      id: '2',
      type: 'upload',
      title: 'Lab Results Uploaded',
      description: 'Blood work results from March 15, 2024',
      timestamp: '1 day ago',
      icon: 'fas fa-file-upload'
    },
    {
      id: '3',
      type: 'prescription',
      title: 'Prescription Updated',
      description: 'Medication dosage adjusted by Dr. Michael Chen',
      timestamp: '3 days ago',
      icon: 'fas fa-pills'
    }
  ], [])

  useEffect(() => {
    // Check authentication
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user)
        setIsLoading(false)
        setLastActivity(new Date())
      } else {
        navigate('/patient-sign-in')
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

  useEffect(() => {
    // Initialize calendar
    generateCalendarDays()
  }, [currentMonth])

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
    if (sidebarRef.current) {
      sidebarRef.current.classList.toggle('active')
    }
    if (sidebarOverlayRef.current) {
      sidebarOverlayRef.current.classList.toggle('active')
    }
  }, [])

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false)
    if (sidebarRef.current) {
      sidebarRef.current.classList.remove('active')
    }
    if (sidebarOverlayRef.current) {
      sidebarOverlayRef.current.classList.remove('active')
    }
  }, [])

  const handleNavClick = useCallback((section: 'dashboard' | 'calendar' | 'profile' | 'help') => {
    setActiveSection(section)
    closeSidebar()
  }, [closeSidebar])

  const handleTabClick = useCallback((tab: 'general' | 'consultation-history' | 'patient-documents') => {
    setActiveTab(tab)
  }, [])

  const generateCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }, [currentMonth])

  const formatMonth = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
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

  const openModal = useCallback((modalType: string) => {
    setShowModal(modalType)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(null)
  }, [])

  const getUserInitials = useCallback(() => {
    if (!user?.displayName) return 'AM'
    // For demo purposes, show "AM" for Adriel Magalona
    if (user.displayName.includes('Adriel') || user.displayName.includes('Magalona')) {
      return 'AM'
    }
    return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
  }, [user?.displayName])

  const getUserDisplayName = useCallback(() => {
    return user?.displayName || 'Adriel Magalona'
  }, [user?.displayName])

  const getUserEmail = useCallback(() => {
    return user?.email || 'adriel.magalona@example.com'
  }, [user?.email])

  const getTimeAgo = useCallback((timestamp: string) => {
    return timestamp // For now, return as is. Could implement actual time calculation
  }, [])

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeModal()
        closeSidebar()
      }
      if (event.key === 'm' && event.ctrlKey) {
        event.preventDefault()
        toggleSidebar()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [closeModal, closeSidebar, toggleSidebar])

  // Auto-save user preferences
  useEffect(() => {
    if (user) {
      localStorage.setItem('patientPortal_preferences', JSON.stringify({
        notificationsEnabled,
        lastActiveSection: activeSection,
        lastActiveTab: activeTab
      }))
    }
  }, [user, notificationsEnabled, activeSection, activeTab])

  // Load user preferences on mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('patientPortal_preferences')
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences)
        setNotificationsEnabled(preferences.notificationsEnabled ?? true)
        setActiveSection(preferences.lastActiveSection ?? 'dashboard')
        setActiveTab(preferences.lastActiveTab ?? 'general')
      } catch (error) {
        console.warn('Failed to load user preferences:', error)
      }
    }
  }, [])

    if (isLoading) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p className="loading-message">Loading your health dashboard...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="dashboard-layout" role="application" aria-label="Patient Portal Dashboard">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'active' : ''}`} ref={sidebarRef} role="navigation" aria-label="Main navigation">
        <div className="sidebar-header">
          <div className="logo">
            <i className="fas fa-heart-pulse" aria-hidden="true"></i>
            <span>LingapLink</span>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <ul className="nav-items" role="menubar">
            <li className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`} role="none">
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('dashboard'); }}
                role="menuitem"
                aria-current={activeSection === 'dashboard' ? 'page' : undefined}
                aria-label="Navigate to Dashboard"
              >
                <i className="fas fa-th-large" aria-hidden="true"></i>
                <span>Dashboard</span>
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'calendar' ? 'active' : ''}`} role="none">
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('calendar'); }}
                role="menuitem"
                aria-current={activeSection === 'calendar' ? 'page' : undefined}
                aria-label="Navigate to Calendar"
              >
                <i className="fas fa-calendar-alt" aria-hidden="true"></i>
                <span>Calendar</span>
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`} role="none">
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('profile'); }}
                role="menuitem"
                aria-current={activeSection === 'profile' ? 'page' : undefined}
                aria-label="Navigate to Profile"
              >
                <i className="fas fa-user" aria-hidden="true"></i>
                <span>Profile</span>
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'help' ? 'active' : ''}`} role="none">
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('help'); }}
                role="menuitem"
                aria-current={activeSection === 'help' ? 'page' : undefined}
                aria-label="Navigate to Help"
              >
                <i className="fas fa-question-circle" aria-hidden="true"></i>
                <span>Help</span>
              </button>
            </li>
          </ul>
        </nav>
        
        <div className="sidebar-footer">
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            aria-label="Sign out of your account"
          >
            <i className="fas fa-sign-out-alt" aria-hidden="true"></i>
            <span>Logout</span>
          </button>
        </div>
      </aside>
      
      {/* Sidebar Overlay for Mobile */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} ref={sidebarOverlayRef} onClick={closeSidebar}></div>

      {/* Main Content */}
      <main className="main-content" ref={mainContentRef}>
        {/* Top Bar */}
        <div className="top-bar">
          <button 
            className="mobile-menu-toggle" 
            onClick={toggleSidebar}
            aria-label="Toggle navigation menu"
            aria-expanded={isSidebarOpen}
            aria-controls="sidebar-navigation"
          >
            <i className="fas fa-bars" aria-hidden="true"></i>
          </button>
          
          <div className="user-info">
            <div className="language-selector">
              <select id="language-select">
                <option value="en">EN</option>
                <option value="tl">TL</option>
              </select>
            </div>
            
            <div className="notifications" role="button" tabIndex={0} aria-label="View notifications (2 unread)">
              <i className="fas fa-bell" aria-hidden="true"></i>
              <span className="notification-badge" aria-label="2 unread notifications">2</span>
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
                    <h3>5</h3>
                    <p>Upcoming Appointments</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-file-medical"></i>
                  </div>
                  <div className="stat-info">
                    <h3>12</h3>
                    <p>Medical Records</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-pills"></i>
                  </div>
                  <div className="stat-info">
                    <h3>3</h3>
                    <p>Active Medications</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-icon">
                    <i className="fas fa-heartbeat"></i>
                  </div>
                  <div className="stat-info">
                    <h3>Good</h3>
                    <p>Health Status</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button className="action-btn" onClick={() => openModal('bookAppointment')}>
                    <i className="fas fa-calendar-plus"></i>
                    <span>Book Appointment</span>
                  </button>
                  <button className="action-btn" onClick={() => openModal('videoConsultation')}>
                    <i className="fas fa-video"></i>
                    <span>Video Consultation</span>
                  </button>
                  <button className="action-btn" onClick={() => openModal('prescriptionRefill')}>
                    <i className="fas fa-prescription-bottle"></i>
                    <span>Refill Prescription</span>
                  </button>
                </div>
              </div>

              <div className="dashboard-section">
                <h3>Recent Activities</h3>
                <div className="activity-list">
                  {activities.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        <i className={activity.icon}></i>
                      </div>
                      <div className="activity-content">
                        <h4>{activity.title}</h4>
                        <p>{activity.description}</p>
                        <div className="activity-time">{getTimeAgo(activity.timestamp)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dashboard-section">
                <h3>Upcoming Appointments</h3>
                <div className="appointments-list">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="appointment-card">
                      <div className="appointment-date">
                        <span className="date">{new Date(appointment.date).getDate()}</span>
                        <span className="month">{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                      </div>
                      <div className="appointment-info">
                        <h4>{appointment.doctorName}</h4>
                        <p>{appointment.specialty}</p>
                        <div className="appointment-time">{appointment.time}</div>
                      </div>
                      <div className="appointment-actions">
                        <button className="btn-outline">
                          <i className="fas fa-edit"></i>
                          Reschedule
                        </button>
                        <button className="btn-primary">
                          <i className={appointment.type === 'virtual' ? 'fas fa-video' : 'fas fa-directions'}></i>
                          {appointment.type === 'virtual' ? 'Join Call' : 'Directions'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Calendar Section */}
          {activeSection === 'calendar' && (
            <section className="content-section active">
              <div className="calendar-header">
                <h1>Calendar</h1>
                <div className="calendar-actions">
                  <button className="btn-primary" onClick={() => openModal('bookAppointment')}>
                    <i className="fas fa-plus"></i>
                    Book Appointment
                  </button>
                </div>
              </div>

              <div className="calendar-navigation">
                <button className="nav-btn" onClick={() => navigateMonth('prev')}>
                  <i className="fas fa-chevron-left"></i>
                </button>
                <h2 className="current-month">{formatMonth(currentMonth)}</h2>
                <button className="nav-btn" onClick={() => navigateMonth('next')}>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>

              <div className="calendar-grid">
                <div className="calendar-weekdays">
                  <div className="weekday">Sun</div>
                  <div className="weekday">Mon</div>
                  <div className="weekday">Tue</div>
                  <div className="weekday">Wed</div>
                  <div className="weekday">Thu</div>
                  <div className="weekday">Fri</div>
                  <div className="weekday">Sat</div>
                </div>
                
                <div className="calendar-days">
                  {generateCalendarDays().map((date, index) => {
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isCurrentMonth = date.getMonth() === currentMonth.getMonth()
                    const isSelected = date.getDate() === 11 && date.getMonth() === 6 // July 11th for demo
                    
                    return (
                      <div 
                        key={index} 
                        className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                      >
                        <span className="day-number">{date.getDate()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="upcoming-appointments">
                <h3>Upcoming Appointments</h3>
                <div className="appointment-list">
                  <div className="appointment-item">
                    <div className="appointment-time">
                      <span className="time">10:30 AM</span>
                      <span className="date">Mar 22, 2024</span>
                    </div>
                    <div className="appointment-details">
                      <h4>Dr. Sarah Johnson</h4>
                      <p>Cardiology Consultation</p>
                      <span className="location">Virtual Consultation</span>
                    </div>
                    <div className="appointment-actions">
                      <button className="btn-sm btn-outline">Reschedule</button>
                      <button className="btn-sm btn-primary">Join</button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <section className="content-section active">
              <div className="section-header">
                <h1>Profile</h1>
              </div>

              {/* Profile Tabs */}
              <div className="profile-tabs">
                <div className="tab-nav">
                  <button 
                    className={`tab-button ${activeTab === 'general' ? 'active' : ''}`} 
                    onClick={() => handleTabClick('general')}
                  >
                    General
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'consultation-history' ? 'active' : ''}`} 
                    onClick={() => handleTabClick('consultation-history')}
                  >
                    Consultation History
                  </button>
                  <button 
                    className={`tab-button ${activeTab === 'patient-documents' ? 'active' : ''}`} 
                    onClick={() => handleTabClick('patient-documents')}
                  >
                    Patient Documents
                  </button>
                </div>

                {/* General Tab Content */}
                {activeTab === 'general' && (
                  <div className="tab-content active">
                    {/* Profile Header */}
                    <div className="profile-header">
                      <div className="profile-info">
                        <div className="profile-avatar">
                          <div className="profile-avatar-placeholder">
                            <span>{getUserInitials()}</span>
                          </div>
                        </div>
                        <div className="profile-details">
                          <h3 className="profile-name">{getUserDisplayName()} <span className="gender-tag">(Patient)</span></h3>
                          <p className="profile-role">Patient</p>
                          <p className="profile-location">{getUserEmail()}</p>
                        </div>
                      </div>
                      <button className="btn btn-primary" onClick={() => openModal('editProfile')}>
                        <i className="fas fa-edit"></i>
                        Edit Profile
                      </button>
                    </div>

                    {/* Personal Information */}
                    <div className="info-section">
                      <div className="section-header">
                        <h3>Personal Information</h3>
                        <button className="btn btn-outline" onClick={() => openModal('editProfile')}>
                          <i className="fas fa-edit"></i>
                          Edit
                        </button>
                      </div>
                      
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Name</label>
                          <span>{getUserDisplayName()}</span>
                        </div>
                        <div className="info-item">
                          <label>Date Of Birth</label>
                          <span>--/--/----</span>
                        </div>
                        <div className="info-item">
                          <label>Age</label>
                          <span>--</span>
                        </div>
                        <div className="info-item">
                          <label>Phone Number</label>
                          <span>Not set</span>
                        </div>
                        <div className="info-item">
                          <label>Email Address</label>
                          <span>{getUserEmail()}</span>
                        </div>
                        <div className="info-item">
                          <label>Bio</label>
                          <span>Patient</span>
                        </div>
                      </div>
                    </div>

                    {/* Pre-existing Diseases */}
                    <div className="info-section">
                      <div className="section-header">
                        <h3>Pre-existing Conditions</h3>
                        <button className="btn btn-outline">
                          <i className="fas fa-plus"></i>
                          Add Condition
                        </button>
                      </div>
                      
                      <div className="diseases-section">
                        <div className="disease-category">
                          <h4>Speech</h4>
                          <div className="disease-tags">
                            <span className="disease-tag">Dysarthria <i className="fas fa-times"></i></span>
                            <span className="disease-tag">Apraxia <i className="fas fa-times"></i></span>
                          </div>
                        </div>
                        
                        <div className="disease-category">
                          <h4>Physical</h4>
                          <div className="disease-tags">
                            <span className="disease-tag">Arthritis <i className="fas fa-times"></i></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* General Settings */}
                    <div className="info-section">
                      <div className="section-header">
                        <h3>Settings</h3>
                      </div>
                      
                      <div className="settings-section">
                        <div className="setting-item">
                          <div className="setting-info">
                            <label>Change Password</label>
                            <p>Update your account password</p>
                          </div>
                          <button className="btn-outline">Change</button>
                        </div>
                        
                        <div className="setting-item">
                          <div className="setting-info">
                            <label>Notifications</label>
                            <p>Manage your notification preferences</p>
                          </div>
                          <div className="toggle-switch">
                            <label className="switch">
                              <input 
                                type="checkbox" 
                                checked={notificationsEnabled}
                                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                              />
                              <span className="slider"></span>
                            </label>
                            <span className="toggle-label">{notificationsEnabled ? 'Enabled' : 'Disabled'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Consultation History Tab Content */}
                {activeTab === 'consultation-history' && (
                  <div className="tab-content active">
                    <div className="history-container">
                      <div className="history-header">
                        <h2>History</h2>
                        <div className="history-controls">
                          <select className="date-filter-dropdown">
                            <option>May '23</option>
                            <option>Apr '23</option>
                            <option>Mar '23</option>
                          </select>
                          <button className="btn btn-primary" onClick={() => openModal('bookAppointment')}>
                            <i className="fas fa-plus"></i> New Appointment
                          </button>
                        </div>
                      </div>

                      {/* Date Group: Yesterday */}
                      <div className="date-group">
                        <h3 className="date-group-title">Yesterday</h3>
                        <div className="appointments-row">
                          <div className="appointment-card-h">
                            <div className="appointment-main">
                              <div className="appointment-info">
                                <img src={FrancheskaImg} alt="Esther Howard" className="appointment-avatar" />
                                <span className="appointment-name">Esther Howard</span>
                              </div>
                              <button className="document-icon-btn"><i className="far fa-file-alt"></i></button>
                            </div>
                            <div className="appointment-time-slot">7:00am - 8:00am</div>
                          </div>
                          <div className="appointment-card-h">
                            <div className="appointment-main">
                              <div className="appointment-info">
                                <img src={JuanitoImg} alt="Cameron Williamson" className="appointment-avatar" />
                                <span className="appointment-name">Cameron Williamson</span>
                              </div>
                              <button className="document-icon-btn"><i className="far fa-file-alt"></i></button>
                            </div>
                            <div className="appointment-time-slot">10:00am - 11:00am</div>
                          </div>
                          <div className="appointment-card-h">
                            <div className="appointment-main">
                              <div className="appointment-info">
                                <img src={MaxImg} alt="Guy Hawkins" className="appointment-avatar" />
                                <span className="appointment-name">Guy Hawkins</span>
                              </div>
                              <button className="document-icon-btn"><i className="far fa-file-alt"></i></button>
                            </div>
                            <div className="appointment-time-slot">12:00pm - 1:00pm</div>
                          </div>
                          <div className="appointment-card-h">
                            <div className="appointment-main">
                              <div className="appointment-info">
                                <img src={ThreshiaImg} alt="Albert Flores" className="appointment-avatar" />
                                <span className="appointment-name">Albert Flores</span>
                              </div>
                              <button className="document-icon-btn"><i className="far fa-file-alt"></i></button>
                            </div>
                            <div className="appointment-time-slot">4:00pm - 5:00pm</div>
                          </div>
                        </div>
                      </div>

                      {/* Date Group: Today */}
                      <div className="date-group">
                        <h3 className="date-group-title">Today</h3>
                        <div className="appointments-column">
                          <div className="appointment-card-v">
                            <div className="appointment-info">
                              <img src={AdrielImg} alt="Jane Cooper" className="appointment-avatar" />
                              <span className="appointment-name">Jane Cooper</span>
                            </div>
                            <div className="appointment-time-display">7:00am - 8:00am</div>
                            <button className="document-icon-btn"><i className="far fa-file-alt"></i></button>
                          </div>
                          <div className="appointment-card-v">
                            <div className="appointment-info">
                              <img src={FrancheskaImg} alt="Brooklyn Simmons" className="appointment-avatar" />
                              <span className="appointment-name">Brooklyn Simmons</span>
                            </div>
                            <div className="appointment-time-display">10:00am - 11:00am</div>
                            <button className="document-icon-btn"><i className="far fa-file-alt"></i></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Patient Documents Tab Content */}
                {activeTab === 'patient-documents' && (
                  <div className="tab-content active">
                    <div className="documents-header">
                      <h2>Documents</h2>
                      <button className="btn btn-primary">+ New Document</button>
                    </div>
                    <div className="documents-grid">
                      {/* Document Cards */}
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((index) => (
                        <div key={index} className="document-card">
                          <div className="card-header">
                            <i className={index <= 4 ? "fas fa-star starred" : "far fa-star"}></i>
                            <i className="fas fa-ellipsis-h"></i>
                          </div>
                          <div className="document-preview">
                            <div className="mock-document">
                              <div className="mock-line" style={{ width: '80%' }}></div>
                              <div className="mock-line" style={{ width: '90%' }}></div>
                              <div className="mock-line" style={{ width: '75%' }}></div>
                              <div className="mock-line" style={{ width: '85%' }}></div>
                            </div>
                          </div>
                          <div className="card-footer">
                            <p className="document-title">
                              {index === 2 ? 'Dr. Inglais Prescription' : 'Blood report'}
                            </p>
                            <p className="document-date">May 14, 2023, 13:25 PM</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Help Section */}
          {activeSection === 'help' && (
            <section className="content-section active">
              <div className="section-header">
                <h1>Help & Support</h1>
              </div>
              
              <div className="help-search">
                <div className="search-box">
                  <i className="fas fa-search"></i>
                  <input type="text" placeholder="Search for help articles..." />
                </div>
              </div>
              
              <div className="help-categories">
                <h3>Help Categories</h3>
                <div className="category-grid">
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-calendar-alt"></i>
                    </div>
                    <h4>Appointments</h4>
                    <p>Book, reschedule, or cancel appointments</p>
                  </div>
                  
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-file-medical"></i>
                    </div>
                    <h4>Medical Records</h4>
                    <p>Access and manage your medical documents</p>
                  </div>
                  
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-video"></i>
                    </div>
                    <h4>Virtual Consultations</h4>
                    <p>Join video calls and online consultations</p>
                  </div>
                  
                  <div className="help-category">
                    <div className="category-icon">
                      <i className="fas fa-user-cog"></i>
                    </div>
                    <h4>Profile Settings</h4>
                    <p>Update your personal information and preferences</p>
                  </div>
                </div>
              </div>

              <div className="faq-section">
                <h3>Frequently Asked Questions</h3>
                <div className="faq-list">
                  <div className="faq-item">
                    <button className="faq-question">
                      <span>How do I book an appointment?</span>
                      <i className="fas fa-chevron-down"></i>
                    </button>
                    <div className="faq-answer">
                      <p>You can book an appointment by going to the Calendar section and clicking "Book Appointment". Choose your preferred doctor, date, and time, then submit your request.</p>
                    </div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      <span>How do I join a virtual consultation?</span>
                      <i className="fas fa-chevron-down"></i>
                    </button>
                    <div className="faq-answer">
                      <p>When it's time for your virtual consultation, go to your Dashboard and click the "Join Call" button next to your appointment.</p>
                    </div>
                  </div>
                  
                  <div className="faq-item">
                    <button className="faq-question">
                      <span>Can I reschedule or cancel my appointment?</span>
                      <i className="fas fa-chevron-down"></i>
                    </button>
                    <div className="faq-answer">
                      <p>Yes, you can reschedule or cancel appointments up to 24 hours before the scheduled time. Go to your appointments and click the "Reschedule" button.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Modals */}
      {/* Edit Profile Modal */}
      {showModal === 'editProfile' && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Edit Profile Information</h3>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label htmlFor="editFullName">Full Name</label>
                  <input type="text" id="editFullName" defaultValue={getUserDisplayName()} />
                </div>
                <div className="form-group">
                  <label htmlFor="editDateOfBirth">Date of Birth</label>
                  <input type="date" id="editDateOfBirth" />
                </div>
                <div className="form-group">
                  <label htmlFor="editPhoneNumber">Phone Number</label>
                  <input type="tel" id="editPhoneNumber" />
                </div>
                <div className="form-group">
                  <label htmlFor="editEmailAddress">Email Address</label>
                  <input type="email" id="editEmailAddress" defaultValue={getUserEmail()} />
                </div>
                <div className="form-group">
                  <label htmlFor="editBio">Bio</label>
                  <textarea id="editBio" rows={3}></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {showModal === 'bookAppointment' && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Book Appointment</h3>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label htmlFor="appointmentType">Appointment Type</label>
                  <select id="appointmentType" required>
                    <option value="">Select Type</option>
                    <option value="checkup">Regular Checkup</option>
                    <option value="consultation">Consultation</option>
                    <option value="therapy">Therapy Session</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="appointmentDoctor">Doctor</label>
                  <select id="appointmentDoctor" required>
                    <option value="">Select Doctor</option>
                    <option value="dr-johnson">Dr. Sarah Johnson</option>
                    <option value="dr-wong">Dr. Lisa Wong</option>
                    <option value="dr-chen">Dr. Michael Chen</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="appointmentDate">Date</label>
                  <input type="date" id="appointmentDate" required />
                </div>
                <div className="form-group">
                  <label htmlFor="appointmentTime">Time</label>
                  <input type="time" id="appointmentTime" required />
                </div>
                <div className="form-group">
                  <label htmlFor="appointmentNotes">Notes</label>
                  <textarea id="appointmentNotes" rows={3}></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary">Book Appointment</button>
            </div>
          </div>
        </div>
      )}

      {/* Video Consultation Modal */}
      {showModal === 'videoConsultation' && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Video Consultation</h3>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="video-setup">
                <div className="video-preview">
                  <i className="fas fa-video"></i>
                  <p>Camera Preview</p>
                </div>
                <div className="form-group">
                  <label htmlFor="audioInput">Microphone</label>
                  <select id="audioInput">
                    <option value="default">Default Microphone</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="videoInput">Camera</label>
                  <select id="videoInput">
                    <option value="default">Default Camera</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary">Join Consultation</button>
            </div>
          </div>
        </div>
      )}

      {/* Prescription Refill Modal */}
      {showModal === 'prescriptionRefill' && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Refill Prescription</h3>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-group">
                  <label htmlFor="prescriptionSelect">Select Prescription</label>
                  <select id="prescriptionSelect" required>
                    <option value="">Choose Prescription</option>
                    <option value="med1">Medication 1 - 50mg</option>
                    <option value="med2">Medication 2 - 25mg</option>
                    <option value="med3">Medication 3 - 100mg</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="refillQuantity">Quantity</label>
                  <input type="number" id="refillQuantity" min="1" required />
                </div>
                <div className="form-group">
                  <label htmlFor="deliveryAddress">Delivery Address</label>
                  <textarea id="deliveryAddress" rows={3} required></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary">Request Refill</button>
            </div>
          </div>
        </div>
      )}

      {/* Download Records Modal */}
      {showModal === 'downloadRecords' && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Download Medical Records</h3>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <div className="records-list">
                <div className="record-item">
                  <input type="checkbox" id="record1" />
                  <label htmlFor="record1">Lab Results - March 2024</label>
                </div>
                <div className="record-item">
                  <input type="checkbox" id="record2" />
                  <label htmlFor="record2">Prescription History</label>
                </div>
                <div className="record-item">
                  <input type="checkbox" id="record3" />
                  <label htmlFor="record3">Medical Reports</label>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="fileFormat">File Format</label>
                <select id="fileFormat">
                  <option value="pdf">PDF</option>
                  <option value="csv">CSV</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn-primary">Download Selected</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Performance optimization: Memoize the component
const MemoizedPatientPortal = React.memo(PatientPortal)

export default MemoizedPatientPortal 