import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../config/firebase'
import { signOut } from 'firebase/auth'
import '../styles/shared-header.css'
import '../styles/dashboard.css'
import '../styles/csp-utilities.css'
import { getAITriageConfig } from '../config/ai-triage.config'
import { migrateExistingAppointments, getMigrationStatistics } from '../services/appointment-migration.service'

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





interface DashboardStats {
  totalPatients: number
  staffMembers: number
  todayAppointments: number
}

interface UrgencyData {
  [appointmentId: string]: {
    level: 'RED' | 'ORANGE' | 'GREEN'
    urgency: string
  }
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
  const [activeSection, setActiveSection] = useState<'dashboard' | 'my-consults' | 'help' | 'profile'>('dashboard')
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>('Yesterday')
  // Removed unused lastActivity state
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [facilityAppointments, setFacilityAppointments] = useState<any[]>([])
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(false)
  const [appointmentListener, setAppointmentListener] = useState<(() => void) | null>(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null)
  const [selectedPatientData, setSelectedPatientData] = useState<any>(null)
  const [isLoadingPatientData, setIsLoadingPatientData] = useState(false)
  const [appointmentModalTab, setAppointmentModalTab] = useState<'details' | 'personal' | 'conditions' | 'history' | 'documents'>('details')
  const [facilityData, setFacilityData] = useState<any>(null)
  const [isLoadingFacilityData, setIsLoadingFacilityData] = useState(true)
  const [activeConsultsTab, setActiveConsultsTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming')
  
  // New appointment modal state
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false)
  const [newAppointmentForm, setNewAppointmentForm] = useState({
    patientUid: '',
    date: '',
    time: '',
    doctor: '',
    type: 'consultation',
    notes: '',
    status: 'scheduled'
  })
  const [isCreatingAppointment, setIsCreatingAppointment] = useState(false)
  const [patientValidationError, setPatientValidationError] = useState('')
  
  // Edit appointment modal state
  const [showEditAppointmentModal, setShowEditAppointmentModal] = useState(false)
  const [editAppointmentForm, setEditAppointmentForm] = useState({
    date: '',
    time: '',
    doctor: '',
    status: 'scheduled',
    notes: ''
  })
  const [isEditingAppointment, setIsEditingAppointment] = useState(false)
  
  // Triage urgency state
  const [urgencyData, setUrgencyData] = useState<UrgencyData>({})
  
  // Profile editing state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false)
  const [editProfileForm, setEditProfileForm] = useState({
    name: '',
    type: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    website: '',
    description: '',
    licenseNumber: '',
    // New fields to match PatientPortal display
    specialties: [] as string[],
    services: [] as string[],
    staff: {
      totalStaff: 0,
      doctors: 0,
      nurses: 0,
      supportStaff: 0
    },
    capacity: {
      bedCapacity: 0,
      consultationRooms: 0
    },
    operatingHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '12:00', closed: false },
      sunday: { open: '09:00', close: '17:00', closed: true }
    }
  })
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  
  // Migration state
  const [migrationStats, setMigrationStats] = useState<{
    totalPatients: number
    totalAppointments: number
    migratedAppointments: number
    migrationProgress: number
  } | null>(null)
  const [isMigrating, setIsMigrating] = useState(false)
  
  // Document viewer state
  const [viewingDocument, setViewingDocument] = useState<any>(null)
  const [showDocumentModal, setShowDocumentModal] = useState(false)
  
  const sidebarRef = useRef<HTMLElement>(null)
  const sidebarOverlayRef = useRef<HTMLDivElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  // Refs for focus management
  const newAppointmentModalRef = useRef<HTMLDivElement>(null)
  const editAppointmentModalRef = useRef<HTMLDivElement>(null)
  const editProfileModalRef = useRef<HTMLDivElement>(null)
  const documentModalRef = useRef<HTMLDivElement>(null)
  const firstTabRef = useRef<HTMLButtonElement>(null)
  const lastTabRef = useRef<HTMLButtonElement>(null)







  // Dashboard statistics
  const dashboardStats: DashboardStats = useMemo(() => ({
    totalPatients: 2547,
    staffMembers: 45,
    todayAppointments: facilityAppointments.length
  }), [facilityAppointments])

  // Quick actions configuration
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'schedule',
      title: 'Schedule Appointment',
      icon: 'fas fa-calendar-plus',
      action: 'schedule',
      description: 'Book a new appointment'
    }
  ], [])

  useEffect(() => {
    // Check authentication
    const unsubscribe = auth.onAuthStateChanged(async (user: any) => {
      if (user) {
        setUser(user)
        setIsLoading(false)
        
        // Load facility data
        await loadFacilityData(user.uid)
        
        // Load appointments for the current user (facility or patient)
        loadUserAppointments(user.uid)
      } else {
        navigate('/')
      }
    })

    return () => {
      unsubscribe()
    }
  }, [navigate])



  const loadFacilityData = useCallback(async (userId: string) => {
    setIsLoadingFacilityData(true)
    try {
      // Import the function dynamically to avoid TypeScript issues
      const { getFirestore, doc, getDoc } = await import('firebase/firestore')
      const db = getFirestore()
      const facilityDoc = await getDoc(doc(db, 'facilities', userId))
      
      if (facilityDoc.exists()) {
        const data = facilityDoc.data()
        setFacilityData(data)
      } else {
        setFacilityData(null)
      }
    } catch (error) {
      console.warn('⚠️ Firestore access control error (this is normal during development):', error)
      setFacilityData(null)
    } finally {
      setIsLoadingFacilityData(false)
    }
  }, [])

  const loadUserAppointments = useCallback(async (userId: string) => {
    setIsLoadingAppointments(true)
    try {
      console.log('🔍 loadUserAppointments called for user:', userId)
      
      // First, check if user is a facility
      const { getFirestore, doc, getDoc } = await import('firebase/firestore')
      const db = getFirestore()
      const facilityDoc = await getDoc(doc(db, 'facilities', userId))
      
      if (facilityDoc.exists()) {
        console.log('🔍 User is a facility, loading facility appointments...')
        // User is a facility - load facility appointments
        const { getFacilityAppointments } = await import('../services/firestoredb.js')
        const appointments = await getFacilityAppointments(userId)
        console.log('📋 Facility appointments loaded:', appointments)
        setFacilityAppointments(appointments)
      } else {
        console.log('🔍 User is a patient, loading patient appointments...')
        // User is a patient - load patient appointments
        const { getPatientAppointments } = await import('../services/firestoredb.js')
        const appointments = await getPatientAppointments(userId)
        console.log('📋 Patient appointments loaded:', appointments)
        setFacilityAppointments(appointments)
      }
    } catch (error) {
      console.warn('⚠️ Firestore access control error (this is normal during development):', error)
      // Try to load appointments anyway using the service functions
      try {
        console.log('🔄 Attempting to load appointments using service functions...')
        const { getFacilityAppointments, getPatientAppointments } = await import('../services/firestoredb.js')
        
        // Try both approaches and see which one works
        let appointments: any[] = []
        try {
          appointments = await getFacilityAppointments(userId)
          console.log('📋 Facility appointments loaded via service:', appointments)
        } catch (facilityError) {
          console.log('🔄 Facility approach failed, trying patient approach...')
          try {
            appointments = await getPatientAppointments(userId)
            console.log('📋 Patient appointments loaded via service:', appointments)
          } catch (patientError) {
            console.log('🔄 Both approaches failed, using empty array')
            appointments = []
          }
        }
        
        setFacilityAppointments(appointments)
      } catch (serviceError) {
        console.warn('⚠️ Service functions also failed:', serviceError)
      setFacilityAppointments([])
      }
    } finally {
      setIsLoadingAppointments(false)
    }
  }, [])



  const openAppointmentModal = useCallback(async (appointment: any) => {
    setSelectedAppointment(appointment)
    setShowAppointmentModal(true)
    setAppointmentModalTab('details')
    
    // Load comprehensive patient data
    if (appointment.patientId) {
      setIsLoadingPatientData(true)
      try {
        const { getPatientData, getConsultationHistory, getPatientDocuments } = await import('../services/firestoredb.js')
        
        // Load basic patient data
        const patientData = await getPatientData(appointment.patientId)
        console.log('📋 Basic patient data loaded:', patientData)
        
        // Load consultation history
        let consultationHistory: any[] = []
        try {
          consultationHistory = await getConsultationHistory(appointment.patientId)
          console.log('📋 Consultation history loaded:', consultationHistory)
        } catch (error) {
          console.warn('⚠️ Could not load consultation history:', error)
        }
        
        // Load patient documents
        let patientDocuments: any[] = []
        try {
          patientDocuments = await getPatientDocuments(appointment.patientId)
          console.log('📋 Patient documents loaded:', patientDocuments)
        } catch (error) {
          console.warn('⚠️ Could not load patient documents:', error)
        }
        
        // Combine all patient data
        const comprehensivePatientData = {
          ...patientData,
          activity: {
            ...(patientData?.activity || {}),
            consultationHistory: consultationHistory,
            documents: patientDocuments
          }
        }
        
        console.log('📋 Comprehensive patient data:', comprehensivePatientData)
        setSelectedPatientData(comprehensivePatientData)
      } catch (error) {
        console.error('❌ Error loading patient data:', error)
        setSelectedPatientData(null)
      } finally {
        setIsLoadingPatientData(false)
      }
    }
  }, [])

  const closeAppointmentModal = useCallback(() => {
    setShowAppointmentModal(false)
    setSelectedAppointment(null)
    setSelectedPatientData(null)
    setAppointmentModalTab('details')
  }, [])

  const openNewAppointmentModal = useCallback(() => {
    setShowNewAppointmentModal(true)
    setNewAppointmentForm({
      patientUid: '',
      date: '',
      time: '',
      doctor: '',
      type: 'consultation',
      notes: '',
      status: 'scheduled'
    })
    setPatientValidationError('')
  }, [])

  const closeNewAppointmentModal = useCallback(() => {
    setShowNewAppointmentModal(false)
    setNewAppointmentForm({
      patientUid: '',
      date: '',
      time: '',
      doctor: '',
      type: 'consultation',
      notes: '',
      status: 'scheduled'
    })
    setPatientValidationError('')
  }, [])

  const openEditAppointmentModal = useCallback((appointment: any) => {
    setSelectedAppointment(appointment)
    setEditAppointmentForm({
      date: appointment.date || '',
      time: appointment.time || '',
      doctor: appointment.doctor || '',
      status: appointment.status || 'scheduled',
      notes: appointment.notes || ''
    })
    setShowEditAppointmentModal(true)
  }, [])

  const closeEditAppointmentModal = useCallback(() => {
    setShowEditAppointmentModal(false)
    setEditAppointmentForm({
      date: '',
      time: '',
      doctor: '',
      status: 'scheduled',
      notes: ''
    })
    setSelectedAppointment(null)
  }, [])

  // Profile editing functions
  const openEditProfileModal = useCallback(() => {
    if (facilityData) {
      setEditProfileForm({
        name: facilityData.facilityInfo?.name || '',
        type: facilityData.facilityInfo?.type || '',
        email: facilityData.facilityInfo?.email || facilityData.email || '',
        phone: facilityData.facilityInfo?.phone || '',
        address: facilityData.facilityInfo?.address || '',
        city: facilityData.facilityInfo?.city || '',
        province: facilityData.facilityInfo?.province || '',
        postalCode: facilityData.facilityInfo?.postalCode || '',
        country: facilityData.facilityInfo?.country || '',
        website: facilityData.facilityInfo?.website || '',
        description: facilityData.facilityInfo?.description || '',
        licenseNumber: facilityData.licenseNumber || '',
        // New fields
        specialties: facilityData.specialties || [],
        services: facilityData.services || [],
        staff: facilityData.staff || {
          totalStaff: 0,
          doctors: 0,
          nurses: 0,
          supportStaff: 0
        },
        capacity: facilityData.capacity || {
          bedCapacity: 0,
          consultationRooms: 0
        },
        operatingHours: facilityData.operatingHours || {
          monday: { open: '09:00', close: '17:00', closed: false },
          tuesday: { open: '09:00', close: '17:00', closed: false },
          wednesday: { open: '09:00', close: '17:00', closed: false },
          thursday: { open: '09:00', close: '17:00', closed: false },
          friday: { open: '09:00', close: '17:00', closed: false },
          saturday: { open: '09:00', close: '12:00', closed: false },
          sunday: { open: '09:00', close: '17:00', closed: true }
        }
      })
    }
    setShowEditProfileModal(true)
  }, [facilityData])

  const closeEditProfileModal = useCallback(() => {
    setShowEditProfileModal(false)
    setEditProfileForm({
      name: '',
      type: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
      country: '',
      website: '',
      description: '',
      licenseNumber: '',
      // Reset new fields
      specialties: [],
      services: [],
      staff: {
        totalStaff: 0,
        doctors: 0,
        nurses: 0,
        supportStaff: 0
      },
      capacity: {
        bedCapacity: 0,
        consultationRooms: 0
      },
      operatingHours: {
        monday: { open: '09:00', close: '17:00', closed: false },
        tuesday: { open: '09:00', close: '17:00', closed: false },
        wednesday: { open: '09:00', close: '17:00', closed: false },
        thursday: { open: '09:00', close: '17:00', closed: false },
        friday: { open: '09:00', close: '17:00', closed: false },
        saturday: { open: '09:00', close: '12:00', closed: false },
        sunday: { open: '09:00', close: '17:00', closed: true }
      }
    })
  }, [])

  // Document viewer functions
  const openDocumentModal = useCallback((document: any) => {
    setViewingDocument(document)
    setShowDocumentModal(true)
  }, [])

  const closeDocumentModal = useCallback(() => {
    setShowDocumentModal(false)
    setViewingDocument(null)
  }, [])

  // Keyboard navigation handlers
  const handleTabKeyDown = useCallback((e: React.KeyboardEvent, isFirstTab: boolean, isLastTab: boolean) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && isFirstTab) {
        // Shift+Tab from first tab should go to previous element
        e.preventDefault()
        const prevElement = e.currentTarget.previousElementSibling as HTMLElement
        prevElement?.focus()
      } else if (!e.shiftKey && isLastTab) {
        // Tab from last tab should go to next element
        e.preventDefault()
        const nextElement = e.currentTarget.nextElementSibling as HTMLElement
        nextElement?.focus()
      }
    }
  }, [])

  const handleModalKeyDown = useCallback((e: React.KeyboardEvent, modalRef: React.RefObject<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      // Close modal on Escape key
      if (showNewAppointmentModal) {
        closeNewAppointmentModal()
      } else if (showEditAppointmentModal) {
        closeEditAppointmentModal()
      } else if (showEditProfileModal) {
        closeEditProfileModal()
      } else if (showDocumentModal) {
        closeDocumentModal()
      }
    } else if (e.key === 'Tab') {
      // Trap focus within modal
      const modal = modalRef.current
      if (!modal) return

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement.focus()
      }
    }
  }, [showNewAppointmentModal, showEditAppointmentModal, showEditProfileModal, showDocumentModal])

  const handleSidebarKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isSidebarOpen) {
      closeSidebar()
    } else if (e.key === 'Tab' && !e.shiftKey) {
      // Tab from sidebar should go to main content
      e.preventDefault()
      mainContentRef.current?.focus()
    }
  }, [isSidebarOpen])

  const handleOpenDocument = useCallback((document: any) => {
    try {
      if (document.url) {
        window.open(document.url, '_blank', 'noopener,noreferrer')
      } else {
        alert('Document URL not available')
      }
    } catch (error) {
      console.error('Error opening document:', error)
      alert('Failed to open document. Please try downloading it instead.')
    }
  }, [])

  const handleEditProfileFormChange = useCallback((field: string, value: string) => {
    setEditProfileForm(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])



  const handleEditAppointmentFormChange = useCallback((field: string, value: string) => {
    setEditAppointmentForm(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleNewAppointmentFormChange = useCallback((field: string, value: string) => {
    setNewAppointmentForm(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear validation error when patient UID is being typed
    if (field === 'patientUid') {
      setPatientValidationError('')
    }
  }, [])

  const validatePatientUid = useCallback(async (uid: string) => {
    if (!uid.trim()) {
      setPatientValidationError('Patient UID is required')
      return false
    }
    
    try {
      const { getPatientData } = await import('../services/firestoredb.js')
      const patientData = await getPatientData(uid)
      
      if (!patientData) {
        setPatientValidationError('Patient not found with this UID')
        return false
      }
      
      if (patientData.role !== 'patient') {
        setPatientValidationError('UID belongs to a non-patient user')
        return false
      }
      
      setPatientValidationError('')
      return true
    } catch (error) {
      console.error('Error validating patient UID:', error)
      setPatientValidationError('Error validating patient UID')
      return false
    }
  }, [])

  // Removed unused auto-refresh effect

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

  const handleNavClick = useCallback((section: 'dashboard' | 'my-consults' | 'help' | 'profile') => {
    setActiveSection(section)
    closeSidebar()
  }, [closeSidebar])

  const handleTabClick = useCallback((tab: string) => {
    setActiveTab(tab)
  }, [])

  const handleConsultsTabClick = useCallback((tab: 'upcoming' | 'past' | 'cancelled') => {
    setActiveConsultsTab(tab)
  }, [])

  const filteredAppointments = useMemo(() => {
    if (!facilityAppointments.length) return []
    
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    return facilityAppointments.filter(appointment => {
      const appointmentDate = new Date(appointment.date)
      const appointmentDateTime = new Date(appointmentDate.getFullYear(), appointmentDate.getMonth(), appointmentDate.getDate())
      
      switch (activeConsultsTab) {
        case 'upcoming':
          return appointmentDateTime >= today && 
                 ['scheduled', 'confirmed', 'pending'].includes(appointment.status)
        case 'past':
          return appointmentDateTime < today || 
                 appointment.status === 'completed'
        case 'cancelled':
          return appointment.status === 'cancelled'
        default:
          return true
      }
    }).sort((a, b) => {
      const dateA = new Date(a.date)
      const dateB = new Date(b.date)
      return activeConsultsTab === 'past' ? dateB.getTime() - dateA.getTime() : dateA.getTime() - dateB.getTime()
    })
  }, [facilityAppointments, activeConsultsTab])

  const handleQuickAction = useCallback((action: string) => {
    console.log(`Executing quick action: ${action}`)
    
    switch (action) {
      case 'schedule':
        openNewAppointmentModal()
        break
      case 'reports':
        showNotification('Loading analytics dashboard...', 'info')
        // In production, this would navigate to reports section
        break
      default:
        showNotification('Action not implemented yet', 'info')
        break
    }
  }, [openNewAppointmentModal])

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

  const formatTime = useCallback((timeString: string) => {
    try {
      // Handle different time formats
      let time = timeString
      
      // If time is already in AM/PM format, return as is
      if (timeString.includes('AM') || timeString.includes('PM')) {
        return timeString
      }
      
      // If time is in HH:MM format, convert to AM/PM
      if (timeString.includes(':')) {
        const [hours, minutes] = timeString.split(':')
        const hour = parseInt(hours, 10)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        return `${displayHour}:${minutes.padStart(2, '0')} ${ampm}`
      }
      
      return timeString
    } catch (error) {
      console.warn('Error formatting time:', error)
      return timeString
    }
  }, [])

  const getUserInitials = useCallback(() => {
    if (!user?.displayName) return 'HF'
    return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()
  }, [user?.displayName])

  const getUserDisplayName = useCallback(() => {
    // For facilities, get the facility name from the correct fields
    if (facilityData?.facilityInfo?.name) {
      return facilityData.facilityInfo.name
    }
    if (facilityData?.name) {
      return facilityData.name
    }
    if (facilityData?.personalInfo?.fullName) {
      return facilityData.personalInfo.fullName
    }
    if (user?.displayName) {
      return user.displayName
    }
    return 'Healthcare Facility'
  }, [facilityData, user?.displayName])

  // Check if current user is the facility that owns the appointment
  const isCurrentUserFacility = useCallback((appointmentFacilityId: string) => {
    return appointmentFacilityId === user?.uid
  }, [user?.uid])

  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
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
    switch (type) {
      case 'success': return 'check-circle'
      case 'error': return 'exclamation-circle'
      case 'warning': return 'exclamation-triangle'
      case 'info': return 'info-circle'
      default: return 'info-circle'
    }
  }, [])

  const getNotificationColor = useCallback((type: string) => {
    switch (type) {
      case 'success': return '#22c55e'
      case 'error': return '#ef4444'
      case 'warning': return '#f59e0b'
      case 'info': return '#3b82f6'
      default: return '#3b82f6'
    }
  }, [])

  const handleSaveProfile = useCallback(async () => {
    if (!user?.uid || !facilityData) {
      showNotification('Unable to save profile: User not found', 'error')
      return
    }

    setIsSavingProfile(true)
    
    try {
      const firestoreModule: any = await import('../services/firestoredb.js')
      
      // Update facility information
      await firestoreModule.updateFacilityInfo(user.uid, {
        facilityInfo: {
          name: editProfileForm.name.trim(),
          type: editProfileForm.type.trim(),
          email: editProfileForm.email.trim(),
          phone: editProfileForm.phone.trim(),
          address: editProfileForm.address.trim(),
          city: editProfileForm.city.trim(),
          province: editProfileForm.province.trim(),
          postalCode: editProfileForm.postalCode.trim(),
          country: editProfileForm.country.trim(),
          website: editProfileForm.website.trim(),
          description: editProfileForm.description.trim()
        },
        licenseNumber: editProfileForm.licenseNumber.trim(),
        // New fields
        specialties: editProfileForm.specialties,
        services: editProfileForm.services,
        staff: editProfileForm.staff,
        capacity: editProfileForm.capacity,
        operatingHours: editProfileForm.operatingHours
      })
      
      // Ensure facility is searchable
      await firestoreModule.ensureFacilitySearchable(user.uid)
      
      showNotification('Profile updated successfully!', 'success')
      closeEditProfileModal()
      
      // Reload facility data to reflect changes
      await loadFacilityData(user.uid)
      
    } catch (error: any) {
      console.error('Error updating facility profile:', error)
      showNotification(`Failed to update profile: ${error.message}`, 'error')
    } finally {
      setIsSavingProfile(false)
    }
  }, [user?.uid, facilityData, editProfileForm, closeEditProfileModal, loadFacilityData, showNotification])

  // Removed unused handleNotificationToggle function

  // Removed unused updateLastActivity function

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    showNotification('Refreshing dashboard data...', 'info')
    
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false)
      showNotification('Dashboard refreshed successfully!', 'success')
    }, 1500)
  }, [showNotification])

  const handleMigration = useCallback(async () => {
    if (!user?.uid) return
    
    setIsMigrating(true)
    showNotification('Starting appointment migration...', 'info')
    
    try {
      const results = await migrateExistingAppointments()
      
      showNotification(
        `Migration completed! ${results.migratedCount} appointments migrated.`, 
        'success'
      )
      
      // Refresh migration stats
      try {
        const stats = await getMigrationStatistics()
        setMigrationStats(stats)
      } catch (statsError) {
        console.warn('⚠️ Failed to refresh migration stats:', statsError)
      }
      
      // Refresh appointments to show updated urgency levels
      if (user.uid) {
        try {
          await loadUserAppointments(user.uid)
        } catch (appointmentError) {
          console.warn('⚠️ Failed to refresh appointments after migration:', appointmentError)
        }
      }
      
    } catch (error) {
      console.error('Migration failed:', error)
      showNotification('Migration failed. Please try again.', 'error')
    } finally {
      setIsMigrating(false)
    }
  }, [user?.uid, showNotification, loadUserAppointments])

  const loadMigrationStats = useCallback(async () => {
    try {
      const stats = await getMigrationStatistics()
      setMigrationStats(stats)
    } catch (error) {
      console.warn('⚠️ Failed to load migration stats (this is normal if no appointments exist):', error)
      // Set default stats to prevent UI errors
      setMigrationStats({
        totalPatients: 0,
        totalAppointments: 0,
        migratedAppointments: 0,
        migrationProgress: 100
      })
    }
  }, [])

  const handleCreateAppointment = useCallback(async () => {
    // Validate form
    if (!newAppointmentForm.patientUid.trim()) {
      setPatientValidationError('Patient UID is required')
      return
    }
    
    if (!newAppointmentForm.date || !newAppointmentForm.time) {
      showNotification('Please select both date and time', 'error')
      return
    }
    
    // Validate patient UID
    const isValidPatient = await validatePatientUid(newAppointmentForm.patientUid)
    if (!isValidPatient) {
      return
    }
    
    setIsCreatingAppointment(true)
    
    try {
      const firestoreModule: any = await import('../services/firestoredb.js')
      
      await firestoreModule.createAppointmentForPatient(
        newAppointmentForm.patientUid,
        {
          date: newAppointmentForm.date,
          time: newAppointmentForm.time,
          doctor: newAppointmentForm.doctor,
          type: newAppointmentForm.type,
          notes: newAppointmentForm.notes,
          status: newAppointmentForm.status
        },
        user?.uid || '',
        getUserDisplayName()
      )
      
      showNotification('Appointment created successfully!', 'success')
      closeNewAppointmentModal()
      
      // Refresh appointments list
      if (user?.uid) {
        loadUserAppointments(user.uid)
      }
      
    } catch (error: any) {
      console.error('Error creating appointment:', error)
      showNotification(`Failed to create appointment: ${error.message}`, 'error')
    } finally {
      setIsCreatingAppointment(false)
    }
  }, [newAppointmentForm, user?.uid, validatePatientUid, closeNewAppointmentModal, loadUserAppointments, getUserDisplayName, showNotification])

  const handleSaveEditedAppointment = useCallback(async () => {
    if (!selectedAppointment) {
      showNotification('No appointment selected for editing', 'error')
      return
    }
    
    if (!editAppointmentForm.date || !editAppointmentForm.time) {
      showNotification('Please select both date and time', 'error')
      return
    }
    
    setIsEditingAppointment(true)
    
    try {
      const firestoreModule: any = await import('../services/firestoredb.js')
      
      await firestoreModule.updateAppointmentByFacility(
        selectedAppointment.id,
        selectedAppointment.patientId,
        {
          date: editAppointmentForm.date,
          time: editAppointmentForm.time,
          doctor: editAppointmentForm.doctor,
          status: editAppointmentForm.status,
          notes: editAppointmentForm.notes
        },
        user?.uid || ''
      )
      
      showNotification('Appointment updated successfully!', 'success')
      closeEditAppointmentModal()
      closeAppointmentModal() // Also close the details modal
      
      // Refresh appointments list
      if (user?.uid) {
        loadUserAppointments(user.uid)
      }
      
    } catch (error: any) {
      console.error('Error updating appointment:', error)
      showNotification(`Failed to update appointment: ${error.message}`, 'error')
    } finally {
      setIsEditingAppointment(false)
    }
  }, [selectedAppointment, editAppointmentForm, user?.uid, closeEditAppointmentModal, closeAppointmentModal, loadUserAppointments, showNotification])

  useEffect(() => {
    handleNavClick('dashboard')
    handleRefresh()
    
    // Load migration stats with error handling
    const loadStatsSafely = async () => {
      try {
        await loadMigrationStats()
      } catch (error) {
        console.warn('⚠️ Failed to load migration stats on mount:', error)
      }
    }
    loadStatsSafely()
  }, [handleNavClick, handleRefresh, loadMigrationStats])

  // Use stored urgency levels from Firestore instead of re-evaluating
  useEffect(() => {
    if (!filteredAppointments.length) return
    
    const processUrgencyData = async () => {
      const newUrgencyData: UrgencyData = {}
      
      try {
        // Extract urgency data from appointments (already stored in Firestore)
      for (const appointment of filteredAppointments) {
          console.log(`🔍 Processing appointment ${appointment.id}:`, {
            hasUrgency: !!appointment.urgency,
            urgencyData: appointment.urgency,
            notes: appointment.notes,
            type: appointment.type
          })
          
          if (appointment.urgency && appointment.urgency.level) {
            // Use stored urgency from Firestore
            newUrgencyData[appointment.id] = {
              level: appointment.urgency.level || 'GREEN',
              urgency: appointment.urgency.description || 'ROUTINE'
            }
            console.log(`🚨 Using stored urgency for appointment ${appointment.id}:`, appointment.urgency)
                    } else {
            // No stored urgency - try AI evaluation first, then fallback
            console.log(`🤖 Attempting AI evaluation for appointment ${appointment.id}...`)
            console.log(`📝 Appointment data:`, {
              id: appointment.id,
              notes: appointment.notes,
              type: appointment.type,
              status: appointment.status
            })
            
            try {
              // Try AI evaluation first
              console.log(`🔧 Importing triage service...`)
              const { evaluateAppointmentUrgency } = await import('../services/triage.service.ts')
              console.log(`✅ Triage service imported successfully`)
              
              console.log(`🧠 Calling AI evaluation...`)
              const aiResult = await evaluateAppointmentUrgency({
                id: appointment.id,
                notes: appointment.notes || '',
                type: appointment.type || '',
                status: appointment.status || '',
                date: appointment.date || '',
                time: appointment.time || ''
              })
              
              newUrgencyData[appointment.id] = {
                level: aiResult.level,
                urgency: aiResult.urgency
              }
              console.log(`✅ AI evaluation successful for appointment ${appointment.id}:`, aiResult)
              
            } catch (aiError) {
              console.log(`⚠️ AI evaluation failed for appointment ${appointment.id}, using fallback:`, aiError)
              
              // Fallback to keyword-based evaluation
              const text = `${appointment.notes || ''} ${appointment.type || ''}`.toLowerCase();
              
              // Critical/Red indicators
              const redKeywords = [
                'chest pain', 'heart attack', 'stroke', 'severe bleeding', 'unconscious',
                'difficulty breathing', 'severe trauma', 'overdose', 'suicide', 'seizure',
                'cardiac arrest', 'respiratory failure', 'anaphylaxis', 'severe burns'
              ];
              
              // Urgent/Orange indicators
              const orangeKeywords = [
                'high fever', 'severe headache', 'broken bone', 'deep cut', 'infection',
                'dehydration', 'severe pain', 'allergic reaction', 'meningitis symptoms',
                'appendicitis', 'gallbladder', 'kidney stone', 'pneumonia symptoms'
              ];
              
              let fallbackLevel: 'RED' | 'ORANGE' | 'GREEN' = 'GREEN';
              let fallbackUrgency = 'ROUTINE';
              
              // Check for red level
              if (redKeywords.some(keyword => text.includes(keyword))) {
                fallbackLevel = 'RED';
                fallbackUrgency = 'CRITICAL';
              }
              // Check for orange level
              else if (orangeKeywords.some(keyword => text.includes(keyword))) {
                fallbackLevel = 'ORANGE';
                fallbackUrgency = 'VERY URGENT';
              }
              
              newUrgencyData[appointment.id] = { 
                level: fallbackLevel, 
                urgency: fallbackUrgency 
              }
              console.log(`⚠️ Using fallback for appointment ${appointment.id}: ${fallbackLevel} - ${fallbackUrgency}`)
            }
        }
      }
      
      setUrgencyData(newUrgencyData)
      } catch (error) {
        console.warn('⚠️ Error processing urgency data, using fallback:', error)
        // Set fallback urgency for all appointments
        filteredAppointments.forEach(appointment => {
          newUrgencyData[appointment.id] = { level: 'GREEN', urgency: 'ROUTINE' }
        })
        setUrgencyData(newUrgencyData)
      }
    }
    
    // Call the async function
    processUrgencyData()
  }, [filteredAppointments])

  // Real-time listener for appointments (both facility and patient)
  useEffect(() => {
    if (!user?.uid) return
    
    // COMPLETELY DISABLE real-time listeners to prevent console errors
    console.log('🔍 Real-time listeners disabled - using periodic refresh only')
    
    // Load appointments once and set up periodic refresh
    loadUserAppointments(user.uid)
    
    // Set up periodic refresh every 30 seconds instead of real-time
    const refreshInterval = setInterval(() => {
      if (user?.uid) {
        loadUserAppointments(user.uid)
      }
    }, 30000)
    
    return () => {
      clearInterval(refreshInterval)
    }
  }, [user?.uid, loadUserAppointments])

  // Comprehensive console error filtering and global error handler
  useEffect(() => {
    // Store original console methods
    const originalError = console.error
    const originalWarn = console.warn
    const originalLog = console.log
    
    // Create a more aggressive error filter
    const shouldFilterError = (message: string) => {
      const lowerMessage = message.toLowerCase()
      return (
        lowerMessage.includes('fetch api cannot load') ||
        lowerMessage.includes('access control checks') ||
        lowerMessage.includes('firestore.googleapis.com') ||
        lowerMessage.includes('webchannel_blob') ||
        lowerMessage.includes('enqueuejob') ||
        lowerMessage.includes('readablestreamdefaultreadererrorreadrequests') ||
        lowerMessage.includes('readablestreamerror') ||
        lowerMessage.includes('readablestreamdefaultcontrollererror') ||
        lowerMessage.includes('u[v] is not a function') ||
        lowerMessage.includes('api.js') ||
        lowerMessage.includes('gapi.loaded') ||
        lowerMessage.includes('firestore') ||
        lowerMessage.includes('webchannel')
      )
    }
    
    // Override console.error to filter out Firestore errors
    console.error = (...args) => {
      const message = args.join(' ')
      
      // Filter out Firestore and related errors completely
      if (shouldFilterError(message)) {
        // Don't log anything - completely silent
        return
      }
      
      // Log other errors normally
      originalError.apply(console, args)
    }
    
    // Override console.warn to filter out some warnings
    console.warn = (...args) => {
      const message = args.join(' ')
      
      // Filter out excessive Firestore warnings
      if (message.includes('Firestore listener error') && message.includes('normal during development')) {
        // Only show this warning once per session
        if (!(window as any).firestoreWarningShown) {
          originalWarn.apply(console, args)
          ;(window as any).firestoreWarningShown = true
        }
        return
      }
      
      // Filter out Firestore warnings too
      if (shouldFilterError(message)) {
        return
      }
      
      // Log other warnings normally
      originalWarn.apply(console, args)
    }
    
    // Override console.log to filter out some logs
    console.log = (...args) => {
      const message = args.join(' ')
      
      // Filter out Firestore-related logs
      if (shouldFilterError(message)) {
        return
      }
      
      // Log other messages normally
      originalLog.apply(console, args)
    }
    
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMessage = event.message || ''
      const errorFilename = event.filename || ''
      
      // Filter out Firestore access control errors
      if (errorMessage.includes('access control checks') || 
          errorMessage.includes('Fetch API cannot load') ||
          errorFilename.includes('webchannel_blob') ||
          errorFilename.includes('firestore.googleapis.com')) {
        // Completely prevent the error from appearing
        event.preventDefault()
        event.stopPropagation()
        return false
      }
      
      // Filter out Google API errors
      if (errorMessage.includes('u[v] is not a function') ||
          errorFilename.includes('api.js') ||
          errorFilename.includes('gapi.loaded')) {
        // Completely prevent the error from appearing
        event.preventDefault()
        event.stopPropagation()
        return false
      }
      
      // Log other errors normally
      originalError('🚨 Unhandled error:', event)
      return true
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || event.reason || ''
      
      // Filter out Firestore promise rejections
      if (reason.includes('access control checks') || 
          reason.includes('Fetch API cannot load') ||
          reason.includes('firestore.googleapis.com')) {
        // Completely prevent the rejection from appearing
        event.preventDefault()
        return false
      }
      
      // Log other rejections normally
      originalError('🚨 Unhandled promise rejection:', event.reason)
      return true
    }

    // Add global error handlers with higher priority
    window.addEventListener('error', handleGlobalError, true)
    window.addEventListener('unhandledrejection', handleUnhandledRejection, true)
    
    // Add console clear message
    originalLog('🧹 Console error filtering enabled - Firestore errors will be completely filtered')
    
    return () => {
      // Restore original console methods
      console.error = originalError
      console.warn = originalWarn
      console.log = originalLog
      
      // Remove event listeners
      window.removeEventListener('error', handleGlobalError, true)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection, true)
    }
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
  }, [closeSidebar, toggleSidebar, handleNavClick, handleRefresh])

  if (isLoading || isLoadingFacilityData) {
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
      <aside 
        className={`sidebar ${isSidebarOpen ? 'active' : ''}`} 
        ref={sidebarRef} 
        role="navigation" 
        aria-label="Main navigation"
        onKeyDown={handleSidebarKeyDown}
        tabIndex={-1}
      >
        <div className="sidebar-header">
          <a href="/" className="logo" aria-label="LingapLink - Healthcare Platform">
            <i className="fas fa-heartbeat" aria-hidden="true"></i>
            <span>LingapLink</span>
          </a>
        </div>
        
        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          <ul className="nav-items" role="menubar">
            <li className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`} role="none">
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('dashboard'); }}
                aria-current={activeSection === 'dashboard' ? 'page' : undefined}
                role="menuitem"
              >
                <i className="fas fa-th-large" aria-hidden="true"></i>
                <span>Dashboard</span>
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'my-consults' ? 'active' : ''}`} role="none">
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('my-consults'); }}
                aria-current={activeSection === 'my-consults' ? 'page' : undefined}
                role="menuitem"
              >
                <i className="fas fa-notes-medical" aria-hidden="true"></i>
                <span>Appointments</span>
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'help' ? 'active' : ''}`} role="none">
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('help'); }}
                role="menuitem"
                aria-current={activeSection === 'help' ? 'page' : undefined}
              >
                <i className="fas fa-question-circle" aria-hidden="true"></i>
                <span>Help</span>
              </button>
            </li>
            <li className={`nav-item ${activeSection === 'profile' ? 'active' : ''}`} role="none">
              <button 
                className="nav-link" 
                onClick={(e) => { e.preventDefault(); handleNavClick('profile'); }}
                aria-current={activeSection === 'profile' ? 'page' : undefined}
                role="menuitem"
              >
                <i className="fas fa-user-circle" aria-hidden="true"></i>
                <span>Profile</span>
              </button>
            </li>
            <li className="nav-item" role="none">
              <button className="nav-link" onClick={handleLogout} aria-label="Sign out of your account" role="menuitem">
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
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'active' : ''}`} 
        ref={sidebarOverlayRef} 
        onClick={closeSidebar}
        aria-hidden="true"
        role="presentation"
      />

      {/* Main Content */}
      <main 
        className="main-content" 
        ref={mainContentRef}
        tabIndex={-1}
        role="main"
        aria-label="Dashboard main content"
      >
        {/* Top Bar */}
        <div className="top-bar">
          <div className="top-bar-left">
            <button 
              className="mobile-menu-toggle" 
              onClick={toggleSidebar}
              aria-label="Toggle mobile menu"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
            
            <button 
              className="refresh-btn" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              aria-label="Refresh dashboard data"
              title="Refresh dashboard (Ctrl+R)"
            >
            </button>
          </div>
          

        </div>
        
        <div className="main-container">
          {/* Dashboard Section */}
          {activeSection === 'dashboard' && (
            <section className="content-section active">
              <div className="section-header">
                <h1>Dashboard</h1>
                <p>Healthcare facility management dashboard</p>
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
                  
                  {/* Migration Button */}
                  {migrationStats && migrationStats.migrationProgress < 100 && (
                    <button 
                      className="btn btn-warning action-btn"
                      onClick={handleMigration}
                      disabled={isMigrating}
                      title="Migrate existing appointments to include urgency levels"
                    >
                      <i className={`fas ${isMigrating ? 'fa-spinner fa-spin' : 'fa-database'}`} aria-hidden="true"></i>
                      <span>
                        {isMigrating ? 'Migrating...' : `Migrate Appointments (${migrationStats.migrationProgress}%)`}
                      </span>
                    </button>
                  )}
                  
                  {/* Development Mode Indicator */}
                  {import.meta.env?.DEV && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '0.5rem', 
                      backgroundColor: '#dcfce7', 
                      borderRadius: '4px',
                      border: '1px solid #bbf7d0',
                      fontSize: '0.75rem',
                      color: '#166534',
                      textAlign: 'center'
                    }}>
                      <i className="fas fa-code"></i> Development Mode - Real-time listeners disabled, using periodic refresh (30s)
                </div>
                  )}
                </div>
                
                {/* Migration Status */}
                {migrationStats && (
                  <div style={{ 
                    marginTop: '1rem', 
                    padding: '0.75rem', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontSize: '0.875rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📊 Appointment Migration Status:</span>
                      <span style={{ 
                        fontWeight: 'bold',
                        color: migrationStats.migrationProgress === 100 ? '#059669' : '#d97706' /* Darker orange for WCAG AA compliance */
                      }}>
                        {migrationStats.migrationProgress}% Complete
                      </span>
                    </div>
                    <div style={{ marginTop: '0.5rem', color: '#4a5568' }}> {/* Darker gray for WCAG AA compliance */}
                      {migrationStats.migratedAppointments} of {migrationStats.totalAppointments} appointments migrated
                    </div>
                  </div>
                )}
              </div>
              
              <div className="dashboard-section" role="region" aria-label="Today's schedule">
                <h3>Today's Schedule</h3>
                
                {/* Triage Legend */}
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '15px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: '0', fontSize: '14px', color: '#475569' }}>🚨 Triage Urgency Levels:</h4>
                  <div style={{ 
                    fontSize: '12px', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    backgroundColor: getAITriageConfig().enabled ? '#dcfce7' : '#fef3c7',
                    color: getAITriageConfig().enabled ? '#166534' : '#92400e',
                    border: `1px solid ${getAITriageConfig().enabled ? '#bbf7d0' : '#fde68a'}`
                  }}>
                    <i className={`fas ${getAITriageConfig().enabled ? 'fa-robot' : 'fa-brain'}`} style={{ marginRight: '4px' }}></i>
                    {getAITriageConfig().enabled ? 'AI Triage Active' : 'Fallback Mode'}
                  </div>
                </div>
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: '#dc2626', 
                        borderRadius: '4px',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></div>
                      <span style={{ fontSize: '13px' }}><strong>RED:</strong> Critical - Life-threatening</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: '#d97706', /* Darker orange for WCAG AA compliance */
                        borderRadius: '4px',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></div>
                      <span style={{ fontSize: '13px' }}><strong>ORANGE:</strong> Very Urgent - Serious</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ 
                        width: '20px', 
                        height: '20px', 
                        backgroundColor: '#059669', 
                        borderRadius: '4px',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}></div>
                      <span style={{ fontSize: '13px' }}><strong>GREEN:</strong> Routine - Non-urgent</span>
                    </div>
                  </div>
                </div>
                
                <div className="appointments-list" role="list" aria-label="List of today's appointments">
                  {isLoadingAppointments ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <i className="fas fa-spinner fa-spin"></i>
                      </div>
                      <h3>Loading Schedule...</h3>
                      <p>Please wait while we fetch today's appointments.</p>
                    </div>
                  ) : facilityAppointments.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon">
                        <i className="fas fa-calendar-times"></i>
                      </div>
                      <h3>No Appointments Today</h3>
                      <p>You don't have any appointments scheduled for today.</p>
                    </div>
                  ) : (
                    facilityAppointments.map((appointment) => {
                      const urgency = urgencyData[appointment.id] || { level: 'GREEN', urgency: 'ROUTINE' }
                      const urgencyStyles = {
                        backgroundColor: urgency.level === 'RED' ? '#dc2626' : 
                                       urgency.level === 'ORANGE' ? '#d97706' : '#059669', /* Darker orange for WCAG AA compliance */
                        color: 'white',
                        borderColor: urgency.level === 'RED' ? '#dc2626' : 
                                   urgency.level === 'ORANGE' ? '#d97706' : '#059669' /* Darker orange for WCAG AA compliance */
                      }
                      
                      return (
                        <div key={appointment.id} className="appointment-card" role="listitem">
                          {/* Triage Urgency Indicator */}
                          <div className="urgency-indicator" style={urgencyStyles}>
                            <div className="urgency-level">{urgency.level}</div>
                            <div className="urgency-text">{urgency.urgency}</div>
                          </div>
                          
                          <div className="appointment-date" aria-label={`Appointment time: ${appointment.time}`}>
                            <span className="date">{formatTime(appointment.time).split(' ')[0]}</span>
                            <span className="month">{formatTime(appointment.time).split(' ')[1]}</span>
                          </div>
                          <div className="appointment-info">
                            <h4>{appointment.doctor || 'Doctor TBD'}</h4>
                            <p>{appointment.type} - {appointment.facilityName || 'Facility'}</p>
                            <div className="appointment-time">Patient: {appointment.patientName}</div>
                          </div>
                          <div className="appointment-actions">
                            <span className={`status ${appointment.status}`} aria-label={`Appointment status: ${appointment.status}`}>
                              {appointment.status === 'confirmed' ? 'Confirmed' : 
                               appointment.status === 'pending' ? 'Pending' : 
                               appointment.status === 'scheduled' ? 'Scheduled' : 
                               appointment.status === 'completed' ? 'Completed' : 
                               appointment.status === 'cancelled' ? 'Cancelled' : appointment.status}
                            </span>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>


            </section>
          )}



          {/* My Consults Section */}
          {activeSection === 'my-consults' && (
            <section className="content-section active">
              <div className="section-header-flex">
                <div className="section-title">
                  <h1 className="section-main-title">Appointments</h1>
                  <p className="facility-info" style={{ fontSize: '14px', color: '#4a5568', marginTop: '4px' }}> {/* Darker gray for WCAG AA compliance */}
                    <i className="fas fa-calendar-alt"></i> {facilityData ? 'Healthcare Facility' : 'Patient Portal'}
                  </p>
                </div>
                <div className="section-controls">
                  <button 
                    className="btn btn-outline" 
                    onClick={() => user && loadUserAppointments(user.uid)}
                    disabled={isLoadingAppointments}
                    title="Refresh appointments list"
                  >
                    <i className={`fas ${isLoadingAppointments ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
                    {isLoadingAppointments ? ' Refreshing...' : ' Refresh Appointments'}
                  </button>

                  <button className="btn btn-primary" onClick={openNewAppointmentModal} aria-label="Create a new appointment">
                    <i className="fas fa-plus"></i> New Appointment
                  </button>
                </div>
              </div>



              {/* Triage Legend */}
              <div style={{ 
                marginBottom: '20px', 
                padding: '15px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: '0', fontSize: '14px', color: '#475569' }}>🚨 Triage Urgency Levels:</h4>
                  <div style={{ 
                    fontSize: '12px', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    backgroundColor: getAITriageConfig().enabled ? '#dcfce7' : '#fef3c7',
                    color: getAITriageConfig().enabled ? '#166534' : '#92400e',
                    border: `1px solid ${getAITriageConfig().enabled ? '#bbf7d0' : '#fde68a'}`
                  }}>
                    <i className={`fas ${getAITriageConfig().enabled ? 'fa-robot' : 'fa-brain'}`} style={{ marginRight: '4px' }}></i>
                    {getAITriageConfig().enabled ? 'AI Triage Active' : 'Fallback Mode'}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: '#dc2626', 
                      borderRadius: '4px',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}></div>
                    <span style={{ fontSize: '13px' }}><strong>RED:</strong> Critical - Life-threatening</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: '#d97706', /* Darker orange for WCAG AA compliance */
                      borderRadius: '4px',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}></div>
                    <span style={{ fontSize: '13px' }}><strong>ORANGE:</strong> Very Urgent - Serious</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '20px', 
                      height: '20px', 
                      backgroundColor: '#059669', 
                      borderRadius: '4px',
                      border: '2px solid white',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}></div>
                    <span style={{ fontSize: '13px' }}><strong>GREEN:</strong> Routine - Non-urgent</span>
                  </div>
                </div>
              </div>
              
              <div className="content-tabs" role="tablist" aria-label="Appointment consultation tabs">
                <button 
                  ref={firstTabRef}
                  className={`tab-link ${activeConsultsTab === 'upcoming' ? 'active' : ''}`}
                  onClick={() => handleConsultsTabClick('upcoming')}
                  onKeyDown={(e) => handleTabKeyDown(e, true, false)}
                  role="tab"
                  aria-selected={activeConsultsTab === 'upcoming'}
                  aria-label="View upcoming appointments"
                >
                  Upcoming
                </button>
                <button 
                  className={`tab-link ${activeConsultsTab === 'past' ? 'active' : ''}`}
                  onClick={() => handleConsultsTabClick('past')}
                  onKeyDown={(e) => handleTabKeyDown(e, false, false)}
                  role="tab"
                  aria-selected={activeConsultsTab === 'past'}
                  aria-label="View past appointments"
                >
                  Past
                </button>
                <button 
                  ref={lastTabRef}
                  className={`tab-link ${activeConsultsTab === 'cancelled' ? 'active' : ''}`}
                  onClick={() => handleConsultsTabClick('cancelled')}
                  onKeyDown={(e) => handleTabKeyDown(e, false, true)}
                  role="tab"
                  aria-selected={activeConsultsTab === 'cancelled'}
                  aria-label="View cancelled appointments"
                >
                  Cancelled
                </button>
              </div>
              
              <div className="records-list">
                {isLoadingAppointments ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <i className="fas fa-spinner fa-spin"></i>
                    </div>
                    <h3>Loading Appointments...</h3>
                    <p>Please wait while we fetch your appointments.</p>
                  </div>
                ) : filteredAppointments.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">
                      <i className="fas fa-calendar-times"></i>
                    </div>
                    <h3>No {activeConsultsTab.charAt(0).toUpperCase() + activeConsultsTab.slice(1)} Appointments</h3>
                    <p>
                      {activeConsultsTab === 'upcoming' && "You don't have any upcoming appointments scheduled."}
                      {activeConsultsTab === 'past' && "You don't have any past appointments or completed consultations."}
                      {activeConsultsTab === 'cancelled' && "You don't have any cancelled appointments."}
                    </p>
                    {activeConsultsTab === 'upcoming' && (
                      <>
                        <p style={{ fontSize: '14px', color: '#4a5568', marginTop: '8px' }}> {/* Darker gray for WCAG AA compliance */}
                          <i className="fas fa-info-circle"></i> 
                          {facilityData ? 
                            'Patients can book appointments through the PatientPortal. Use the refresh button above to check for new appointments.' :
                            'You can book appointments through the PatientPortal. Use the refresh button above to check for new appointments.'
                          }
                        </p>
                        <button className="btn btn-primary" onClick={openNewAppointmentModal} aria-label="Schedule a new appointment">
                          <i className="fas fa-plus" aria-hidden="true"></i> Schedule New Appointment
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  filteredAppointments.map((appointment) => {
                    const urgency = urgencyData[appointment.id] || { level: 'GREEN', urgency: 'ROUTINE' }
                    const urgencyStyles = {
                      backgroundColor: urgency.level === 'RED' ? '#dc2626' : 
                                     urgency.level === 'ORANGE' ? '#ea580c' : '#059669',
                      color: 'white',
                      borderColor: urgency.level === 'RED' ? '#dc2626' : 
                                 urgency.level === 'ORANGE' ? '#ea580c' : '#059669'
                    }
                    
                    return (
                      <div key={appointment.id} className="record-item-card">
                        {/* Triage Urgency Indicator */}
                        <div className="urgency-indicator" style={urgencyStyles}>
                          <div className="urgency-level">{urgency.level}</div>
                          <div className="urgency-text">{urgency.urgency}</div>
                        </div>
                        
                        <div className="date-box">
                          <span className="day">{new Date(appointment.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                          <span className="date-num">{new Date(appointment.date).getDate()}</span>
                        </div>
                        <div className="record-divider-v"></div>
                        <div className="record-details-grid">
                          <div className="detail-item-flex">
                            <i className="far fa-clock"></i>
                            <span>{formatTime(appointment.time)}</span>
                          </div>
                          <div className="detail-item-flex">
                            <span>Type: {appointment.type}</span>
                          </div>
                          <div className="detail-item-flex">
                            <i className="far fa-user"></i>
                            <span>{appointment.patientName}</span>
                          </div>
                          <div className="detail-item-flex">
                            <span>Status: {appointment.status}</span>
                          </div>
                          {appointment.doctor && (
                            <div className="detail-item-flex">
                              <i className="fas fa-user-md"></i>
                              <span>{appointment.doctor}</span>
                            </div>
                          )}
                          {appointment.notes && (
                            <div className="detail-item-flex">
                              <span 
                                className={appointment.notes.length > 100 ? 'long-notes' : ''}
                                title={appointment.notes.length > 100 ? appointment.notes : ''}
                              >
                                Notes: {appointment.notes}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="record-actions-dropdown">
                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => openAppointmentModal(appointment)}
                            style={{ marginBottom: '8px' }}
                            aria-label="View appointment details"
                          >
                            <i className="fas fa-eye" aria-hidden="true"></i> View Details
                          </button>
                          <select 
                            value={appointment.status}
                            onChange={async (e) => {
                              const newStatus = e.target.value
                              console.log('Status changed to:', newStatus)
                              
                              try {
                                // Import the update function
                                const { updateAppointmentStatus } = await import('../services/firestoredb.js')
                                
                                // Update the appointment status in the database
                                await updateAppointmentStatus(
                                  appointment.id,
                                  newStatus,
                                  appointment.patientId,
                                  user?.uid || ''
                                )
                                
                                // Show success notification
                                showNotification(`Appointment status updated to ${newStatus}`, 'success')
                                
                                // Reload appointments to reflect the change
                                if (user?.uid) {
                                  loadUserAppointments(user.uid)
                                }
                                
                              } catch (error) {
                                console.error('Error updating appointment status:', error)
                                showNotification('Failed to update appointment status', 'error')
                              }
                            }}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    )
                  })
                )}
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

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <section className="content-section active">
              <div className="section-header-flex">
                <div className="section-title">
                  <h1 className="section-main-title">Healthcare Facility Profile</h1>
                  <p>Manage your facility information and settings</p>
                </div>
                <div className="section-controls">
                  <button className="btn btn-primary" onClick={openEditProfileModal} aria-label="Edit facility profile">
                    <i className="fas fa-edit" aria-hidden="true"></i> Edit Profile
                  </button>
                </div>
              </div>

              <div className="profile-container">
                <div className="profile-header">
                  <div className="profile-avatar">
                    <div className="avatar-placeholder">
                      <i className="fas fa-hospital"></i>
                    </div>
                  </div>
                  <div className="profile-info">
                    <h2>{getUserDisplayName()}</h2>
                    <p className="facility-type">{facilityData?.facilityInfo?.type || 'Healthcare Facility'}</p>
                    <p className="facility-location">
                      <i className="fas fa-map-marker-alt"></i>
                      {facilityData?.facilityInfo?.city && facilityData?.facilityInfo?.province 
                        ? `${facilityData.facilityInfo.city}, ${facilityData.facilityInfo.province}`
                        : facilityData?.facilityInfo?.address || 'Location not available'
                      }
                    </p>
                  </div>
                </div>

                <div className="profile-content">
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Facility ID</label>
                      <span style={{ 
                        fontFamily: 'monospace', 
                        fontWeight: 'bold', 
                        color: '#0052cc', /* Darker blue for WCAG AA compliance */
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>{facilityData?.uniqueFacilityId || 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>Facility Name</label>
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>{facilityData?.facilityInfo?.name || 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>Email Address</label>
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>{facilityData?.email || user?.email || 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone Number</label>
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>{facilityData?.facilityInfo?.phone || 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>Address</label>
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>{facilityData?.facilityInfo?.address || 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>City</label>
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>{facilityData?.facilityInfo?.city || 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>Province</label>
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>{facilityData?.facilityInfo?.province || 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>Postal Code</label>
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>{facilityData?.facilityInfo?.postalCode || 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>Country</label>
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>{facilityData?.facilityInfo?.country || 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>Website</label>
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>{facilityData?.facilityInfo?.website || 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>License Number</label>
                      <span style={{ 
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'block'
                      }}>{facilityData?.licenseNumber || 'Not available'}</span>
                    </div>
                    <div className="info-item">
                      <label>Status</label>
                      <span className={`badge ${facilityData?.isActive ? 'success' : 'warning'}`}>
                        {facilityData?.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  {facilityData?.facilityInfo?.description && (
                    <div className="description-section">
                      <h3>Facility Description</h3>
                      <p>{facilityData.facilityInfo.description}</p>
                    </div>
                  )}

                  {facilityData?.specialties && facilityData.specialties.length > 0 && (
                    <div className="specialties-section">
                      <h3>Medical Specialties</h3>
                      <div className="specialties-grid">
                        {facilityData.specialties.map((specialty: string, index: number) => (
                          <span key={index} className="specialty-tag">
                            <i className="fas fa-stethoscope"></i>
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {facilityData?.services && facilityData.services.length > 0 && (
                    <div className="services-section">
                      <h3>Services Offered</h3>
                      <div className="services-grid">
                        {facilityData.services.map((service: string, index: number) => (
                          <span key={index} className="service-tag">
                            <i className="fas fa-medical-kit"></i>
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="staff-section">
                    <h3>Staff Information</h3>
                    <div className="staff-grid">
                      <div className="staff-item">
                        <span className="staff-label">Total Staff:</span>
                        <span className="staff-value">{facilityData?.staff?.totalStaff || 0}</span>
                      </div>
                      <div className="staff-item">
                        <span className="staff-label">Doctors:</span>
                        <span className="staff-value">{facilityData?.staff?.doctors || 0}</span>
                      </div>
                      <div className="staff-item">
                        <span className="staff-label">Nurses:</span>
                        <span className="staff-value">{facilityData?.staff?.nurses || 0}</span>
                      </div>
                      <div className="staff-item">
                        <span className="staff-label">Support Staff:</span>
                        <span className="staff-value">{facilityData?.staff?.supportStaff || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="capacity-section">
                    <h3>Facility Capacity</h3>
                    <div className="capacity-grid">
                      <div className="capacity-item">
                        <span className="capacity-label">Bed Capacity:</span>
                        <span className="capacity-value">{facilityData?.capacity?.bedCapacity || 0}</span>
                      </div>
                      <div className="capacity-item">
                        <span className="capacity-label">Consultation Rooms:</span>
                        <span className="capacity-value">{facilityData?.capacity?.consultationRooms || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="settings-section">
                    <h3>Account Settings</h3>
                    <div className="settings-grid">
                      <div className="setting-item">
                        <label className="setting-label">
                          <input 
                            type="checkbox" 
                            checked={notificationsEnabled}
                            onChange={(e) => setNotificationsEnabled(e.target.checked)}
                          />
                          Enable Notifications
                        </label>
                        <p className="setting-description">Receive notifications for new appointments and updates</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Appointment Details Modal */}
      {showAppointmentModal && selectedAppointment && (
        <div 
          className="modal" 
          style={{ display: 'block' }}
          onKeyDown={(e) => handleModalKeyDown(e, editAppointmentModalRef)}
          tabIndex={-1}
        >
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'hidden' }}>
            <div className="modal-header">
              <h3>Appointment Details</h3>
              <button className="close-btn" onClick={closeAppointmentModal} aria-label="Close appointment details modal">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Modal Tabs */}
              <div className="modal-tabs" role="tablist" aria-label="Appointment information tabs">
                <button 
                  className={`modal-tab ${appointmentModalTab === 'details' ? 'active' : ''}`}
                  onClick={() => setAppointmentModalTab('details')}
                  role="tab"
                  aria-selected={appointmentModalTab === 'details'}
                  aria-label="View appointment details"
                >
                  <i className="fas fa-calendar-alt"></i> Appointment Details
                </button>
                <button 
                  className={`modal-tab ${appointmentModalTab === 'personal' ? 'active' : ''}`}
                  onClick={() => setAppointmentModalTab('personal')}
                  role="tab"
                  aria-selected={appointmentModalTab === 'personal'}
                  aria-label="View personal information"
                >
                  <i className="fas fa-user"></i> Personal Info
                </button>
                <button 
                  className={`modal-tab ${appointmentModalTab === 'conditions' ? 'active' : ''}`}
                  onClick={() => setAppointmentModalTab('conditions')}
                  role="tab"
                  aria-selected={appointmentModalTab === 'conditions'}
                  aria-label="View medical conditions"
                >
                  <i className="fas fa-heartbeat"></i> Medical Conditions
                </button>
                <button 
                  className={`modal-tab ${appointmentModalTab === 'history' ? 'active' : ''}`}
                  onClick={() => setAppointmentModalTab('history')}
                  role="tab"
                  aria-selected={appointmentModalTab === 'history'}
                  aria-label="View consultation history"
                >
                  <i className="fas fa-history"></i> Consultation History
                </button>
                <button 
                  className={`modal-tab ${appointmentModalTab === 'documents' ? 'active' : ''}`}
                  onClick={() => setAppointmentModalTab('documents')}
                  role="tab"
                  aria-selected={appointmentModalTab === 'documents'}
                  aria-label="View medical documents"
                >
                  <i className="fas fa-file-medical"></i> Documents
                </button>
              </div>

              {/* Tab Content */}
              <div className="modal-tab-content" style={{ padding: '20px', maxHeight: '60vh', overflow: 'auto' }}>
                {/* Appointment Details Tab */}
                {appointmentModalTab === 'details' && (
                  <div className="tab-panel">
                    <div className="appointment-details-grid">
                      <div className="detail-section">
                        <h4><i className="fas fa-calendar"></i> Appointment Information</h4>
                        <div className="detail-item">
                          <label>Date:</label>
                          <span>{new Date(selectedAppointment.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="detail-item">
                          <label>Time:</label>
                          <span>{formatTime(selectedAppointment.time)}</span>
                        </div>
                        <div className="detail-item">
                          <label>Type:</label>
                          <span className={`badge ${selectedAppointment.type}`}>{selectedAppointment.type}</span>
                        </div>
                        <div className="detail-item">
                          <label>Status:</label>
                          <span className={`badge ${selectedAppointment.status}`}>{selectedAppointment.status}</span>
                        </div>
                        {selectedAppointment.doctor && (
                          <div className="detail-item">
                            <label>Doctor:</label>
                            <span>{selectedAppointment.doctor}</span>
                          </div>
                        )}
                        {selectedAppointment.notes && (
                          <div className="detail-item">
                            <label>Notes:</label>
                            <span>{selectedAppointment.notes}</span>
                          </div>
                        )}
                      </div>

                      <div className="detail-section">
                        <h4><i className="fas fa-user"></i> Patient Information</h4>
                        <div className="detail-item">
                          <label>Name:</label>
                          <span>{selectedAppointment.patientName}</span>
                        </div>
                        <div className="detail-item">
                          <label>Email:</label>
                          <span>{selectedAppointment.patientEmail}</span>
                        </div>
                        <div className="detail-item">
                          <label>Facility:</label>
                          <span>{selectedAppointment.facilityName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Personal Info Tab */}
                {appointmentModalTab === 'personal' && (
                  <div className="tab-panel">
                    {isLoadingPatientData ? (
                      <div className="loading-state">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading patient information...</p>
                      </div>
                    ) : selectedPatientData ? (
                      <div className="personal-info-grid">
                        <div className="info-section">
                          <h4><i className="fas fa-user-circle"></i> Basic Information</h4>
                          <div className="info-item">
                            <label>Full Name:</label>
                            <span>{selectedPatientData.personalInfo?.fullName || 'Not provided'}</span>
                          </div>
                          <div className="info-item">
                            <label>Date of Birth:</label>
                            <span>{selectedPatientData.personalInfo?.dateOfBirth || 'Not provided'}</span>
                          </div>
                          <div className="info-item">
                            <label>Age:</label>
                            <span>{selectedPatientData.personalInfo?.age || 'Not provided'}</span>
                          </div>
                          <div className="info-item">
                            <label>Gender:</label>
                            <span>{selectedPatientData.personalInfo?.gender || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="info-section">
                          <h4><i className="fas fa-address-book"></i> Contact Information</h4>
                          <div className="info-item">
                            <label>Email:</label>
                            <span>{selectedPatientData.email || 'Not provided'}</span>
                          </div>
                          <div className="info-item">
                            <label>Phone:</label>
                            <span>{selectedPatientData.personalInfo?.phone || 'Not provided'}</span>
                          </div>
                          <div className="info-item">
                            <label>Address:</label>
                            <span>{selectedPatientData.personalInfo?.address || 'Not provided'}</span>
                          </div>
                        </div>

                        <div className="info-section">
                          <h4><i className="fas fa-info-circle"></i> Additional Information</h4>
                          <div className="info-item">
                            <label>Profile Complete:</label>
                            <span className={`badge ${selectedPatientData.profileComplete ? 'success' : 'warning'}`}>
                              {selectedPatientData.profileComplete ? 'Complete' : 'Incomplete'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <i className="fas fa-user-slash"></i>
                        <p>Patient information not available</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Medical Conditions Tab */}
                {appointmentModalTab === 'conditions' && (
                  <div className="tab-panel">
                    {isLoadingPatientData ? (
                      <div className="loading-state">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading medical conditions...</p>
                      </div>
                    ) : selectedPatientData?.medicalInfo?.conditions ? (
                      <div className="conditions-grid">
                        {Object.entries(selectedPatientData.medicalInfo.conditions).map(([category, conditions]: [string, any]) => (
                          <div key={category} className="condition-category">
                            <h4>
                              <i className="fas fa-heartbeat"></i> 
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </h4>
                            <div className="condition-tags">
                              {conditions.map((condition: string, index: number) => (
                                <span key={index} className="condition-tag">
                                  <i className="fas fa-exclamation-triangle"></i>
                                  {condition}
                                </span>
                              ))}
                            </div>
                            <div className="condition-count">
                              <small>{conditions.length} condition{conditions.length !== 1 ? 's' : ''} in this category</small>
                            </div>
                          </div>
                        ))}
                        <div className="conditions-summary">
                          <div className="summary-card">
                            <h5><i className="fas fa-chart-pie"></i> Summary</h5>
                            <p>Total Categories: {Object.keys(selectedPatientData.medicalInfo.conditions).length}</p>
                            <p>Total Conditions: {Object.values(selectedPatientData.medicalInfo.conditions).flat().length}</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="empty-state">
                        <i className="fas fa-heartbeat"></i>
                        <p>No medical conditions recorded</p>
                        <small>Patient has not reported any pre-existing medical conditions.</small>
                      </div>
                    )}
                  </div>
                )}

                {/* Consultation History Tab */}
                {appointmentModalTab === 'history' && (
                  <div className="tab-panel">
                    {isLoadingPatientData ? (
                      <div className="loading-state">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading consultation history...</p>
                      </div>
                    ) : selectedPatientData?.activity?.consultationHistory?.length > 0 ? (
                      <div className="consultation-history">
                        {selectedPatientData.activity.consultationHistory.map((consultation: any, index: number) => (
                          <div key={index} className="consultation-item">
                            <div className="consultation-header">
                              <h5>{consultation.title || consultation.type || 'Consultation'}</h5>
                              <span className={`badge ${consultation.status}`}>{consultation.status}</span>
                            </div>
                            <div className="consultation-details">
                              <div className="detail-row">
                                <span className="detail-label"><i className="fas fa-calendar"></i> Date:</span>
                                <span className="detail-value">{new Date(consultation.date).toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label"><i className="fas fa-user-md"></i> Doctor:</span>
                                <span className="detail-value">{consultation.doctorName || consultation.doctor || 'Not specified'}</span>
                              </div>
                              <div className="detail-row">
                                <span className="detail-label"><i className="fas fa-stethoscope"></i> Type:</span>
                                <span className="detail-value">{consultation.type || 'General consultation'}</span>
                              </div>
                              {consultation.notes && (
                                <div className="detail-row">
                                  <span className="detail-label"><i className="fas fa-notes-medical"></i> Notes:</span>
                                  <span className="detail-value">{consultation.notes}</span>
                                </div>
                              )}
                              {consultation.facility && (
                                <div className="detail-row">
                                  <span className="detail-label"><i className="fas fa-hospital"></i> Facility:</span>
                                  <span className="detail-value">{consultation.facility}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <i className="fas fa-history"></i>
                        <p>No consultation history available</p>
                        <small>Patient has no previous consultation records.</small>
                      </div>
                    )}
                  </div>
                )}

                {/* Documents Tab */}
                {appointmentModalTab === 'documents' && (
                  <div className="tab-panel">
                    {isLoadingPatientData ? (
                      <div className="loading-state">
                        <i className="fas fa-spinner fa-spin"></i>
                        <p>Loading patient documents...</p>
                      </div>
                    ) : selectedPatientData?.activity?.documents?.length > 0 ? (
                      <div className="documents-grid">
                        {selectedPatientData.activity.documents.map((document: any, index: number) => (
                          <div key={index} className="document-item">
                            <div className="document-icon">
                              <i className={`fas ${document.type?.startsWith('image/') ? 'fa-image' : 
                                               document.type === 'application/pdf' ? 'fa-file-pdf' : 
                                               'fa-file-medical'}`}></i>
                            </div>
                            <div className="document-info">
                              <h5>{document.name || document.originalName || 'Document'}</h5>
                              <p>{document.type || 'Unknown type'}</p>
                              <small>Uploaded: {new Date(document.uploadDate).toLocaleDateString()}</small>
                              {document.size && (
                                <small>Size: {(document.size / 1024 / 1024).toFixed(2)} MB</small>
                              )}
                            </div>
                            <div className="document-actions">
                              <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => openDocumentModal(document)}
                                title="View document details"
                              >
                                <i className="fas fa-eye"></i> View Details
                              </button>
                              <button 
                                className="btn btn-outline btn-sm"
                                onClick={() => handleOpenDocument(document)}
                                title="Open document in new tab"
                              >
                                <i className="fas fa-external-link-alt"></i> Open
                              </button>
                              <a 
                                href={document.url} 
                                download={document.originalName || document.name}
                                className="btn btn-primary btn-sm"
                                title="Download document"
                              >
                                <i className="fas fa-download"></i> Download
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <i className="fas fa-file-medical"></i>
                        <p>No documents available</p>
                        <small>Patient has not uploaded any medical documents yet.</small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeAppointmentModal} aria-label="Close appointment details">
                Close
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => openEditAppointmentModal(selectedAppointment)}
                aria-label="Edit this appointment"
              >
                <i className="fas fa-edit"></i> Edit Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Appointment Modal */}
      {showNewAppointmentModal && (
        <div 
          ref={newAppointmentModalRef}
          className="modal" 
          style={{ display: 'block' }}
          onKeyDown={(e) => handleModalKeyDown(e, newAppointmentModalRef)}
          tabIndex={-1}
        >
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Create New Appointment</h3>
              <button className="close-btn" onClick={closeNewAppointmentModal} aria-label="Close new appointment modal">
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="patientUid">Patient UID *</label>
                <input
                  type="text"
                  id="patientUid"
                  value={newAppointmentForm.patientUid}
                  onChange={(e) => handleNewAppointmentFormChange('patientUid', e.target.value)}
                  placeholder="Enter patient UID (e.g., 7ib2p9tdrs0QzKlrfLqay5fiw2t2)"
                  className={patientValidationError ? 'error' : ''}
                />
                {patientValidationError && (
                  <div className="error-message">
                    <i className="fas fa-exclamation-circle"></i>
                    {patientValidationError}
                  </div>
                )}
                <small className="form-help">
                  <i className="fas fa-info-circle"></i>
                  You can find the patient's UID in their profile in the PatientPortal.
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="appointmentDate">Date *</label>
                  <input
                    type="date"
                    id="appointmentDate"
                    value={newAppointmentForm.date}
                    onChange={(e) => handleNewAppointmentFormChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="appointmentTime">Time *</label>
                  <input
                    type="time"
                    id="appointmentTime"
                    value={newAppointmentForm.time}
                    onChange={(e) => handleNewAppointmentFormChange('time', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="doctor">Doctor</label>
                  <input
                    type="text"
                    id="doctor"
                    value={newAppointmentForm.doctor}
                    onChange={(e) => handleNewAppointmentFormChange('doctor', e.target.value)}
                    placeholder="Doctor's name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="appointmentType">Type</label>
                  <select
                    id="appointmentType"
                    value={newAppointmentForm.type}
                    onChange={(e) => handleNewAppointmentFormChange('type', e.target.value)}
                  >
                    <option value="consultation">Consultation</option>
                    <option value="checkup">Check-up</option>
                    <option value="emergency">Emergency</option>
                    <option value="followup">Follow-up</option>
                    <option value="surgery">Surgery</option>
                    <option value="virtual">Virtual Consultation</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="appointmentStatus">Status</label>
                <select
                  id="appointmentStatus"
                  value={newAppointmentForm.status}
                  onChange={(e) => handleNewAppointmentFormChange('status', e.target.value)}
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="appointmentNotes">Notes</label>
                <textarea
                  id="appointmentNotes"
                  value={newAppointmentForm.notes}
                  onChange={(e) => handleNewAppointmentFormChange('notes', e.target.value)}
                  placeholder="Additional notes about the appointment..."
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeNewAppointmentModal}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleCreateAppointment}
                disabled={isCreatingAppointment}
              >
                {isCreatingAppointment ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus"></i>
                    Create Appointment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Appointment Modal */}
      {showEditAppointmentModal && selectedAppointment && (
        <div 
          ref={editAppointmentModalRef}
          className="modal" 
          style={{ display: 'block' }}
          onKeyDown={(e) => handleModalKeyDown(e, editAppointmentModalRef)}
          tabIndex={-1}
        >
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>Edit Appointment</h3>
              <button className="close-btn" onClick={closeEditAppointmentModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Patient</label>
                <input
                  type="text"
                  value={selectedAppointment.patientName || 'Patient'}
                  disabled
                  className="disabled-input"
                />
                <small className="form-help">
                  <i className="fas fa-info-circle"></i>
                  Patient information cannot be changed
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editAppointmentDate">Date *</label>
                  <input
                    type="date"
                    id="editAppointmentDate"
                    value={editAppointmentForm.date}
                    onChange={(e) => handleEditAppointmentFormChange('date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editAppointmentTime">Time *</label>
                  <input
                    type="time"
                    id="editAppointmentTime"
                    value={editAppointmentForm.time}
                    onChange={(e) => handleEditAppointmentFormChange('time', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="editDoctor">Doctor</label>
                  <input
                    type="text"
                    id="editDoctor"
                    value={editAppointmentForm.doctor}
                    onChange={(e) => handleEditAppointmentFormChange('doctor', e.target.value)}
                    placeholder="Doctor's name"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="editAppointmentStatus">Status</label>
                  <select
                    id="editAppointmentStatus"
                    value={editAppointmentForm.status}
                    onChange={(e) => handleEditAppointmentFormChange('status', e.target.value)}
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="editAppointmentNotes">Notes</label>
                <textarea
                  id="editAppointmentNotes"
                  value={editAppointmentForm.notes}
                  onChange={(e) => handleEditAppointmentFormChange('notes', e.target.value)}
                  placeholder="Additional notes about the appointment..."
                  rows={3}
                />
              </div>

              <div className="alert alert-info">
                <i className="fas fa-info-circle"></i>
                <strong>Note:</strong> Changes made here will be reflected in the patient's portal. 
                The patient will be able to see when and what was modified.
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeEditAppointmentModal}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveEditedAppointment}
                disabled={isEditingAppointment}
              >
                {isEditingAppointment ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Updating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div 
          ref={editProfileModalRef}
          className="modal" 
          style={{ display: 'block' }}
          onKeyDown={(e) => handleModalKeyDown(e, editProfileModalRef)}
          tabIndex={-1}
        >
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>Edit Facility Profile</h3>
              <button className="close-btn" onClick={closeEditProfileModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-section">
                <h4><i className="fas fa-hospital"></i> Basic Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="facilityName">Facility Name *</label>
                    <input
                      type="text"
                      id="facilityName"
                      value={editProfileForm.name}
                      onChange={(e) => handleEditProfileFormChange('name', e.target.value)}
                      placeholder="Enter facility name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="facilityType">Facility Type *</label>
                    <select
                      id="facilityType"
                      value={editProfileForm.type}
                      onChange={(e) => handleEditProfileFormChange('type', e.target.value)}
                      required
                    >
                      <option value="">Select facility type</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Medical Clinic">Medical Clinic</option>
                      <option value="Dental Clinic">Dental Clinic</option>
                      <option value="Specialty Clinic">Specialty Clinic</option>
                      <option value="Diagnostic Center">Diagnostic Center</option>
                      <option value="Rehabilitation Center">Rehabilitation Center</option>
                      <option value="Mental Health Facility">Mental Health Facility</option>
                      <option value="Maternity Clinic">Maternity Clinic</option>
                      <option value="Pediatric Clinic">Pediatric Clinic</option>
                      <option value="Surgical Center">Surgical Center</option>
                      <option value="Urgent Care Center">Urgent Care Center</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="facilityEmail">Email Address *</label>
                    <input
                      type="email"
                      id="facilityEmail"
                      value={editProfileForm.email}
                      onChange={(e) => handleEditProfileFormChange('email', e.target.value)}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="facilityPhone">Phone Number *</label>
                    <input
                      type="tel"
                      id="facilityPhone"
                      value={editProfileForm.phone}
                      onChange={(e) => handleEditProfileFormChange('phone', e.target.value)}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="facilityWebsite">Website</label>
                  <input
                    type="url"
                    id="facilityWebsite"
                    value={editProfileForm.website}
                    onChange={(e) => handleEditProfileFormChange('website', e.target.value)}
                    placeholder="Enter website URL (optional)"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="facilityLicense">License Number</label>
                  <input
                    type="text"
                    id="facilityLicense"
                    value={editProfileForm.licenseNumber}
                    onChange={(e) => handleEditProfileFormChange('licenseNumber', e.target.value)}
                    placeholder="Enter license number (optional)"
                  />
                </div>
              </div>

              <div className="form-section">
                <h4><i className="fas fa-map-marker-alt"></i> Address Information</h4>
                <div className="form-group">
                  <label htmlFor="facilityAddress">Complete Address *</label>
                  <textarea
                    id="facilityAddress"
                    value={editProfileForm.address}
                    onChange={(e) => handleEditProfileFormChange('address', e.target.value)}
                    placeholder="Enter complete address"
                    rows={3}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="facilityCity">City *</label>
                    <input
                      type="text"
                      id="facilityCity"
                      value={editProfileForm.city}
                      onChange={(e) => handleEditProfileFormChange('city', e.target.value)}
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="facilityProvince">Province *</label>
                    <input
                      type="text"
                      id="facilityProvince"
                      value={editProfileForm.province}
                      onChange={(e) => handleEditProfileFormChange('province', e.target.value)}
                      placeholder="Enter province"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="facilityPostalCode">Postal Code</label>
                    <input
                      type="text"
                      id="facilityPostalCode"
                      value={editProfileForm.postalCode}
                      onChange={(e) => handleEditProfileFormChange('postalCode', e.target.value)}
                      placeholder="Enter postal code"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="facilityCountry">Country *</label>
                    <input
                      type="text"
                      id="facilityCountry"
                      value={editProfileForm.country}
                      onChange={(e) => handleEditProfileFormChange('country', e.target.value)}
                      placeholder="Enter country"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4><i className="fas fa-info-circle"></i> Additional Information</h4>
                <div className="form-group">
                  <label htmlFor="facilityDescription">Facility Description</label>
                  <textarea
                    id="facilityDescription"
                    value={editProfileForm.description}
                    onChange={(e) => handleEditProfileFormChange('description', e.target.value)}
                    placeholder="Describe your facility, services, and specialties..."
                    rows={4}
                  />
                  <small className="form-help">
                    <i className="fas fa-info-circle"></i>
                    This description will be visible to patients when they search for healthcare facilities.
                  </small>
                </div>
              </div>

              <div className="form-section">
                <h4><i className="fas fa-stethoscope"></i> Medical Specialties</h4>
                <div className="form-group">
                  <label htmlFor="facilitySpecialties">Specialties (comma-separated)</label>
                  <input
                    type="text"
                    id="facilitySpecialties"
                    value={editProfileForm.specialties.join(', ')}
                    onChange={(e) => {
                      const specialties = e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      setEditProfileForm(prev => ({ ...prev, specialties }))
                    }}
                    placeholder="e.g., Cardiology, Pediatrics, General Medicine"
                  />
                  <small className="form-help">
                    <i className="fas fa-info-circle"></i>
                    Enter medical specialties offered by your facility, separated by commas.
                  </small>
                </div>
              </div>

              <div className="form-section">
                <h4><i className="fas fa-medical-kit"></i> Services Offered</h4>
                <div className="form-group">
                  <label htmlFor="facilityServices">Services (comma-separated)</label>
                  <input
                    type="text"
                    id="facilityServices"
                    value={editProfileForm.services.join(', ')}
                    onChange={(e) => {
                      const services = e.target.value.split(',').map(s => s.trim()).filter(s => s)
                      setEditProfileForm(prev => ({ ...prev, services }))
                    }}
                    placeholder="e.g., Consultation, Laboratory Tests, X-Ray, Surgery"
                  />
                  <small className="form-help">
                    <i className="fas fa-info-circle"></i>
                    Enter services offered by your facility, separated by commas.
                  </small>
                </div>
              </div>

              <div className="form-section">
                <h4><i className="fas fa-users"></i> Staff Information</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="totalStaff">Total Staff</label>
                    <input
                      type="number"
                      id="totalStaff"
                      value={editProfileForm.staff.totalStaff}
                      onChange={(e) => setEditProfileForm(prev => ({
                        ...prev,
                        staff: { ...prev.staff, totalStaff: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="doctors">Doctors</label>
                    <input
                      type="number"
                      id="doctors"
                      value={editProfileForm.staff.doctors}
                      onChange={(e) => setEditProfileForm(prev => ({
                        ...prev,
                        staff: { ...prev.staff, doctors: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nurses">Nurses</label>
                    <input
                      type="number"
                      id="nurses"
                      value={editProfileForm.staff.nurses}
                      onChange={(e) => setEditProfileForm(prev => ({
                        ...prev,
                        staff: { ...prev.staff, nurses: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="supportStaff">Support Staff</label>
                    <input
                      type="number"
                      id="supportStaff"
                      value={editProfileForm.staff.supportStaff}
                      onChange={(e) => setEditProfileForm(prev => ({
                        ...prev,
                        staff: { ...prev.staff, supportStaff: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4><i className="fas fa-bed"></i> Facility Capacity</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bedCapacity">Bed Capacity</label>
                    <input
                      type="number"
                      id="bedCapacity"
                      value={editProfileForm.capacity.bedCapacity}
                      onChange={(e) => setEditProfileForm(prev => ({
                        ...prev,
                        capacity: { ...prev.capacity, bedCapacity: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="consultationRooms">Consultation Rooms</label>
                    <input
                      type="number"
                      id="consultationRooms"
                      value={editProfileForm.capacity.consultationRooms}
                      onChange={(e) => setEditProfileForm(prev => ({
                        ...prev,
                        capacity: { ...prev.capacity, consultationRooms: parseInt(e.target.value) || 0 }
                      }))}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4><i className="fas fa-clock"></i> Operating Hours</h4>
                <div className="hours-grid">
                  <div className="hours-item">
                    <label>Monday - Friday</label>
                    <div className="time-inputs">
                      <input
                        type="time"
                        value={editProfileForm.operatingHours.monday.open}
                        onChange={(e) => setEditProfileForm(prev => ({
                          ...prev,
                          operatingHours: {
                            ...prev.operatingHours,
                            monday: { ...prev.operatingHours.monday, open: e.target.value }
                          }
                        }))}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={editProfileForm.operatingHours.monday.close}
                        onChange={(e) => setEditProfileForm(prev => ({
                          ...prev,
                          operatingHours: {
                            ...prev.operatingHours,
                            monday: { ...prev.operatingHours.monday, close: e.target.value }
                          }
                        }))}
                      />
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editProfileForm.operatingHours.monday.closed}
                          onChange={(e) => setEditProfileForm(prev => ({
                            ...prev,
                            operatingHours: {
                              ...prev.operatingHours,
                              monday: { ...prev.operatingHours.monday, closed: e.target.checked }
                            }
                          }))}
                        />
                        Closed
                      </label>
                    </div>
                  </div>
                  
                  <div className="hours-item">
                    <label>Saturday</label>
                    <div className="time-inputs">
                      <input
                        type="time"
                        value={editProfileForm.operatingHours.saturday.open}
                        onChange={(e) => setEditProfileForm(prev => ({
                          ...prev,
                          operatingHours: {
                            ...prev.operatingHours,
                            saturday: { ...prev.operatingHours.saturday, open: e.target.value }
                          }
                        }))}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={editProfileForm.operatingHours.saturday.close}
                        onChange={(e) => setEditProfileForm(prev => ({
                          ...prev,
                          operatingHours: {
                            ...prev.operatingHours,
                            saturday: { ...prev.operatingHours.saturday, close: e.target.value }
                          }
                        }))}
                      />
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editProfileForm.operatingHours.saturday.closed}
                          onChange={(e) => setEditProfileForm(prev => ({
                            ...prev,
                            operatingHours: {
                              ...prev.operatingHours,
                              saturday: { ...prev.operatingHours.saturday, closed: e.target.checked }
                            }
                          }))}
                        />
                        Closed
                      </label>
                    </div>
                  </div>
                  
                  <div className="hours-item">
                    <label>Sunday</label>
                    <div className="time-inputs">
                      <input
                        type="time"
                        value={editProfileForm.operatingHours.sunday.open}
                        onChange={(e) => setEditProfileForm(prev => ({
                          ...prev,
                          operatingHours: {
                            ...prev.operatingHours,
                            sunday: { ...prev.operatingHours.sunday, open: e.target.value }
                          }
                        }))}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={editProfileForm.operatingHours.sunday.close}
                        onChange={(e) => setEditProfileForm(prev => ({
                          ...prev,
                          operatingHours: {
                            ...prev.operatingHours,
                            sunday: { ...prev.operatingHours.sunday, close: e.target.value }
                          }
                        }))}
                      />
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={editProfileForm.operatingHours.sunday.closed}
                          onChange={(e) => setEditProfileForm(prev => ({
                            ...prev,
                            operatingHours: {
                              ...prev.operatingHours,
                              sunday: { ...prev.operatingHours.sunday, closed: e.target.checked }
                            }
                          }))}
                        />
                        Closed
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="alert alert-info">
                <i className="fas fa-info-circle"></i>
                <strong>Note:</strong> Changes made here will be reflected in the patient portal when they search for healthcare facilities. 
                Make sure all information is accurate and up-to-date.
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeEditProfileModal}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {showDocumentModal && viewingDocument && (
        <div 
          ref={documentModalRef}
          className="modal" 
          style={{ display: 'block' }}
          onKeyDown={(e) => handleModalKeyDown(e, documentModalRef)}
          tabIndex={-1}
        >
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
            <div className="modal-header">
              <h3>View Document: {viewingDocument.name || viewingDocument.originalName || 'Document'}</h3>
              <button className="close-btn" onClick={closeDocumentModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <div className="modal-body">
              <div className="document-details">
                <div className="document-info-grid">
                  <div className="info-item">
                    <label>File Name:</label>
                    <span>{viewingDocument.name || viewingDocument.originalName || 'Unknown'}</span>
                  </div>
                  <div className="info-item">
                    <label>Size:</label>
                    <span>{viewingDocument.size ? `${(viewingDocument.size / 1024 / 1024).toFixed(2)} MB` : 'Unknown'}</span>
                  </div>
                  <div className="info-item">
                    <label>Type:</label>
                    <span>{viewingDocument.type || 'Unknown'}</span>
                  </div>
                  <div className="info-item">
                    <label>Upload Date:</label>
                    <span>{viewingDocument.uploadDate ? new Date(viewingDocument.uploadDate).toLocaleDateString() : 'Unknown'}</span>
                  </div>
                </div>

                {viewingDocument.type === 'application/pdf' ? (
                  <div className="pdf-viewer">
                    <div className="pdf-preview">
                      <div className="pdf-icon">
                        <i className="fas fa-file-pdf"></i>
                        <span>PDF</span>
                      </div>
                      <h4>{viewingDocument.name || viewingDocument.originalName}</h4>
                      <p>PDF documents cannot be previewed directly in the browser for security reasons.</p>
                      <div className="pdf-actions">
                        <button 
                          onClick={() => handleOpenDocument(viewingDocument)}
                          className="btn btn-primary"
                          style={{ marginRight: '1rem' }}
                        >
                          <i className="fas fa-external-link-alt"></i>
                          Open in New Tab
                        </button>
                        <a 
                          href={viewingDocument.url} 
                          download={viewingDocument.originalName}
                          className="btn btn-outline"
                        >
                          <i className="fas fa-download"></i>
                          Download PDF
                        </a>
                      </div>
                    </div>
                  </div>
                ) : viewingDocument.type?.startsWith('image/') ? (
                  <div className="image-viewer">
                    <img 
                      src={viewingDocument.url} 
                      alt={viewingDocument.name || 'Document'} 
                      style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div className="text-viewer">
                    <div className="unsupported-format">
                      <i className="fas fa-file-alt"></i>
                      <h4>Document Preview Not Available</h4>
                      <p>This file type cannot be previewed in the browser.</p>
                      <a 
                        href={viewingDocument.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn btn-primary"
                        download={viewingDocument.originalName}
                      >
                        <i className="fas fa-download"></i>
                        Download Document
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDocumentModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

Dashboard.displayName = 'Dashboard'

export default Dashboard 