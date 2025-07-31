import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../config/firebase'
import { signOut } from 'firebase/auth'
import '../styles/shared-header.css'
import '../styles/patientPortal.css'
import '../styles/csp-utilities.css'

// Define types locally to avoid import issues
interface PatientData {
  uid: string;
  email: string;
  role: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    fullName: string;
    dateOfBirth: string;
    age: number | null;
    gender: string;
    phone: string;
    address: string;
    bio: string;
  };
  medicalInfo?: {
    conditions?: {
      [category: string]: string[];
    };
  };
  settings?: {
    notificationsEnabled?: boolean;
  };
  profileComplete: boolean;
  createdAt: any;
  lastLoginAt: any;
  updatedAt: any;
  isActive: boolean;
  emailVerified: boolean;
  authProvider: string;
  activity?: {
    appointments?: any[];
  };
}

interface AppointmentData {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  date: string;
  time: string;
  doctor: string;
  type: string;
  status: string;
  notes: string;
  facilityId: string;
  facilityName: string;
  createdAt: string;
}

interface PersonalInfo {
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  phone?: string;
  address?: string;
  bio?: string;
}

interface MedicalInfo {
  conditions?: {
    [category: string]: string[];
  };
}

interface PatientSettings {
  notificationsEnabled?: boolean;
}

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

interface EditProfileForm {
  firstName: string
  lastName: string
  fullName: string
  dateOfBirth: string
  age: number | null
  gender: string
  phone: string
  address: string
  bio: string
}

interface AddConditionForm {
  category: string
  condition: string
}

const PatientPortal: React.FC = () => {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<'dashboard' | 'calendar' | 'profile' | 'help' | 'facilities'>('dashboard')
  const [activeTab, setActiveTab] = useState<'general' | 'consultation-history' | 'patient-documents'>('general')
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 6, 1)) // July 2025
  const [showModal, setShowModal] = useState<string | null>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isBookingAppointment, setIsBookingAppointment] = useState(false)
  const [appointmentForm, setAppointmentForm] = useState({
    facilityId: '',
    facilityName: '',
    doctor: '',
    date: '',
    time: '',
    type: '',
    notes: ''
  })
  
  // Patient data state
  const [patientData, setPatientData] = useState<PatientData | null>(null)
  const [isLoadingPatientData, setIsLoadingPatientData] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isAddingCondition, setIsAddingCondition] = useState(false)
  
  // Profile edit form state
  const [editProfileForm, setEditProfileForm] = useState<EditProfileForm>({
    firstName: '',
    lastName: '',
    fullName: '',
    dateOfBirth: '',
    age: null,
    gender: '',
    phone: '',
    address: '',
    bio: ''
  })
  
  // Add condition form state
  const [addConditionForm, setAddConditionForm] = useState<AddConditionForm>({
    category: '',
    condition: ''
  })
  
  // Available categories for medical conditions
  const conditionCategories = [
    'Speech',
    'Physical',
    'Mental Health',
    'Cardiovascular',
    'Respiratory',
    'Digestive',
    'Neurological',
    'Endocrine',
    'Other'
  ]
  
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
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user)
        setIsLoading(false)
        
        // Load patient data
        try {
          const { getCurrentPatientData } = await import('../services/firestoredb.js')
          const data = await getCurrentPatientData()
          setPatientData(data)
          
          // Initialize edit form with current data
          if (data?.personalInfo) {
            setEditProfileForm({
              firstName: data.personalInfo.firstName || '',
              lastName: data.personalInfo.lastName || '',
              fullName: data.personalInfo.fullName || '',
              dateOfBirth: data.personalInfo.dateOfBirth || '',
              age: data.personalInfo.age || null,
              gender: data.personalInfo.gender || '',
              phone: data.personalInfo.phone || '',
              address: data.personalInfo.address || '',
              bio: data.personalInfo.bio || ''
            })
          }
          
          // Set notifications setting
          if (data?.settings?.notificationsEnabled !== undefined) {
            setNotificationsEnabled(data.settings.notificationsEnabled)
          }
        } catch (error) {
          console.error('Error loading patient data:', error)
        } finally {
          setIsLoadingPatientData(false)
        }
      } else {
        navigate('/patient-sign-in')
      }
    })

    return () => unsubscribe()
  }, [navigate])



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

  const handleNavClick = useCallback((section: 'dashboard' | 'calendar' | 'profile' | 'help' | 'facilities') => {
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
    console.log('🔘 openModal called with:', modalType)
    setShowModal(modalType)
    console.log('Setting showModal to:', modalType)
  }, [])

  const closeModal = useCallback(() => {
    setShowModal(null)
    setAppointmentForm({
      facilityId: '',
      facilityName: '',
      doctor: '',
      date: '',
      time: '',
      type: '',
      notes: ''
    })
  }, [])

  const handleBookAppointment = useCallback(async () => {
    console.log('🔍 handleBookAppointment called')
    console.log('User:', user)
    console.log('Appointment form:', appointmentForm)
    
    if (!user) {
      console.error('❌ No user found')
      alert('Please sign in to book an appointment')
      return
    }
    
    if (!appointmentForm.facilityId || !appointmentForm.date || !appointmentForm.time) {
      console.error('❌ Missing required fields:', { 
        facilityId: appointmentForm.facilityId, 
        date: appointmentForm.date, 
        time: appointmentForm.time 
      })
      alert('Please fill in all required fields')
      return
    }

    setIsBookingAppointment(true)
    console.log('🔄 Starting appointment booking...')
    
    try {
      console.log('📦 Importing firestoredb...')
      // Import the function dynamically to avoid TypeScript issues
      const { addAppointment } = await import('../services/firestoredb.js')
      console.log('✅ addAppointment imported successfully')
      
      const appointmentData = {
        facilityId: appointmentForm.facilityId,
        facilityName: appointmentForm.facilityName,
        patientName: user.displayName || 'Patient',
        patientEmail: user.email || '',
        doctor: appointmentForm.doctor,
        date: appointmentForm.date,
        time: appointmentForm.time,
        type: appointmentForm.type,
        notes: appointmentForm.notes,
        status: 'scheduled'
      }
      
      console.log('📋 Appointment data:', appointmentData)
      console.log('🔄 Calling addAppointment...')
      
      await addAppointment(user.uid, appointmentData)
      
      console.log('✅ Appointment booked successfully!')
      console.log('📋 Appointment data saved to Firestore:', appointmentData)
      alert('Appointment booked successfully! Check the Dashboard "My Consults" section to see your appointment.')
      closeModal()
      
      // Refresh the appointments list
      // You could add a state to refresh the appointments here
      
    } catch (error: any) {
      console.error('❌ Error booking appointment:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      
      // For now, show a success message even if Firestore fails (for testing)
      if (error.message.includes('firestoredb')) {
        console.log('🔄 Firestore import failed, showing test success message')
        alert('Test: Appointment booking form submitted successfully! (Firestore integration pending)')
        closeModal()
      } else {
        alert(`Failed to book appointment: ${error.message}`)
      }
    } finally {
      setIsBookingAppointment(false)
    }
  }, [user, appointmentForm, closeModal])

  const handleSaveProfile = useCallback(async () => {
    if (!user) return
    
    setIsSavingProfile(true)
    try {
      const { updatePatientPersonalInfo } = await import('../services/firestoredb.js')
      
      const personalInfo: PersonalInfo = {
        firstName: editProfileForm.firstName,
        lastName: editProfileForm.lastName,
        fullName: editProfileForm.fullName,
        dateOfBirth: editProfileForm.dateOfBirth,
        age: editProfileForm.age || undefined,
        gender: editProfileForm.gender,
        phone: editProfileForm.phone,
        address: editProfileForm.address,
        bio: editProfileForm.bio
      }
      
      await updatePatientPersonalInfo(user.uid, personalInfo)
      
      // Update local state
      setPatientData(prev => prev ? {
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          ...personalInfo
        }
      } : null)
      
      alert('Profile updated successfully!')
      closeModal()
    } catch (error: any) {
      console.error('Error saving profile:', error)
      alert(`Failed to save profile: ${error.message}`)
    } finally {
      setIsSavingProfile(false)
    }
  }, [user, editProfileForm, closeModal])

  const handleAddCondition = useCallback(async () => {
    if (!user || !addConditionForm.category || !addConditionForm.condition) {
      alert('Please fill in both category and condition')
      return
    }
    
    setIsAddingCondition(true)
    try {
      const { addMedicalCondition } = await import('../services/firestoredb.js')
      
      await addMedicalCondition(user.uid, addConditionForm.category, addConditionForm.condition)
      
      // Update local state
      setPatientData(prev => {
        if (!prev) return prev
        
        const updatedConditions = {
          ...prev.medicalInfo?.conditions,
          [addConditionForm.category]: [
            ...(prev.medicalInfo?.conditions?.[addConditionForm.category] || []),
            addConditionForm.condition
          ]
        }
        
        return {
          ...prev,
          medicalInfo: {
            ...prev.medicalInfo,
            conditions: updatedConditions
          }
        }
      })
      
      // Reset form
      setAddConditionForm({ category: '', condition: '' })
      alert('Medical condition added successfully!')
      closeModal()
    } catch (error: any) {
      console.error('Error adding condition:', error)
      alert(`Failed to add condition: ${error.message}`)
    } finally {
      setIsAddingCondition(false)
    }
  }, [user, addConditionForm, closeModal])

  const handleRemoveCondition = useCallback(async (category: string, condition: string) => {
    if (!user) return
    
    if (!confirm(`Are you sure you want to remove "${condition}" from ${category}?`)) {
      return
    }
    
    try {
      const { removeMedicalCondition } = await import('../services/firestoredb.js')
      
      await removeMedicalCondition(user.uid, category, condition)
      
      // Update local state
      setPatientData(prev => {
        if (!prev) return prev
        
        const updatedConditions = {
          ...prev.medicalInfo?.conditions,
          [category]: prev.medicalInfo?.conditions?.[category]?.filter(c => c !== condition) || []
        }
        
        return {
          ...prev,
          medicalInfo: {
            ...prev.medicalInfo,
            conditions: updatedConditions
          }
        }
      })
      
      alert('Medical condition removed successfully!')
    } catch (error: any) {
      console.error('Error removing condition:', error)
      alert(`Failed to remove condition: ${error.message}`)
    }
  }, [user])

  const handleUpdateSettings = useCallback(async () => {
    if (!user) return
    
    try {
      const { updatePatientSettings } = await import('../services/firestoredb.js')
      
      await updatePatientSettings(user.uid, { notificationsEnabled })
      
      // Update local state
      setPatientData(prev => prev ? {
        ...prev,
        settings: {
          ...prev.settings,
          notificationsEnabled
        }
      } : null)
      
      console.log('Settings updated successfully')
    } catch (error: any) {
      console.error('Error updating settings:', error)
      alert(`Failed to update settings: ${error.message}`)
    }
  }, [user, notificationsEnabled])

  const getUserInitials = useCallback(() => {
    if (patientData?.personalInfo?.fullName) {
      return patientData.personalInfo.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    if (user?.displayName) {
      return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
    }
    return 'U'
  }, [patientData?.personalInfo?.fullName, user?.displayName])

  const getUserDisplayName = useCallback(() => {
    // Use the patient's actual name from their profile
    if (patientData?.personalInfo?.fullName && patientData.personalInfo.fullName.trim()) {
      return patientData.personalInfo.fullName
    }
    if (patientData?.personalInfo?.firstName && patientData.personalInfo.lastName) {
      return `${patientData.personalInfo.firstName} ${patientData.personalInfo.lastName}`
    }
    if (user?.displayName) {
      return user.displayName
    }
    return 'Patient'
  }, [patientData?.personalInfo?.fullName, patientData?.personalInfo?.firstName, patientData?.personalInfo?.lastName, user?.displayName])

  const getUserEmail = useCallback(() => {
    return patientData?.email || user?.email || ''
  }, [patientData?.email, user?.email])

  const getPatientAge = useCallback(() => {
    if (patientData?.personalInfo?.age) {
      return patientData.personalInfo.age.toString()
    }
    if (patientData?.personalInfo?.dateOfBirth) {
      const birthDate = new Date(patientData.personalInfo.dateOfBirth)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return (age - 1).toString()
      }
      return age.toString()
    }
    return '--'
  }, [patientData?.personalInfo?.age, patientData?.personalInfo?.dateOfBirth])

  const getPatientPhone = useCallback(() => {
    return patientData?.personalInfo?.phone || 'Not set'
  }, [patientData?.personalInfo?.phone])

  const getPatientAddress = useCallback(() => {
    return patientData?.personalInfo?.address || 'Not set'
  }, [patientData?.personalInfo?.address])

  const getPatientBio = useCallback(() => {
    return patientData?.personalInfo?.bio || 'Welcome to LingapLink!'
  }, [patientData?.personalInfo?.bio])

  const getPatientGender = useCallback(() => {
    return patientData?.personalInfo?.gender || 'Not set'
  }, [patientData?.personalInfo?.gender])

  const getPatientDateOfBirth = useCallback(() => {
    return patientData?.personalInfo?.dateOfBirth || '--/--/----'
  }, [patientData?.personalInfo?.dateOfBirth])

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

  // Update settings when notifications change
  useEffect(() => {
    if (user && patientData) {
      handleUpdateSettings()
    }
  }, [notificationsEnabled, user, patientData])

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

    if (isLoading || isLoadingPatientData) {
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
            <li className={`nav-item ${activeSection === 'facilities' ? 'active' : ''}`} role="none">
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('facilities'); }}
                role="menuitem"
                aria-current={activeSection === 'facilities' ? 'page' : undefined}
                aria-label="Navigate to Healthcare Facilities"
              >
                <i className="fas fa-hospital" aria-hidden="true"></i>
                <span>Facilities</span>
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
                    <h3>{patientData?.activity?.appointments?.filter(apt => apt.status === 'scheduled').length || 0}</h3>
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
                  <button className="action-btn" onClick={() => {
                    console.log('🔘 Book Appointment button clicked in Quick Actions!')
                    openModal('bookAppointment')
                  }}>
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
                  {patientData?.activity?.appointments && patientData.activity.appointments.filter(apt => apt.status === 'scheduled').length > 0 ? (
                    patientData.activity.appointments
                      .filter(apt => apt.status === 'scheduled')
                      .slice(0, 3) // Show only first 3
                      .map((appointment) => (
                        <div key={appointment.id} className="appointment-card">
                          <div className="appointment-date">
                            <span className="date">{new Date(appointment.date).getDate()}</span>
                            <span className="month">{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                          </div>
                          <div className="appointment-info">
                            <h4>{appointment.doctor || 'Doctor TBD'}</h4>
                            <p>{appointment.type || 'Consultation'}</p>
                            <div className="appointment-time">{appointment.time}</div>
                          </div>
                          <div className="appointment-actions">
                            <button className="btn-outline">
                              <i className="fas fa-edit"></i>
                              Reschedule
                            </button>
                            <button className="btn-primary">
                              <i className="fas fa-video"></i>
                              Join Call
                            </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="no-appointments">
                      <p>No upcoming appointments</p>
                      <button 
                        className="btn-primary" 
                        onClick={() => openModal('bookAppointment')}
                      >
                        <i className="fas fa-calendar-plus"></i>
                        Book Appointment
                      </button>
                    </div>
                  )}
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
                      <button 
                        className="btn btn-primary" 
                        onClick={() => openModal('editProfile')}
                        aria-label="Edit profile information"
                      >
                        <i className="fas fa-edit"></i>
                        Edit Profile
                      </button>
                    </div>

                    {/* Personal Information */}
                    <div className="info-section">
                      <div className="section-header">
                        <h3>Personal Information</h3>
                        <button 
                          className="btn btn-outline" 
                          onClick={() => openModal('editProfile')}
                          aria-label="Edit personal information"
                        >
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
                          <span>{getPatientDateOfBirth()}</span>
                        </div>
                        <div className="info-item">
                          <label>Age</label>
                          <span>{getPatientAge()}</span>
                        </div>
                        <div className="info-item">
                          <label>Gender</label>
                          <span>{getPatientGender()}</span>
                        </div>
                        <div className="info-item">
                          <label>Phone Number</label>
                          <span>{getPatientPhone()}</span>
                        </div>
                        <div className="info-item">
                          <label>Email Address</label>
                          <span>{getUserEmail()}</span>
                        </div>
                        <div className="info-item">
                          <label>Address</label>
                          <span>{getPatientAddress()}</span>
                        </div>
                        <div className="info-item">
                          <label>Bio</label>
                          <span>{getPatientBio()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Pre-existing Diseases */}
                    <div className="info-section">
                      <div className="section-header">
                        <h3>Pre-existing Conditions</h3>
                        <button 
                          className="btn btn-outline"
                          onClick={() => openModal('addCondition')}
                          aria-label="Add new medical condition"
                        >
                          <i className="fas fa-plus"></i>
                          Add Condition
                        </button>
                      </div>
                      
                      <div className="diseases-section">
                        {patientData?.medicalInfo?.conditions && Object.keys(patientData.medicalInfo.conditions).length > 0 ? (
                          Object.entries(patientData.medicalInfo.conditions).map(([category, conditions]) => (
                            <div key={category} className="disease-category">
                              <h4>{category}</h4>
                              <div className="disease-tags">
                                {conditions.map((condition, index) => (
                                  <span 
                                    key={index} 
                                    className="disease-tag"
                                    onClick={() => handleRemoveCondition(category, condition)}
                                    style={{ cursor: 'pointer' }}
                                  >
                                    {condition} <i className="fas fa-times"></i>
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p style={{ color: '#666', fontStyle: 'italic' }}>No medical conditions recorded yet.</p>
                        )}
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
                          <button className="btn btn-primary" onClick={() => openModal('bookAppointment')}>
                            <i className="fas fa-plus"></i> New Appointment
                          </button>
                        </div>
                      </div>

                      {patientData?.activity?.appointments && patientData.activity.appointments.length > 0 ? (
                        <div className="consultation-history">
                          {patientData.activity.appointments
                            .sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())
                            .map((appointment) => {
                              const appointmentDate = new Date(appointment.date)
                              const today = new Date()
                              const yesterday = new Date(today)
                              yesterday.setDate(yesterday.getDate() - 1)
                              
                              let dateGroup = ''
                              if (appointmentDate.toDateString() === today.toDateString()) {
                                dateGroup = 'Today'
                              } else if (appointmentDate.toDateString() === yesterday.toDateString()) {
                                dateGroup = 'Yesterday'
                              } else {
                                dateGroup = appointmentDate.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })
                              }

                              return (
                                <div key={appointment.id} className="appointment-card-h">
                                  <div className="appointment-main">
                                    <div className="appointment-info">
                                                                             <div className="appointment-avatar-placeholder">
                                         {appointment.doctor ? appointment.doctor.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'DR'}
                                       </div>
                                      <span className="appointment-name">
                                        {appointment.doctor || 'Doctor TBD'}
                                      </span>
                                    </div>
                                    <button className="document-icon-btn" title="View appointment details">
                                      <i className="far fa-file-alt"></i>
                                    </button>
                                  </div>
                                  <div className="appointment-time-slot">
                                    {appointment.time} - {dateGroup}
                                  </div>
                                  <div className="appointment-details">
                                    <span className="appointment-type">{appointment.type || 'Consultation'}</span>
                                    <span className={`appointment-status status-${appointment.status}`}>
                                      {appointment.status}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      ) : (
                        <div className="no-consultations">
                          <div className="empty-state">
                            <i className="fas fa-calendar-times"></i>
                            <h3>No Consultation History</h3>
                            <p>You haven't had any consultations yet. Book your first appointment to get started.</p>
                            <button 
                              className="btn btn-primary" 
                              onClick={() => openModal('bookAppointment')}
                            >
                              <i className="fas fa-calendar-plus"></i>
                              Book Your First Appointment
                            </button>
                          </div>
                        </div>
                      )}
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

          {/* Facilities Section */}
          {activeSection === 'facilities' && (
            <section className="content-section active">
              <div className="section-header">
                <h1>Healthcare Facilities</h1>
                <p>Find and book appointments with healthcare providers near you</p>
              </div>
              
              <div className="facilities-search">
                <div className="search-filters">
                  <div className="search-box">
                    <i className="fas fa-search"></i>
                    <input 
                      type="text" 
                      placeholder="Search facilities by name..." 
                      id="facility-search"
                    />
                  </div>
                  
                  <div className="filter-row">
                    <select id="facility-type" className="filter-select">
                      <option value="">All Types</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Medical Clinic">Medical Clinic</option>
                      <option value="Dental Clinic">Dental Clinic</option>
                      <option value="Specialty Clinic">Specialty Clinic</option>
                    </select>
                    
                    <select id="facility-city" className="filter-select">
                      <option value="">All Cities</option>
                      <option value="Manila">Manila</option>
                      <option value="Quezon City">Quezon City</option>
                      <option value="Makati">Makati</option>
                      <option value="Taguig">Taguig</option>
                    </select>
                    
                    <select id="facility-specialty" className="filter-select">
                      <option value="">All Specialties</option>
                      <option value="Cardiology">Cardiology</option>
                      <option value="Dermatology">Dermatology</option>
                      <option value="Pediatrics">Pediatrics</option>
                      <option value="General Medicine">General Medicine</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="facilities-grid">
                {/* Sample Facility Cards */}
                <div className="facility-card">
                  <div className="facility-header">
                    <div className="facility-icon">
                      <i className="fas fa-hospital"></i>
                    </div>
                    <div className="facility-info">
                      <h3>Carmen Medical Clinic</h3>
                      <p className="facility-type">Medical Clinic</p>
                      <p className="facility-location">
                        <i className="fas fa-map-marker-alt"></i>
                        Makati City, Metro Manila
                      </p>
                    </div>
                    <div className="facility-rating">
                      <div className="stars">
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="far fa-star"></i>
                      </div>
                      <span className="rating-text">4.2 (128 reviews)</span>
                    </div>
                  </div>
                  
                  <div className="facility-details">
                    <div className="facility-specialties">
                      <h4>Specialties</h4>
                      <div className="specialty-tags">
                        <span className="specialty-tag">General Medicine</span>
                        <span className="specialty-tag">Cardiology</span>
                        <span className="specialty-tag">Pediatrics</span>
                      </div>
                    </div>
                    
                    <div className="facility-services">
                      <h4>Services</h4>
                      <div className="service-tags">
                        <span className="service-tag">Consultation</span>
                        <span className="service-tag">Laboratory Tests</span>
                        <span className="service-tag">Vaccination</span>
                      </div>
                    </div>
                    
                    <div className="facility-hours">
                      <h4>Operating Hours</h4>
                      <p>Monday - Friday: 8:00 AM - 6:00 PM</p>
                      <p>Saturday: 8:00 AM - 12:00 PM</p>
                      <p>Sunday: Closed</p>
                    </div>
                  </div>
                  
                  <div className="facility-actions">
                    <button className="btn btn-outline" onClick={() => openModal('viewFacility')}>
                      <i className="fas fa-info-circle"></i>
                      View Details
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal('bookAppointment')}>
                      <i className="fas fa-calendar-plus"></i>
                      Book Appointment
                    </button>
                  </div>
                </div>

                <div className="facility-card">
                  <div className="facility-header">
                    <div className="facility-icon">
                      <i className="fas fa-stethoscope"></i>
                    </div>
                    <div className="facility-info">
                      <h3>Manila General Hospital</h3>
                      <p className="facility-type">Hospital</p>
                      <p className="facility-location">
                        <i className="fas fa-map-marker-alt"></i>
                        Manila City, Metro Manila
                      </p>
                    </div>
                    <div className="facility-rating">
                      <div className="stars">
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                      </div>
                      <span className="rating-text">4.8 (256 reviews)</span>
                    </div>
                  </div>
                  
                  <div className="facility-details">
                    <div className="facility-specialties">
                      <h4>Specialties</h4>
                      <div className="specialty-tags">
                        <span className="specialty-tag">Emergency Medicine</span>
                        <span className="specialty-tag">Surgery</span>
                        <span className="specialty-tag">Internal Medicine</span>
                      </div>
                    </div>
                    
                    <div className="facility-services">
                      <h4>Services</h4>
                      <div className="service-tags">
                        <span className="service-tag">Emergency Care</span>
                        <span className="service-tag">Surgery</span>
                        <span className="service-tag">Imaging</span>
                      </div>
                    </div>
                    
                    <div className="facility-hours">
                      <h4>Operating Hours</h4>
                      <p>24/7 Emergency Services</p>
                      <p>Outpatient: 7:00 AM - 8:00 PM</p>
                    </div>
                  </div>
                  
                  <div className="facility-actions">
                    <button className="btn btn-outline" onClick={() => openModal('viewFacility')}>
                      <i className="fas fa-info-circle"></i>
                      View Details
                    </button>
                    <button className="btn btn-primary" onClick={() => openModal('bookAppointment')}>
                      <i className="fas fa-calendar-plus"></i>
                      Book Appointment
                    </button>
                  </div>
                </div>
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
              <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(); }}>
                <div className="form-group">
                  <label htmlFor="editFirstName">First Name</label>
                  <input 
                    type="text" 
                    id="editFirstName" 
                    value={editProfileForm.firstName}
                    onChange={(e) => setEditProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editLastName">Last Name</label>
                  <input 
                    type="text" 
                    id="editLastName" 
                    value={editProfileForm.lastName}
                    onChange={(e) => setEditProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editFullName">Full Name</label>
                  <input 
                    type="text" 
                    id="editFullName" 
                    value={editProfileForm.fullName}
                    onChange={(e) => setEditProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editDateOfBirth">Date of Birth</label>
                  <input 
                    type="date" 
                    id="editDateOfBirth" 
                    value={editProfileForm.dateOfBirth}
                    onChange={(e) => setEditProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editGender">Gender</label>
                  <select 
                    id="editGender" 
                    value={editProfileForm.gender}
                    onChange={(e) => setEditProfileForm(prev => ({ ...prev, gender: e.target.value }))}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="editPhoneNumber">Phone Number</label>
                  <input 
                    type="tel" 
                    id="editPhoneNumber" 
                    value={editProfileForm.phone}
                    onChange={(e) => setEditProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="editAddress">Address</label>
                  <textarea 
                    id="editAddress" 
                    rows={2}
                    value={editProfileForm.address}
                    onChange={(e) => setEditProfileForm(prev => ({ ...prev, address: e.target.value }))}
                  ></textarea>
                </div>
                <div className="form-group">
                  <label htmlFor="editBio">Bio</label>
                  <textarea 
                    id="editBio" 
                    rows={3}
                    value={editProfileForm.bio}
                    onChange={(e) => setEditProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {showModal === 'bookAppointment' && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Book Appointment</h3>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleBookAppointment(); }}>
                <div className="form-group">
                  <label htmlFor="appointmentFacility">Healthcare Facility *</label>
                  <select 
                    id="appointmentFacility" 
                    required
                    value={appointmentForm.facilityId}
                    onChange={(e) => {
                      const facilityId = e.target.value
                      const facilityName = e.target.options[e.target.selectedIndex].text
                      console.log('Selected facility:', { facilityId, facilityName })
                      setAppointmentForm(prev => ({
                        ...prev,
                        facilityId,
                        facilityName
                      }))
                    }}
                  >
                    <option value="">Select Facility</option>
                    <option value="g9dIxoSXbLM0Q95uUVNsLDddPJA2">Carmen Medical Clinic</option>
                    <option value="manila-general-hospital">Manila General Hospital</option>
                  </select>
                  <small style={{ color: '#666', fontSize: '12px' }}>
                    Note: Using actual Firebase UID for Carmen Medical Clinic.
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="appointmentType">Appointment Type *</label>
                  <select 
                    id="appointmentType" 
                    required
                    value={appointmentForm.type}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="">Select Type</option>
                    <option value="checkup">Regular Checkup</option>
                    <option value="consultation">Consultation</option>
                    <option value="therapy">Therapy Session</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="appointmentDoctor">Doctor (Optional)</label>
                  <input 
                    type="text" 
                    id="appointmentDoctor"
                    placeholder="Enter doctor name or leave blank"
                    value={appointmentForm.doctor}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, doctor: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="appointmentDate">Date *</label>
                  <input 
                    type="date" 
                    id="appointmentDate" 
                    required
                    value={appointmentForm.date}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="appointmentTime">Time *</label>
                  <input 
                    type="time" 
                    id="appointmentTime" 
                    required
                    value={appointmentForm.time}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="appointmentNotes">Notes</label>
                  <textarea 
                    id="appointmentNotes" 
                    rows={3}
                    placeholder="Any additional information..."
                    value={appointmentForm.notes}
                    onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={(e) => {
                  e.preventDefault()
                  console.log('🔘 Book Appointment button clicked!')
                  handleBookAppointment()
                }}
                disabled={isBookingAppointment}
              >
                {isBookingAppointment ? 'Booking...' : 'Book Appointment'}
              </button>
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

      {/* Add Medical Condition Modal */}
      {showModal === 'addCondition' && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add Medical Condition</h3>
              <button className="close-btn" onClick={closeModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e) => { e.preventDefault(); handleAddCondition(); }}>
                <div className="form-group">
                  <label htmlFor="conditionCategory">Category *</label>
                  <select 
                    id="conditionCategory" 
                    required
                    value={addConditionForm.category}
                    onChange={(e) => setAddConditionForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">Select Category</option>
                    {conditionCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="conditionName">Condition Name *</label>
                  <input 
                    type="text" 
                    id="conditionName" 
                    required
                    placeholder="Enter condition name"
                    value={addConditionForm.condition}
                    onChange={(e) => setAddConditionForm(prev => ({ ...prev, condition: e.target.value }))}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>Cancel</button>
              <button 
                className="btn-primary" 
                onClick={handleAddCondition}
                disabled={isAddingCondition}
              >
                {isAddingCondition ? 'Adding...' : 'Add Condition'}
              </button>
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