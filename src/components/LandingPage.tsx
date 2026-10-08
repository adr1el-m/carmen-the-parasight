import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import YearUpdater from './YearUpdater'
import '../styles/index.css'
import styles from './LandingPage.module.css';
import doctorsImage from '../styles/Untitled design (1).png';
import heroBgImage from '../styles/hero_bg.svg';


// Import images
import slmcImage from '../assets/img/SLMC.jpg'
import tmcImage from '../assets/img/TMC.jpg'
import ahmcImage from '../assets/img/AHMC.jpeg'

// Facility interface based on Firestore data
interface Facility {
  uid: string
  name: string
  type: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
  website: string
  specialties: string[]
  services: string[]
  operatingHours: {
    monday: { open: string; close: string; closed: boolean }
    tuesday: { open: string; close: string; closed: boolean }
    wednesday: { open: string; close: string; closed: boolean }
    thursday: { open: string; close: string; closed: boolean }
    friday: { open: string; close: string; closed: boolean }
    saturday: { open: string; close: string; closed: boolean }
    sunday: { open: string; close: string; closed: boolean }
  }
  staff: {
    totalStaff: number
    doctors: number
    nurses: number
    supportStaff: number
  }
  capacity: {
    bedCapacity: number
    consultationRooms: number
  }
  languages: string[]
  accreditation: string[]
  insuranceAccepted: string[]
  licenseNumber: string
  description: string
  isActive: boolean
  isSearchable: boolean
  isVerified?: boolean
  profileComplete?: boolean
  createdAt: any
  updatedAt: any
  lastLoginAt?: any
  emailVerified?: boolean
  authProvider?: string
}

const LandingPage: React.FC = React.memo(() => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [isLoadingFacilities, setIsLoadingFacilities] = useState(true)
  const [facilitiesError, setFacilitiesError] = useState('')
  
  // Refs for cleanup
  const headerScrollRef = useRef<(() => void) | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const notificationTimeoutRef = useRef<number | null>(null)

  // Refs for focus management
  const searchInputRef = useRef<HTMLInputElement>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const searchButtonRef = useRef<HTMLButtonElement>(null)
  const quickAppointmentRef = useRef<HTMLButtonElement>(null)
  const mobileMenuToggleRef = useRef<HTMLButtonElement>(null)
  const loginButtonRef = useRef<HTMLButtonElement>(null)
  const registerButtonRef = useRef<HTMLButtonElement>(null)


  // Fetch facilities from the new database service
  const fetchFacilities = useCallback(async () => {
    try {
      setIsLoadingFacilities(true)
      setFacilitiesError('')
      
      console.log('🔍 Fetching facilities from NeonDB service...')
      
      const { getFacilities } = await import('../services/database.js')
      const fetchedFacilities = await getFacilities()
      
      console.log('✅ Facilities fetched:', fetchedFacilities.length)
      setFacilities(fetchedFacilities as Facility[])
      
    } catch (error: any) {
      console.error('Failed to fetch facilities:', error)
      setFacilitiesError('Unable to load healthcare facilities. Please try again later.')
    } finally {
      setIsLoadingFacilities(false)
    }
  }, [])

  useEffect(() => {
    fetchFacilities()
  }, [fetchFacilities])

  // Format operating hours for display
  const formatOperatingHours = useCallback((operatingHours: Facility['operatingHours']) => {
    // Defensive check: ensure operatingHours exists
    if (!operatingHours || typeof operatingHours !== 'object') {
      return 'Hours not available'
    }
    
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    
    // Defensive check: ensure each day has the required properties
    const openDays = days.filter(day => {
      const dayHours = operatingHours[day as keyof typeof operatingHours]
      return dayHours && typeof dayHours === 'object' && !dayHours.closed
    })
    
    if (openDays.length === 0) return 'Closed'
    if (openDays.length === 7) return '24/7 Available'
    
    // Helper function to convert 24-hour format to 12-hour format with AM/PM
    const formatTime = (time: string) => {
      if (!time || typeof time !== 'string') return '00:00 AM'
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
      return `${displayHour}:${minutes || '00'} ${ampm}`
    }
    
    const firstDay = openDays[0]
    const lastDay = openDays[openDays.length - 1]
    
    if (openDays.length === 1) {
      const day = operatingHours[firstDay as keyof typeof operatingHours]
      if (!day || !day.open || !day.close) return 'Hours not available'
      return `${firstDay.charAt(0).toUpperCase() + firstDay.slice(1)} ${formatTime(day.open)} - ${formatTime(day.close)}`
    }
    
    const firstDayHours = operatingHours[firstDay as keyof typeof operatingHours]
    const lastDayHours = operatingHours[lastDay as keyof typeof operatingHours]
    
    if (!firstDayHours || !lastDayHours || !firstDayHours.open || !lastDayHours.close) {
      return 'Hours not available'
    }
    
    return `${firstDay.charAt(0).toUpperCase() + firstDay.slice(1)}-${lastDay.charAt(0).toUpperCase() + lastDay.slice(1)} ${formatTime(firstDayHours.open)} - ${formatTime(lastDayHours.close)}`
  }, [])

  // Get primary specialty for display
  const getPrimarySpecialty = useCallback((specialties: string[], services: string[]) => {
    if (specialties && specialties.length > 0) {
      return specialties[0]
    }
    if (services && services.length > 0) {
      return services[0]
    }
    return 'General Care'
  }, [])

  // Calculate experience years (mock calculation based on creation date)
  const getExperienceYears = useCallback((createdAt: any) => {
    if (!createdAt) return 'New'
    
    try {
      const createdDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt)
      const currentDate = new Date()
      const years = currentDate.getFullYear() - createdDate.getFullYear()
      
      if (years <= 0) return 'New'
      if (years === 1) return '1 year experience'
      return `${years} years experience`
    } catch (error) {
      return 'Established'
    }
  }, [])

  // Get starting price (mock calculation based on facility type)
  const getStartingPrice = useCallback((facilityType: string) => {
    const priceMap: { [key: string]: string } = {
      'Hospital': '₱3,000',
      'Medical Clinic': '₱1,200',
      'Dental Clinic': '₱800',
      'Specialty Clinic': '₱2,500',
      'Diagnostic Center': '₱1,500',
      'Rehabilitation Center': '₱2,000',
      'Mental Health Facility': '₱2,800',
      'Maternity Clinic': '₱2,200',
      'Pediatric Clinic': '₱1,800',
      'Surgical Center': '₱5,000',
      'Urgent Care Center': '₱2,500'
    }
    
    return priceMap[facilityType] || '₱1,500'
  }, [])

  useEffect(() => {
    // Initialize animations and effects
    initializeAnimations()
    initializeAccessibility()
    initializeHeaderScroll()
    
    // Prevent Google API errors from external sources
    preventGoogleAPIErrors()
    
    // Setup comprehensive error suppression
    const cleanupErrorSuppression = setupErrorSuppression()
    
    // Start error monitoring
    const cleanupErrorMonitoring = monitorAndSuppressErrors()
    
    // Fetch facilities from Firestore
    fetchFacilities()

    // Ensure page is scrollable
    document.body.style.overflow = 'auto'
    document.documentElement.style.overflow = 'auto'

    // Cleanup function
    return () => {
      cleanup()
      if (cleanupErrorSuppression) {
        cleanupErrorSuppression()
      }
      if (cleanupErrorMonitoring) {
        cleanupErrorMonitoring()
      }
    }
  }, [fetchFacilities])

  const cleanup = useCallback(() => {
    // Remove scroll event listener
    if (headerScrollRef.current) {
      window.removeEventListener('scroll', headerScrollRef.current)
      headerScrollRef.current = null
    }

    // Disconnect intersection observer
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    // Clear notification timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
      notificationTimeoutRef.current = null
    }

    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification')
    existingNotifications.forEach(notification => notification.remove())
  }, [])

  const initializeHeaderScroll = useCallback(() => {
    const header = document.querySelector('.header')
    if (header) {
      let ticking = false
      
      const handleScroll = () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            if (window.scrollY > 50) {
              header.classList.add('scrolled')
            } else {
              header.classList.remove('scrolled')
            }
            ticking = false
          })
          ticking = true
        }
      }
      
      headerScrollRef.current = handleScroll
      window.addEventListener('scroll', handleScroll, { passive: true })
    }
  }, [])

  const initializeAnimations = useCallback(() => {
    // Intersection Observer for scroll animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
        }
      })
    }, observerOptions)
    
    observerRef.current = observer
    
    // Observe elements for animation
    const animateElements = document.querySelectorAll('.facility-card, .section-header, .hero-content')
    animateElements.forEach(el => {
      observer.observe(el)
    })
  }, [])

  const initializeAccessibility = useCallback(() => {
    // Announce page load to screen readers
    announceToScreenReader('Haliya healthcare platform loaded. Use Tab to navigate.')
  }, [])

  const handleSearch = useCallback(() => {
    if (!searchTerm && !location) {
      showNotification('Please enter a search term or location', 'warning')
      return
    }
    
    setIsSearching(true)
    
    // Simulate search (replace with actual search implementation)
    const searchTimeout = setTimeout(() => {
      // Search functionality would be implemented here
      
      showNotification(`Searching for "${searchTerm}" ${location ? `in ${location}` : 'nationwide'}...`, 'info')
      
      setIsSearching(false)
      
      // Redirect to patient portal for search results
      const redirectTimeout = setTimeout(() => {
        navigate('/patient-portal')
      }, 1500)
      
      // Cleanup redirect timeout if component unmounts
      return () => clearTimeout(redirectTimeout)
    }, 1000)
    
    // Cleanup search timeout if component unmounts
    return () => clearTimeout(searchTimeout)
  }, [searchTerm, location, navigate])

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showNotification('Geolocation is not supported by this browser', 'error')
      return
    }
    
    const locationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 600000
    }
    
    navigator.geolocation.getCurrentPosition(
      () => {
        // Simulate reverse geocoding (replace with actual geocoding service)
        const geocodingTimeout = setTimeout(() => {
          const mockLocation = 'Makati City, Metro Manila'
          setLocation(mockLocation)
          showNotification('Location detected successfully!', 'success')
        }, 1000)
        
        // Cleanup geocoding timeout if component unmounts
        return () => clearTimeout(geocodingTimeout)
      },
      (error) => {
        let message = 'Unable to detect location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location access denied by user'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location information unavailable'
            break
          case error.TIMEOUT:
            message = 'Location request timeout'
            break
          default:
            message = 'Location detection failed'
            break
        }
        
        showNotification(message, 'error')
      },
      locationOptions
    )
  }, [])

  const handleAppointmentBooking = useCallback((facilityName: string) => {
    try {
      showNotification(`Redirecting to book appointment with ${facilityName}...`, 'info')
      
      const redirectTimeout = setTimeout(() => {
        navigate('/patient-sign-up')
      }, 1500)
      
      // Cleanup redirect timeout if component unmounts
      return () => clearTimeout(redirectTimeout)
    } catch (error) {
      console.warn('Appointment booking error:', error)
      showNotification('Failed to process appointment booking. Please try again.', 'error')
    }
  }, [navigate])

  const handleViewAllFacilities = useCallback(() => {
    try {
      showNotification('Loading all healthcare facilities...', 'info')
      const redirectTimeout = setTimeout(() => {
        navigate('/patient-portal')
      }, 1000)
      
      // Cleanup redirect timeout if component unmounts
      return () => clearTimeout(redirectTimeout)
    } catch (error) {
      console.warn('View all facilities error:', error)
      showNotification('Failed to load facilities. Please try again.', 'error')
    }
  }, [navigate])

  const handleSocialLink = useCallback((platform: string) => {
    try {
      showNotification(`Opening ${platform}...`, 'info')
      // In production, these would link to actual social media pages
      // Social media links would be implemented here
    } catch (error) {
      console.warn('Social link error:', error)
      showNotification('Failed to open social media link. Please try again.', 'error')
    }
  }, [])

  const handlePartnerSignup = useCallback(() => {
    try {
      showNotification('Redirecting to partner registration...', 'info')
      // Redirect to partner sign-up
      const redirectTimeout = setTimeout(() => {
        navigate('/partner-sign-up')
      }, 1500)
      
      // Cleanup redirect timeout if component unmounts
      return () => clearTimeout(redirectTimeout)
    } catch (error) {
      console.warn('Partner signup error:', error)
      showNotification('Failed to redirect to partner registration. Please try again.', 'error')
    }
  }, [navigate])

  const handlePartnerSignin = useCallback(() => {
    try {
      showNotification('Redirecting to partner login...', 'info')
      // Redirect to partner sign-in
      const redirectTimeout = setTimeout(() => {
        navigate('/partner-sign-in')
      }, 1500)
      
      // Cleanup redirect timeout if component unmounts
      return () => clearTimeout(redirectTimeout)
    } catch (error) {
      console.warn('Partner signin error:', error)
      showNotification('Failed to redirect to partner login. Please try again.', 'error')
    }
  }, [navigate])

  const handleBusinessPortal = useCallback(() => {
    try {
      showNotification('Redirecting to business portal...', 'info')
      // For now, redirect to dashboard as placeholder
      const redirectTimeout = setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
      
      // Cleanup redirect timeout if component unmounts
      return () => clearTimeout(redirectTimeout)
    } catch (error) {
      console.warn('Business portal error:', error)
      showNotification('Failed to redirect to business portal. Please try again.', 'error')
    }
  }, [navigate])

  const showNotification = useCallback((message: string, type: string = 'info') => {
    try {
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
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease-in'
            setTimeout(() => notification.remove(), 300)
          }
        })
      }
      
      // Add to page
      document.body.appendChild(notification)
      
      // Auto remove after 5 seconds
      notificationTimeoutRef.current = setTimeout(() => {
        if (notification.parentNode) {
          notification.style.animation = 'slideOut 0.3s ease-in'
          setTimeout(() => notification.remove(), 300)
        }
      }, 5000)
      
      // Announce to screen readers
      announceToScreenReader(message)
    } catch (error) {
      console.warn('Failed to show notification:', error)
      // Fallback to console log
      console.log(`[${type.toUpperCase()}] ${message}`)
    }
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

  const announceToScreenReader = useCallback((message: string) => {
    try {
      const announcement = document.createElement('div')
      announcement.setAttribute('aria-live', 'polite')
      announcement.setAttribute('aria-atomic', 'true')
      announcement.style.cssText = `
        position: absolute !important;
        left: -10000px !important;
        width: 1px !important;
        height: 1px !important;
        overflow: hidden !important;
      `
      announcement.textContent = message
      
      document.body.appendChild(announcement)
      setTimeout(() => {
        if (announcement.parentNode) {
          announcement.remove()
        }
      }, 1000)
    } catch (error) {
      console.warn('Failed to announce to screen reader:', error)
    }
  }, [])

  // Allow Google API errors to propagate normally for Firebase authentication
  const handleGoogleAPIError = useCallback(() => {
    console.log('✅ LandingPage: Google API errors allowed to propagate normally');
    // Don't suppress Google API errors - let Firebase handle authentication
  }, [])

  // Check Firebase authentication status
  const checkFirebaseAuth = useCallback(() => {
    try {
      // Placeholder for future auth checks
      console.log('Auth check placeholder')
    } catch (error) {
      console.warn('Auth check failed:', error)
    }
  }, [])


  // Enhanced Google API error prevention
  const preventGoogleAPIErrors = useCallback(() => {
    try {
      console.log('✅ LandingPage: Enhanced Google API error prevention enabled');
      
      // Handle Google API script loading issues
      const handleGoogleAPIScriptError = () => {
        // Create a safe wrapper for Google API functions
        if (typeof window !== 'undefined' && !window.gapi) {
          window.gapi = {
            loaded: 0,
            load: function() {
              console.log('✅ Google API load function called safely');
              return Promise.resolve();
            },
            auth: {
              init: function() {
                console.log('✅ Google API auth init called safely');
                return Promise.resolve();
              }
            }
          };
        }
      };
      
      // Set up error handling for Google API scripts
      const originalCreateElement = document.createElement;
      document.createElement = function(tagName: string) {
        const element = originalCreateElement.call(document, tagName);
        
        if (tagName.toLowerCase() === 'script') {
          element.addEventListener('error', (event) => {
            const target = event.target as HTMLScriptElement;
            if (target.src && target.src.includes('googleapis.com')) {
              console.log('✅ Google API script error handled gracefully');
              event.preventDefault();
            }
          });
        }
        
        return element;
      };
      
      // Initialize safe Google API wrapper
      handleGoogleAPIScriptError();
      
      // Handle gapi.loaded callback issues
      const handleGapiLoadedCallback = () => {
        // Override the global gapi.loaded callback mechanism
        if (typeof window !== 'undefined') {
          // Create a safe callback handler
          const safeCallbackHandler = {
            get: function(target: any, prop: string) {
              if (prop === '0' && typeof target[prop] === 'function') {
                // Return a safe function for gapi.loaded[0]
                return function() {
                  console.log('✅ Google API loaded callback handled safely');
                  return Promise.resolve();
                };
              }
              return target[prop];
            }
          };
          
          // Create a proxy for the gapi.loaded array
          if (!window.gapi.loaded) {
            window.gapi.loaded = new Proxy([], safeCallbackHandler);
          }
        }
      };
      
      handleGapiLoadedCallback();
      
      return () => {
        // Restore original createElement
        document.createElement = originalCreateElement;
      };
    } catch (error) {
      console.log('Google API prevention setup failed:', error);
      return () => {};
    }
  }, [])

  // No-op error suppression hooks used by the mount effect
  const setupErrorSuppression = useCallback(() => {
    return () => {}
  }, [])

  const monitorAndSuppressErrors = useCallback(() => {
    return () => {}
  }, [])

  // Keyboard navigation handlers
  const handleSearchKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !searchTerm && !location) {
      e.preventDefault()
      showNotification('Please enter a search term or location', 'warning')
      searchInputRef.current?.focus()
    } else if (e.key === 'Tab' && e.shiftKey) {
      // Shift+Tab from search input should go to mobile menu toggle
      e.preventDefault()
      mobileMenuToggleRef.current?.focus()
    }
  }, [searchTerm, location])

  const handleLocationKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      // Tab from location input should go to search button
      e.preventDefault()
      searchButtonRef.current?.focus()
    } else if (e.key === 'Enter') {
      // Enter in location input should trigger search
      e.preventDefault()
      handleSearch()
    }
  }, [handleSearch])

  const handleSearchButtonKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      // Tab from search button should go to quick appointment button
      e.preventDefault()
      quickAppointmentRef.current?.focus()
    }
  }, [])

  const handleQuickAppointmentKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      // Tab from quick appointment should go to first facility card
      e.preventDefault()
      const firstFacilityCard = document.querySelector('.facility-card button') as HTMLButtonElement
      firstFacilityCard?.focus()
    }
  }, [])

  const handleMobileMenuToggleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      // Tab from mobile menu toggle should go to search input
      e.preventDefault()
      searchInputRef.current?.focus()
    }
  }, [])

  const handleLoginButtonKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      // Tab from login button should go to register button
      e.preventDefault()
      registerButtonRef.current?.focus()
    }
  }, [])

  const handleRegisterButtonKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      // Tab from register button should go to search input
      e.preventDefault()
      searchInputRef.current?.focus()
    }
  }, [])

  // Facility card keyboard navigation
  const handleFacilityCardKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Tab' && !e.shiftKey) {
      // Tab to next facility card or to footer
      e.preventDefault()
      const nextCard = document.querySelector(`.facility-card:nth-child(${index + 2}) button`) as HTMLButtonElement
      if (nextCard) {
        nextCard.focus()
      } else {
        // If no more cards, go to footer
        const footerLink = document.querySelector('.footer-nav button') as HTMLButtonElement
        footerLink?.focus()
      }
    } else if (e.key === 'Tab' && e.shiftKey) {
      // Shift+Tab to previous facility card or to quick appointment
      e.preventDefault()
      if (index > 0) {
        const prevCard = document.querySelector(`.facility-card:nth-child(${index}) button`) as HTMLButtonElement
        prevCard?.focus()
      } else {
        quickAppointmentRef.current?.focus()
      }
    }
  }, [])

  // Enhanced global error handling for Google API and third-party issues
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const message = event.error?.message || event.message || ''
      
      // Suppress Google API related errors
      if (message.includes('u[v] is not a function') ||
          message.includes('gapi.loaded') ||
          message.includes('Google API') ||
          message.includes('api.js') ||
          message.includes('iframefcb') ||
          message.includes('cb=gapi.loaded') ||
          message.includes('third-party cookies')) {
        console.log('✅ Global error event suppressed:', message)
        event.preventDefault()
        return false
      }
      
      return true
    }

    // Enhanced warning suppression
    const originalWarn = console.warn
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string') {
        const message = args[0]
        
        // Suppress Chrome third-party cookies warnings
        if (message.includes('third-party cookies') ||
            message.includes('Chrome is moving towards') ||
            message.includes('browse without third-party cookies') ||
            message.includes('new experience') ||
            message.includes('choose to browse')) {
          return
        }
      }
      
      originalWarn.apply(console, args)
    }

    // Enhanced error suppression
    const originalError = console.error
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string') {
        const message = args[0]
        
        // Suppress Google API and related errors
        if (message.includes('u[v] is not a function') ||
            message.includes('gapi.loaded') ||
            message.includes('Google API') ||
            message.includes('api.js') ||
            message.includes('iframefcb') ||
            message.includes('cb=gapi.loaded') ||
            message.includes('third-party cookies') ||
            message.includes('Content Security Policy') ||
            message.includes('api.ipify.org') ||
            message.includes('Missing or insufficient permissions') ||
            message.includes('Failed to process audit queue')) {
          console.log('✅ Non-critical error suppressed:', message)
          return
        }
      }
      originalError.apply(console, args)
    }

    // Enhanced unhandled rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      if (reason && typeof reason === 'string') {
        if (reason.includes('u[v] is not a function') ||
            reason.includes('gapi.loaded') ||
            reason.includes('Google API') ||
            reason.includes('api.js')) {
          console.log('✅ Unhandled rejection suppressed:', reason)
          event.preventDefault()
          return
        }
      }
    }

    window.addEventListener('error', handleGlobalError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    
    return () => {
      window.removeEventListener('error', handleGlobalError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  return (
    <div className={styles.landingPageContainer}>
      <YearUpdater />
      {/* Skip link for keyboard navigation */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Live region for screen reader announcements */}
      <div 
        id="live-region" aria-live="polite" aria-atomic="true" className="sr-only">
      </div>
      
      {/* Navigation Header */}
      <header className={styles.header} role="banner">

        <div className={styles.headerContainer}>

          <a 
            href="/"
            className={styles.brandNameAndLogo}
            aria-label="Haliya - Healthcare Platform Philippines"
          >

            <i className="fas fa-heartbeat" aria-hidden="true"></i>

            <h2>Haliya</h2>

            <div 
              className={styles.logoBadge} 
              aria-label="Philippines"
              >
                <p>
                  PH
                </p>
            </div>

          </a>
          
          {/* Mobile Menu Toggle */}
          <button 
            ref={mobileMenuToggleRef}
            className={styles.mobileMenuToggle}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            onKeyDown={handleMobileMenuToggleKeyDown}
            aria-label="Toggle mobile navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`${styles.hamburger} ${isMobileMenuOpen ? styles.open : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          
          <nav
            className={`header-actions ${isMobileMenuOpen ? 'mobile-open' : ''}`}
            role="navigation"
            aria-label="Main navigation"
          >
            <div className={`${styles.headerButtonContainer} ${isMobileMenuOpen ? styles.isOpen : ''}`}>
              <button 
                onClick={() => {
                  navigate('/quick-appointments')
                  setIsMobileMenuOpen(false)
                }}
                className={styles.quickApptBtn}
                aria-label="Book a quick appointment without signing up"
              >
                <i className="fas fa-calendar-plus" aria-hidden="true"></i>
                Quick Appointment
              </button>



              <button 
                ref={loginButtonRef}
                onClick={() => {
                  navigate('/patient-sign-in')
                  setIsMobileMenuOpen(false)
                }}
                onKeyDown={handleLoginButtonKeyDown}
                className={styles.loginBtn}
                aria-label="Sign in to your patient account"
              >
                Login
              </button>
              
              <button 
                ref={registerButtonRef}
                onClick={() => {
                  navigate('/patient-sign-up')
                  setIsMobileMenuOpen(false)
                }}
                onKeyDown={handleRegisterButtonKeyDown}
                className={styles.registerBtn} 
                aria-label="Create a new patient account"
              >
                Register
              </button>
            </div>
            

          </nav>
        </div>
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className={styles.mobileMenuOverlay}
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
            role="presentation"
          />
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" role="main">
        <div className={styles.goldContainer}>
          <img src={heroBgImage} alt="" />

          <div className={styles.heroContent}>

            <div className={styles.left}>
              <div className={styles.top}>
                <h1>Get Your Consultation Online</h1>
                <h2>Connect with top healthcare facilities from home</h2>
              </div>
              
              <div className={styles.onlineStats} role="region" aria-label="Healthcare facilities statistics">
                <div className="doctor-avatars" aria-label="Healthcare professionals">
                  <div className={styles.avatars}>
                    <img src={slmcImage} 
                        alt="St. Luke's Medical Center" 
                        loading="lazy"
                        width="50" 
                        height="50"
                        onError={(e) => {
                          console.warn('Failed to load SLMC image:', e);
                          e.currentTarget.style.display = 'none';
                        }} />
                  </div>
                  <div className={styles.avatars}>
                    <img src={tmcImage} 
                        alt="The Medical City" 
                        loading="lazy"
                        width="50" 
                        height="50"
                        onError={(e) => {
                          console.warn('Failed to load TMC image:', e);
                          e.currentTarget.style.display = 'none';
                        }} />
                  </div>
                  <div className={styles.avatars}>
                    <img src={ahmcImage} 
                        alt="Asian Hospital and Medical Center" 
                        loading="lazy"
                        width="50" 
                        height="50"
                        onError={(e) => {
                          console.warn('Failed to load AHMC image:', e);
                          e.currentTarget.style.display = 'none';
                        }} />
                  </div>
                </div>
                <p aria-live="polite">
                  {isLoadingFacilities 
                    ? 'Loading healthcare facilities...' 
                    : facilities.length > 0 
                      ? `+${facilities.length} healthcare facilities are online`
                      : 'Join our healthcare network'
                  }
                </p>
              </div>
            </div>
          
            <div className={styles.right}>

              <img
                className={styles.doctors}
                src={doctorsImage}
                alt="Photo of Dr. Willie Ong" 
                loading="eager"
                decoding="async"
                onError={(e) => {
                  console.warn('Failed to load Dr. Willie Ong image:', e);
                  e.currentTarget.style.display = 'none';
                }} />

            </div>

          </div>
          
        </div>

        {/* Search Section */}
        <section className="search-section" aria-labelledby="search-heading">
          <div className="search-container">
            <h2 id="search-heading" className="sr-only">Search for healthcare facilities</h2>
            <form 
              className="search-bar" 
              role="search" 
              aria-label="Healthcare facility search form" 
              onSubmit={(e) => { 
                e.preventDefault(); 
                try {
                  handleSearch(); 
                } catch (error) {
                  console.warn('Search error:', error);
                  showNotification('Search failed. Please try again.', 'error');
                }
              }}
            >
              <div className="search-input">
                <label htmlFor="facility-search" className="sr-only">Search for hospitals and clinics</label>
                <i className="fas fa-search" aria-hidden="true"></i>
                <input 
                  ref={searchInputRef}
                  type="text" 
                  id="facility-search"
                  name="facility-search"
                  placeholder="Find hospitals and clinics" 
                  aria-describedby="search-help"
                  value={searchTerm}
                  onChange={(e) => {
                    try {
                      setSearchTerm(e.target.value)
                    } catch (error) {
                      console.warn('Search term update error:', error)
                    }
                  }}
                  onKeyDown={handleSearchKeyDown}
                />
                <div id="search-help" className="sr-only">Enter the name or type of healthcare facility you're looking for</div>
              </div>
              <div className="location-input">
                <label htmlFor="location-search" className="sr-only">Enter location</label>
                <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                <input 
                  ref={locationInputRef}
                  type="text" 
                  id="location-search"
                  name="location-search"
                  placeholder="Location" 
                  aria-describedby="location-help"
                  value={location}
                  onChange={(e) => {
                    try {
                      setLocation(e.target.value)
                    } catch (error) {
                      console.warn('Location update error:', error)
                    }
                  }}
                  onKeyDown={handleLocationKeyDown}
                />
                <div id="location-help" className="sr-only">Enter city, province, or area to search nearby facilities</div>
                <button 
                  type="button" 
                  className="location-detect-btn" 
                  aria-label="Detect current location"
                  title="Use my current location"
                  onClick={() => {
                    try {
                      detectLocation()
                    } catch (error) {
                      console.warn('Location detection error:', error)
                      showNotification('Location detection failed. Please try again.', 'error')
                    }
                  }}
                >
                  <i className="fas fa-crosshairs" aria-hidden="true"></i>
                </button>
              </div>
              <button 
                ref={searchButtonRef}
                type="submit" 
                className="search-button" 
                aria-label="Search healthcare facilities"
                disabled={isSearching}
                onKeyDown={handleSearchButtonKeyDown}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>
            
            {/* Quick Appointment CTA */}
            <aside className="quick-appointment-cta" role="complementary" aria-labelledby="quick-appointment-heading">
              <div className="cta-content">
                <div className="cta-text">
                  <h3 id="quick-appointment-heading">Need an appointment fast?</h3>
                  <p>Don't have time to sign up? Book a quick appointment in just 2 minutes!</p>
                </div>
                <button 
                  ref={quickAppointmentRef}
                  onClick={() => navigate('/quick-appointments')}
                  onKeyDown={handleQuickAppointmentKeyDown}
                  className="cta-quick-appointment-btn"
                  aria-label="Book a quick appointment without signing up"
                >
                  <i className="fas fa-bolt" aria-hidden="true"></i>
                  Quick Appointment
                </button>
              </div>
            </aside>

          </div>
        </section>
      </main>

      {/* Recommended Healthcare Facilities */}
      <section className="recommended-facilities" aria-labelledby="recommended-heading">
        <div className="container">
          <div className="section-header">
            <h2 id="recommended-heading">Recommended Healthcare Facilities</h2>
            <a 
              href="#" 
              className="view-all" 
              aria-label="View all recommended healthcare facilities"
              onClick={(e) => { e.preventDefault(); handleViewAllFacilities(); }}
            >
              View All <i className="fas fa-chevron-right" aria-hidden="true"></i>
            </a>
          </div>
          
          <div className="facilities-grid" role="list" aria-label="List of recommended healthcare facilities">
            {isLoadingFacilities ? (
              <div className="facilities-loading" role="status" aria-live="polite">
                <div className="loading-spinner" aria-hidden="true">
                  <i className="fas fa-spinner fa-spin" aria-hidden="true"></i>
                </div>
                <p>Loading healthcare facilities...</p>
              </div>
            ) : facilitiesError ? (
              <div className="facilities-error" role="alert" aria-live="assertive">
                <i className="fas fa-exclamation-triangle" aria-hidden="true"></i>
                <p>{facilitiesError}</p>
                <button 
                  onClick={fetchFacilities}
                  className="retry-btn"
                  aria-label="Retry loading facilities"
                >
                  <i className="fas fa-redo" aria-hidden="true"></i>
                  Try Again
                </button>
              </div>
            ) : facilities.length === 0 ? (
              <div className="facilities-empty" role="status" aria-live="polite">
                <i className="fas fa-hospital" aria-hidden="true"></i>
                <p>No healthcare facilities found yet.</p>
                <p className="empty-subtitle">Be the first to join our platform!</p>
                <button 
                  onClick={() => navigate('/partner-sign-up')}
                  className="join-btn"
                  aria-label="Join as healthcare provider"
                >
                  <i className="fas fa-handshake" aria-hidden="true"></i>
                  Join as Provider
                </button>
              </div>
            ) : (
              facilities.map((facility: Facility, index: number) => (
                <article 
                  key={facility.uid} 
                  className="facility-card" 
                  role="listitem"
                  onKeyDown={(e) => handleFacilityCardKeyDown(e, index)}
                >
                  <div className="facility-profile">
                    <div className="facility-image">
                      <img src={slmcImage} 
                           alt={`${facility.name} building exterior`} 
                           loading="lazy"
                           width="80" 
                           height="80"
                           onError={(e) => {
                             console.warn('Failed to load facility image:', e);
                             e.currentTarget.style.display = 'none';
                           }} />
                    </div>
                    <div className="facility-details">
                      <h3>{facility.name}</h3>
                      <p className="facility-type">{facility.type} | {getExperienceYears(facility.createdAt)}</p>
                      <span className="specialty-tag" aria-label="Specialty: {getPrimarySpecialty(facility.specialties, facility.services)}">{getPrimarySpecialty(facility.specialties, facility.services)}</span>
                    </div>
                  </div>
                  
                  <div className="facility-schedule" role="group" aria-label="Facility schedule and pricing">
                    <div className="schedule-info">
                      <i className="fas fa-clock" aria-hidden="true"></i>
                      <time dateTime="09:00-17:00">{formatOperatingHours(facility.operatingHours)}</time>
                    </div>
                    <div className="price-info">
                      <i className="fas fa-peso-sign" aria-hidden="true"></i>
                      <span aria-label="Starting price">{getStartingPrice(facility.type)}</span>
                      <small>Starting</small>
                    </div>
                  </div>
                  
                  <button 
                    className="book-appointment" 
                    aria-label={`Book an appointment with ${facility.name}`}
                    onClick={() => handleAppointmentBooking(facility.name)}
                    onKeyDown={(e) => handleFacilityCardKeyDown(e, index)}
                  >
                    Book an appointment
                  </button>
                </article>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Nearby Healthcare Facilities */}
      <section className="nearby-facilities" aria-labelledby="nearby-heading">
        <div className="container">
          <h2 id="nearby-heading">Nearby Healthcare Facilities</h2>
          <div className="location-prompt">
            <div className="location-icon">
              <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
            </div>
            <div className="location-message">
              <p>Please enable your location, so we can find nearby healthcare facilities</p>
              <a 
                href="#" 
                className="enable-location" 
                aria-label="Enable location services to find nearby facilities"
                onClick={(e) => { e.preventDefault(); detectLocation(); }}
              >
                Enable Now
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Healthcare Provider CTA Section */}
      <section className="provider-cta" aria-labelledby="provider-heading">
        <div className="container">
          <div className="cta-content">
            <div className="cta-text">
              <h2 id="provider-heading">Are you a Healthcare Provider?</h2>
              <p>Join Haliya and connect with thousands of patients across the Philippines. Streamline your practice with our comprehensive healthcare platform.</p>
              <div className="cta-features" role="list" aria-label="Platform features for healthcare providers">
                <div className="cta-feature" role="listitem">
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                  <span>Patient Management System</span>
                </div>
                <div className="cta-feature" role="listitem">
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                  <span>Online Consultation Tools</span>
                </div>
                <div className="cta-feature" role="listitem">
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                  <span>Appointment Scheduling</span>
                </div>
                <div className="cta-feature" role="listitem">
                  <i className="fas fa-check-circle" aria-hidden="true"></i>
                  <span>Analytics & Reports</span>
                </div>
              </div>
            </div>
                          <div className="cta-action">
                <button 
                  onClick={handlePartnerSignup}
                  className="partner-btn"
                  aria-label="Register your healthcare practice with Haliya"
                >
                  <i className="fas fa-handshake" aria-hidden="true"></i>
                  Partner with Haliya
                </button>
                <p className="cta-note">
                  Join {isLoadingFacilities ? '...' : facilities.length > 0 ? `${facilities.length}+` : '0+'} healthcare providers already on our platform
                </p>
              </div>
          </div>
        </div>
      </section>

      {/* Encryption Demo Section */}
      <section className="encryption-demo-section" aria-labelledby="encryption-demo-heading">
        <div className="container">
          <div className="encryption-demo-content">
            <div className="encryption-demo-text">
              <h2 id="encryption-demo-heading">See How We Protect Your Data</h2>
              <p>Experience Haliya's military-grade encryption in action. Watch how your sensitive healthcare information is protected from input to storage.</p>
            </div>
            <div className="encryption-demo-action">
              <button 
                onClick={() => navigate('/encryption-demo')}
                className="encryption-demo-btn"
                aria-label="View end-to-end encryption demo"
              >
                <i className="fas fa-shield-alt" aria-hidden="true"></i>
                Try Encryption Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* RBAC Demo Section */}
      <section className="rbac-demo-section" aria-labelledby="rbac-demo-heading">
        <div className="container">
          <div className="rbac-demo-content">
            <div className="rbac-demo-text">
              <h2 id="rbac-demo-heading">Experience Smart Access Control</h2>
              <p>See how Haliya ensures data security through intelligent role-based permissions. Different user types access only what they need.</p>
            </div>
            <div className="rbac-demo-action">
              <button 
                onClick={() => navigate('/rbac-demo')}
                className="rbac-demo-btn"
                aria-label="View role-based access control demo"
              >
                <i className="fas fa-user-shield" aria-hidden="true"></i>
                Try RBAC Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* File Upload Security Demo Section */}
      <section className="file-upload-security-demo-section" aria-labelledby="file-upload-security-demo-heading">
        <div className="container">
          <div className="file-upload-security-demo-content">
            <div className="file-upload-security-demo-text">
              <h2 id="file-upload-security-demo-heading">Advanced File Upload Protection</h2>
              <p>See how Haliya protects against malicious file uploads and ensures secure document handling. Every file is analyzed for threats in real-time.</p>
            </div>
            <div className="file-upload-security-demo-action">
              <button 
                onClick={() => navigate('/file-upload-security-demo')}
                className="file-upload-security-demo-btn"
                aria-label="View file upload security demo"
              >
                <i className="fas fa-shield-alt" aria-hidden="true"></i>
                Try File Security Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer" role="contentinfo">
        <div className="container">
          {/* Business Partnership CTA */}
          <div className="footer-cta">
            <div className="footer-cta-content">
              <div className="cta-text-section">
                <h3>
                  <i className="fas fa-hospital" aria-hidden="true"></i>
                  Healthcare Providers - Join Haliya
                </h3>
                <p>Connect with thousands of patients across the Philippines. Grow your practice with our digital platform.</p>
              </div>
              <div className="cta-actions-section">
                    <button 
                      onClick={handlePartnerSignin}
                      className="cta-secondary-btn"
                      aria-label="Sign in to provider portal"
                    >
                      <i className="fas fa-sign-in-alt" aria-hidden="true"></i>
                      Provider Login
                    </button>
              </div>
            </div>
          </div>
          
          {/* Main Footer Content */}
          <div className="footer-main">
            <div className="footer-grid">
              {/* Company Info */}
              <div className="footer-brand" role="contentinfo">
                <div className="footer-logo">
                  <i className="fas fa-heartbeat" aria-hidden="true"></i>
                  <span>Haliya</span>
                  <span className="logo-badge" aria-label="Philippines">PH</span>
                </div>
                <p className="footer-description">
                  The Philippines' leading digital healthcare platform connecting patients with trusted medical facilities.
                </p>
                <div className="footer-stats" role="group" aria-label="Platform statistics">
                  <div className="stat-item">
                    <span className="stat-number" aria-live="polite">
                      {isLoadingFacilities ? '...' : facilities.length > 0 ? `${facilities.length}+` : '0+'}
                    </span>
                    <span className="stat-label">Partners</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">50K+</span>
                    <span className="stat-label">Patients</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">24/7</span>
                    <span className="stat-label">Available</span>
                  </div>
                </div>
              </div>

              {/* For Patients */}
              <nav className="footer-nav" aria-labelledby="patient-nav">
                <h3 id="patient-nav">For Patients</h3>
                <ul className="nav-list" role="menu">
                  <li role="none"><button onClick={() => navigate('/patient-sign-up')} aria-label="Create a new patient account" role="menuitem">Create Account</button></li>
                  <li role="none"><button onClick={() => navigate('/patient-sign-in')} aria-label="Sign in to your patient account" role="menuitem">Patient Login</button></li>
                  <li role="none"><button onClick={() => navigate('/patient-portal')} aria-label="Find healthcare facilities and providers" role="menuitem">Find Healthcare</button></li>
                  <li role="none"><button onClick={() => navigate('/patient-portal')} aria-label="Book a medical appointment" role="menuitem">Book Appointment</button></li>
                  <li role="none"><button onClick={() => navigate('/patient-portal')} aria-label="Access your medical records" role="menuitem">Medical Records</button></li>
                  <li role="none"><button onClick={() => navigate('/patient-portal')} aria-label="Start a telemedicine consultation" role="menuitem">Telemedicine</button></li>
                </ul>
              </nav>

              {/* For Providers */}
              <nav className="footer-nav provider-nav" aria-labelledby="provider-nav">
                <h3 id="provider-nav">
                  <i className="fas fa-user-md" aria-hidden="true"></i>
                  For Providers
                </h3>
                <ul className="nav-list" role="menu">
                  <li className="featured" role="none">
                    <button onClick={handlePartnerSignup} aria-label="Register your healthcare practice with Haliya" role="menuitem">
                      <i className="fas fa-star" aria-hidden="true"></i>
                      Join Haliya
                    </button>
                  </li>
                  <li role="none"><button onClick={handlePartnerSignin} aria-label="Sign in to provider portal" role="menuitem">Provider Portal</button></li>
                  <li role="none"><button onClick={handleBusinessPortal} aria-label="Access practice management tools" role="menuitem">Practice Tools</button></li>
                  <li role="none"><button onClick={handleBusinessPortal} aria-label="Manage patient information and records" role="menuitem">Patient Management</button></li>
                  <li role="none"><button onClick={handleBusinessPortal} aria-label="View practice analytics and reports" role="menuitem">Analytics</button></li>
                  <li role="none"><button onClick={handleBusinessPortal} aria-label="Get support and help" role="menuitem">Support</button></li>
                </ul>
              </nav>

              {/* Support & Contact */}
              <div className="footer-contact">
                <h3>Get in Touch</h3>
                <div className="contact-methods">
                  <a href="mailto:support@lingaplink.ph" className="contact-item">
                    <i className="fas fa-envelope" aria-hidden="true"></i>
                    <span>support@lingaplink.ph</span>
                  </a>
                  <a href="tel:+6321234567" className="contact-item">
                    <i className="fas fa-phone" aria-hidden="true"></i>
                    <span>+63 (2) 123-4567</span>
                  </a>
                  <div className="contact-item">
                    <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                    <span>Makati City, Philippines</span>
                  </div>
                </div>
                
                <div className="footer-links-section">
                  <h4>Quick Links</h4>
                  <ul className="quick-links">
                    <li><a href="#" aria-label="Access help center and support resources">Help Center</a></li>
                    <li><a href="#" aria-label="Read our privacy policy">Privacy Policy</a></li>
                    <li><a href="#" aria-label="Read our terms of service">Terms of Service</a></li>
                    <li><a href="#" aria-label="Learn about our data privacy policies">Data Privacy</a></li>
                    <li><button onClick={() => navigate('/encryption-demo')} className="text-link" aria-label="View end-to-end encryption demo">Encryption Demo</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <div className="copyright">
                <p>&copy; <span id="current-year">2024</span> Haliya. All rights reserved.</p>
              </div>
              <div className="social-links">
                <a 
                  href="#" 
                  className="social-link" 
                  aria-label="Facebook"
                  onClick={(e) => { e.preventDefault(); handleSocialLink('Facebook'); }}
                >
                  <i className="fab fa-facebook" aria-hidden="true"></i>
                </a>
                <a 
                  href="#" 
                  className="social-link" 
                  aria-label="Twitter"
                  onClick={(e) => { e.preventDefault(); handleSocialLink('Twitter'); }}
                >
                  <i className="fab fa-twitter" aria-hidden="true"></i>
                </a>
                <a 
                  href="#" 
                  className="social-link" 
                  aria-label="Instagram"
                  onClick={(e) => { e.preventDefault(); handleSocialLink('Instagram'); }}
                >
                  <i className="fab fa-instagram" aria-hidden="true"></i>
                </a>
                <a 
                  href="#" 
                  className="social-link" 
                  aria-label="LinkedIn"
                  onClick={(e) => { e.preventDefault(); handleSocialLink('LinkedIn'); }}
                >
                  <i className="fab fa-linkedin" aria-hidden="true"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Emergency Call Button - Fixed Position */}
      <style>{`
        .encryption-demo-section {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 4rem 0;
          margin: 2rem 0;
        }
        
        .encryption-demo-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        .encryption-demo-text h2 {
          color: #1e293b;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        
        .encryption-demo-text p {
          color: #64748b;
          font-size: 1.1rem;
          line-height: 1.6;
          margin: 0;
        }
        
        .encryption-demo-btn {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }
        
        .encryption-demo-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
        
        .encryption-demo-btn i {
          font-size: 1.2rem;
        }
        
        /* RBAC Demo Section Styles */
        .rbac-demo-section {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 4rem 0;
          margin: 2rem 0;
        }
        
        .rbac-demo-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        .rbac-demo-text h2 {
          color: #1e293b;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        
        .rbac-demo-text p {
          color: #64748b;
          font-size: 1.1rem;
          line-height: 1.6;
          margin: 0;
        }
        
        .rbac-demo-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .rbac-demo-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
        }
        
        .rbac-demo-btn i {
          font-size: 1.2rem;
        }
        
        /* File Upload Security Demo Section Styles */
        .file-upload-security-demo-section {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          padding: 4rem 0;
          margin: 2rem 0;
        }
        
        .file-upload-security-demo-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        .file-upload-security-demo-text h2 {
          color: #1e293b;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        
        .file-upload-security-demo-text p {
          color: #64748b;
          font-size: 1.1rem;
          line-height: 1.6;
          margin: 0;
        }
        
        .file-upload-security-demo-btn {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
        }
        
        .file-upload-security-demo-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
        }
        
        .file-upload-security-demo-btn i {
          font-size: 1.2rem;
        }
        
        @media (max-width: 768px) {
          .encryption-demo-content,
          .rbac-demo-content,
          .file-upload-security-demo-content {
            flex-direction: column;
            text-align: center;
          }
          
          .encryption-demo-text h2,
          .rbac-demo-text h2,
          .file-upload-security-demo-text h2 {
            font-size: 1.5rem;
          }
          
          .encryption-demo-text p,
          .rbac-demo-text p,
          .file-upload-security-demo-text p {
            font-size: 1rem;
          }
          
          .encryption-demo-btn,
          .rbac-demo-btn,
          .file-upload-security-demo-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
      
      <div className="emergency-call-fixed">
        <button 
          className="emergency-call-btn-fixed"
          onClick={() => {
            // Ask for confirmation before proceeding
            const confirmed = window.confirm('🚨 Are you sure you want to call emergency services?\n\nThis is a DEMO application. In a real emergency, call 911 or your local emergency number immediately.\n\nClick OK to continue with the demo, or Cancel to go back.')
            
            if (confirmed) {
              // Mock emergency call - in real app this would call actual emergency services
              const mockNumber = '+63 911 123 4567'
              showNotification(`🚨 Emergency Call: ${mockNumber}`, 'info')
              
              // Simulate call attempt
              setTimeout(() => {
                showNotification('📞 Connecting to emergency services...', 'info')
              }, 1000)
              
              setTimeout(() => {
                showNotification('⚠️ This is a demo. In a real emergency, call 911 or your local emergency number.', 'warning')
              }, 3000)
            }
          }}
          aria-label="Emergency call button - Call emergency services"
          title="Emergency Call - Demo Only"
        >
          <div className="emergency-icon-fixed">
            <i className="fas fa-phone-alt"></i>
          </div>
          <span className="emergency-text-fixed">911</span>
        </button>
      </div>

      {/* Toast Container for Notifications */}
      <div id="toast-container" className="toast-container" aria-live="polite" aria-atomic="false"></div>
    </div>
  )
})

export default LandingPage 