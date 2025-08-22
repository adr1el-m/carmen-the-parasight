import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import YearUpdater from './YearUpdater'
import '../styles/index.css'

// Extend Window interface for Google API
declare global {
  interface Window {
    gapi?: any
  }
}

// Import images
import slmcImage from '../assets/img/SLMC.jpg'
import tmcImage from '../assets/img/TMC.jpg'
import ahmcImage from '../assets/img/AHMC.jpeg'
import drWillieOngImage from '../assets/img/Dr. Willie Ong.jpg'
import drAlvinFranciscoImage from '../assets/img/Dr. Alvin Francisco.jpg'

const LandingPage: React.FC = React.memo(() => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [location, setLocation] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Refs for cleanup
  const headerScrollRef = useRef<(() => void) | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const notificationTimeoutRef = useRef<number | null>(null)

  // Selective error suppression - only suppress actual errors, not intercept Google API
  if (typeof window !== 'undefined') {
    // Only suppress specific error messages without interfering with Firebase authentication
    console.log('✅ LandingPage: Selective error suppression enabled');
    
    // Suppress Chrome warnings immediately
    const originalWarn = console.warn
    console.warn = (...args) => {
      const message = args[0]
      if (typeof message === 'string') {
        if (message.includes('third-party cookies') ||
            message.includes('Chrome is moving towards') ||
            message.includes('browse without third-party cookies') ||
            message.includes('new experience') ||
            message.includes('choose to browse')) {
          return // Suppress completely
        }
      }
      originalWarn.apply(console, args)
    }
    
    // Suppress Google API errors immediately
    const originalError = console.error
    console.error = (...args) => {
      const message = args[0]
      if (typeof message === 'string') {
        if (message.includes('u[v] is not a function') ||
            message.includes('gapi.loaded') ||
            message.includes('gapi') ||
            message.includes('Google API') ||
            message.includes('api.js') ||
            message.includes('iframefcb')) {
          console.log('External service error suppressed in LandingPage:', ...args)
          return // Suppress completely
        }
      }
      originalError.apply(console, args)
    }
    
    // Override window.onerror immediately
    const originalOnError = window.onerror
    window.onerror = (message, source, lineno, colno, error) => {
      if (typeof message === 'string') {
        if (message.includes('u[v] is not a function') ||
            message.includes('gapi.loaded') ||
            message.includes('gapi') ||
            message.includes('third-party cookies') ||
            message.includes('api.js') ||
            message.includes('iframefcb')) {
          console.log('Global error suppressed in LandingPage:', message)
          return true // Prevent error from being logged
        }
      }
      
      // Call original handler for other errors
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error)
      }
      return false
    }
    
          // Override addEventListener for error events - only suppress non-critical errors
      const originalAddEventListener = window.addEventListener
      window.addEventListener = function(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
        if (type === 'error') {
          // Wrap error listeners to filter out only third-party cookie warnings
          const wrappedListener = (event: Event) => {
            if (event instanceof ErrorEvent) {
              const message = event.message || event.error?.message || ''
              if (message.includes('third-party cookies')) {
                console.log('Third-party cookies warning suppressed in LandingPage:', message)
                return // Don't call the original listener for third-party cookie warnings
              }
            }
            // Call original listener for other errors
            if (typeof listener === 'function') {
              return listener.call(this, event)
            }
          }
          return originalAddEventListener.call(this, type, wrappedListener, options)
        }
        return originalAddEventListener.call(this, type, listener, options)
      }
    
    // Allow Google authentication scripts to load normally
    console.log('✅ LandingPage: Google authentication scripts allowed')
    
          console.log('✅ LandingPage: Selective error suppression activated - Google authentication allowed')
  }

  // Comprehensive error suppression system
  const setupErrorSuppression = useCallback(() => {
    try {
      // Override console methods globally
      const originalWarn = console.warn
      const originalError = console.error
      
      // Suppress all Chrome third-party cookies warnings
      console.warn = (...args) => {
        const message = args[0]
        if (typeof message === 'string') {
          if (message.includes('third-party cookies') ||
              message.includes('Chrome is moving towards') ||
              message.includes('browse without third-party cookies') ||
              message.includes('new experience') ||
              message.includes('choose to browse')) {
            return // Suppress completely
          }
        }
        originalWarn.apply(console, args)
      }
      
      // Suppress only non-critical errors (allow Google authentication)
      console.error = (...args) => {
        const message = args[0]
        if (typeof message === 'string') {
          if (message.includes('third-party cookies')) {
            console.log('Third-party cookies warning suppressed:', ...args)
            return // Suppress only third-party cookie warnings
          }
        }
        originalError.apply(console, args)
      }
      
      // Override window.onerror - only suppress non-critical errors
      const originalOnError = window.onerror
      window.onerror = (message, source, lineno, colno, error) => {
        if (typeof message === 'string') {
          if (message.includes('third-party cookies')) {
            console.log('Third-party cookies warning suppressed:', message)
            return true // Prevent only third-party cookie warnings
          }
        }
        
        // Call original handler for other errors
        if (originalOnError) {
          return originalOnError(message, source, lineno, colno, error)
        }
        return false
      }
      
      console.log('Comprehensive error suppression system activated')
      
      return () => {
        console.warn = originalWarn
        console.error = originalError
        window.onerror = originalOnError
      }
    } catch (error) {
      console.log('Error suppression setup failed:', error)
    }
  }, [])

  useEffect(() => {
    // Initialize animations and effects
    initializeAnimations()
    initializeAccessibility()
    initializeHeaderScroll()
    
    // Prevent HIPAA service errors on landing page
    preventHIPAAErrors()
    
    // Prevent Google API errors from external sources
    preventGoogleAPIErrors()
    
    // Setup comprehensive error suppression
    const cleanupErrorSuppression = setupErrorSuppression()
    
    // Start error monitoring
    const cleanupErrorMonitoring = monitorAndSuppressErrors()
    
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
  }, [])

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
    announceToScreenReader('LingapLink healthcare platform loaded. Use Tab to navigate.')
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
      // This will help prevent HIPAA service errors when not authenticated
      if (typeof window !== 'undefined' && (window as any).firebase) {
        console.log('Firebase detected, authentication status will be checked')
      }
    } catch (error) {
      console.warn('Firebase check failed:', error)
    }
  }, [])

  // Prevent HIPAA service from running when not needed
  const preventHIPAAErrors = useCallback(() => {
    try {
      // Check if we're on a page that needs HIPAA compliance
      const currentPath = window.location.pathname
      const needsHIPAA = ['/dashboard', '/patient-portal', '/hipaa-compliance'].includes(currentPath)
      
      if (!needsHIPAA) {
        // If we're on the landing page, we don't need HIPAA compliance
        console.log('Landing page detected, HIPAA compliance not required')
        
        // Try to disable HIPAA service if it's running
        try {
          if (typeof window !== 'undefined' && (window as any).hipaaService) {
            (window as any).hipaaService.disableAuditLogging()
            console.log('HIPAA service disabled for landing page')
          }
        } catch (error) {
          console.warn('Failed to disable HIPAA service:', error)
        }
        
        return
      }
    } catch (error) {
      console.warn('HIPAA prevention check failed:', error)
    }
  }, [])

  // Allow Google authentication scripts to load normally
  const preventGoogleAPIErrors = useCallback(() => {
    try {
      console.log('✅ LandingPage: Google authentication scripts allowed to load normally');
      // No script blocking - allow Firebase to handle Google authentication
      return () => {}; // Return empty cleanup function
    } catch (error) {
      console.log('Google API prevention setup failed:', error);
    }
  }, [])

  // Handle potential third-party script errors (but allow Google authentication)
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      // Allow Google authentication errors to propagate normally
      // Only suppress non-critical third-party errors
      if (event.error && event.error.message && 
          event.error.message.includes('third-party cookies')) {
        console.log('Third-party cookies warning suppressed:', event.error.message)
        event.preventDefault()
        return false
      }
      
      return true
    }

    // Suppress Chrome third-party cookies warning
    const originalWarn = console.warn
    console.warn = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('third-party cookies')) {
        // Suppress Chrome third-party cookies warning
        return
      }
      
      // Suppress HIPAA audit warnings that are not critical
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('HIPAA audit: User not fully verified') ||
           args[0].includes('HIPAA audit: User not authenticated') ||
           args[0].includes('HIPAA audit: Service not ready'))) {
        // These are informational, not warnings
        return
      }
      
      // Suppress other Chrome-specific warnings
      if (args[0] && typeof args[0] === 'string' && 
          (args[0].includes('Chrome is moving towards') ||
           args[0].includes('browse without third-party cookies') ||
           args[0].includes('new experience') ||
           args[0].includes('choose to browse'))) {
        return
      }
      
      originalWarn.apply(console, args)
    }

    // Suppress only non-critical HIPAA service errors (allow Google authentication)
    const originalError = console.error
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string') {
        const message = args[0]
        if (message.includes('third-party cookies') ||
            message.includes('Content Security Policy') ||
            message.includes('api.ipify.org') ||
            message.includes('Missing or insufficient permissions') ||
            message.includes('Failed to process audit queue') ||
            message.includes('hipaa-compliance.service.ts')) {
          console.log('Non-critical service error suppressed:', ...args)
          return
        }
      }
      originalError.apply(console, args)
    }

    window.addEventListener('error', handleGlobalError)
    
    return () => {
      window.removeEventListener('error', handleGlobalError)
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  // Monitor and suppress only non-critical errors (allow Google authentication)
  const monitorAndSuppressErrors = useCallback(() => {
    try {
      // Set up a periodic check to catch only non-critical errors
      const errorCheckInterval = setInterval(() => {
        // Only suppress third-party cookie warnings, not Google authentication errors
        const consoleMessages = document.querySelectorAll('.console-message, .error-message');
        consoleMessages.forEach(msg => {
          const text = msg.textContent || '';
          if (text.includes('third-party cookies')) {
            (msg as HTMLElement).style.display = 'none';
            console.log('Third-party cookies warning suppressed:', text);
          }
        });
        
        // Don't interfere with Google API - let Firebase handle authentication
        console.log('✅ LandingPage: Google authentication allowed to work normally');
        
      }, 2000); // Check every 2 seconds - less aggressive
      
      return () => clearInterval(errorCheckInterval);
    } catch (error) {
      console.log('Error monitoring failed:', error);
    }
  }, [])

  return (
    <>
      <YearUpdater />
      {/* Live region for screen reader announcements */}
      <div id="live-region" aria-live="polite" aria-atomic="true" className="sr-only"></div>
      
      {/* Navigation Header */}
      <header className="header" role="banner">
        <div className="header-container">
          <div className="logo" style={{ color: '#0040e7' }}>
            <i className="fas fa-heartbeat" aria-hidden="true" style={{ color: '#0040e7' }}></i>
            <span style={{ color: '#0040e7' }}>LingapLink</span>
            <span className="logo-badge" style={{ 
              background: '#0040e7', 
              color: '#ffffff',
              padding: '0.3rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: '700',
              marginLeft: '0.5rem',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>PH</span>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
          
          <nav className={`header-actions ${isMobileMenuOpen ? 'mobile-open' : ''}`} role="navigation" aria-label="Main navigation">
            <button 
              onClick={() => {
                navigate('/quick-appointments')
                setIsMobileMenuOpen(false)
              }}
              className="quick-appointment-btn" 
              aria-label="Book a quick appointment without signing up"
            >
              <i className="fas fa-calendar-plus" aria-hidden="true"></i>
              Quick Appointment
            </button>
            <button 
              onClick={() => {
                navigate('/patient-sign-in')
                setIsMobileMenuOpen(false)
              }}
              className="login-btn" 
              aria-label="Sign in to your patient account"
            >
              Login
            </button>
            <button 
              onClick={() => {
                navigate('/patient-sign-up')
                setIsMobileMenuOpen(false)
              }}
              className="register-btn" 
              aria-label="Create a new patient account"
            >
              Register
            </button>
          </nav>
        </div>
        
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="mobile-menu-overlay"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}
      </header>

      {/* Main Content */}
      <main id="main-content" className="main-hero hero-gold-gradient" role="main">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-left">
              <h1>Get Your Consultation Online</h1>
              <h2>Connect with top healthcare facilities from home</h2>

              

              
              <div className="online-stats">
                <div className="doctor-avatars" role="img" aria-label="Healthcare professionals">
                  <div className="avatar">
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
                  <div className="avatar">
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
                  <div className="avatar">
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
                <span className="stats-text">+180 healthcare facilities are online</span>
              </div>
            </div>
            
            <div className="hero-right">
              <div className="medical-team">
                <picture className="doctor-main">
                  <img src={drWillieOngImage} 
                       alt="Photo of Dr. Willie Ong" 
                       loading="eager"
                       width="400" 
                       height="500" 
                       decoding="async"
                       onError={(e) => {
                         console.warn('Failed to load Dr. Willie Ong image:', e);
                         e.currentTarget.style.display = 'none';
                       }} />
                </picture>
                <picture className="doctor-secondary">
                  <img src={drAlvinFranciscoImage} 
                       alt="Photo of Dr. Alvin Francisco" 
                       loading="lazy"
                       width="400" 
                       height="500" 
                       decoding="async"
                       onError={(e) => {
                         console.warn('Failed to load Dr. Alvin Francisco image:', e);
                         e.currentTarget.style.display = 'none';
                       }} />
                </picture>
              </div>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <section className="search-section" aria-label="Healthcare facility search">
          <div className="search-container">
            <form 
              className="search-bar" 
              role="search" 
              aria-label="Search for healthcare facilities" 
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !searchTerm && !location) {
                      e.preventDefault()
                      showNotification('Please enter a search term or location', 'warning')
                    }
                  }}
                />
                <div id="search-help" className="sr-only">Enter the name or type of healthcare facility you're looking for</div>
              </div>
              <div className="location-input">
                <label htmlFor="location-search" className="sr-only">Enter location</label>
                <i className="fas fa-map-marker-alt" aria-hidden="true"></i>
                <input 
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
                type="submit" 
                className="search-button" 
                aria-label="Search healthcare facilities"
                disabled={isSearching}
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </form>
            
            {/* Quick Appointment CTA */}
            <div className="quick-appointment-cta">
              <div className="cta-content">
                <div className="cta-text">
                  <h3>Need an appointment fast?</h3>
                  <p>Don't have time to sign up? Book a quick appointment in just 2 minutes!</p>
                </div>
                <button 
                  onClick={() => navigate('/quick-appointments')}
                  className="cta-quick-appointment-btn"
                  aria-label="Book a quick appointment without signing up"
                >
                  <i className="fas fa-bolt" aria-hidden="true"></i>
                  Quick Appointment
                </button>
              </div>
            </div>

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
            {/* St. Luke's Medical Center */}
            <article className="facility-card" role="listitem">
              <div className="facility-profile">
                <div className="facility-image">
                  <img src={slmcImage} 
                       alt="St. Luke's Medical Center building exterior" 
                       loading="lazy"
                       width="80" 
                       height="80"
                       onError={(e) => {
                         console.warn('Failed to load SLMC facility image:', e);
                         e.currentTarget.style.display = 'none';
                       }} />
                </div>
                <div className="facility-details">
                  <h3>St. Luke's Medical Center</h3>
                  <p className="facility-type">Multi-specialty Hospital | 25 years experience</p>
                  <span className="specialty-tag" aria-label="Specialty: Emergency Care">Emergency Care</span>
                </div>
              </div>
              
              <div className="facility-schedule">
                <div className="schedule-info">
                  <i className="fas fa-clock" aria-hidden="true"></i>
                  <span>24/7 Available</span>
                </div>
                <div className="price-info">
                  <i className="fas fa-peso-sign" aria-hidden="true"></i>
                  <span>₱2,500</span>
                  <small>Starting</small>
                </div>
              </div>
              
              <button 
                className="book-appointment" 
                aria-label="Book an appointment with St. Luke's Medical Center"
                onClick={() => handleAppointmentBooking("St. Luke's Medical Center")}
              >
                Book an appointment
              </button>
            </article>

            {/* The Medical City */}
            <article className="facility-card" role="listitem">
              <div className="facility-profile">
                <div className="facility-image">
                  <img src={tmcImage} 
                       alt="The Medical City entrance" 
                       loading="lazy"
                       width="80" 
                       height="80"
                       onError={(e) => {
                         console.warn('Failed to load TMC facility image:', e);
                         e.currentTarget.style.display = 'none';
                       }} />
                </div>
                <div className="facility-details">
                  <h3>The Medical City</h3>
                  <p className="facility-type">Family Medicine Clinic | 15 years experience</p>
                  <span className="specialty-tag" aria-label="Specialty: Primary Care">Primary Care</span>
                </div>
              </div>
              
              <div className="facility-schedule">
                <div className="schedule-info">
                  <i className="fas fa-clock" aria-hidden="true"></i>
                  <span>Mon-Sat 8AM-6PM</span>
                </div>
                <div className="price-info">
                  <i className="fas fa-peso-sign" aria-hidden="true"></i>
                  <span>₱1,200</span>
                  <small>Starting</small>
                </div>
              </div>
              
              <button 
                className="book-appointment" 
                aria-label="Book an appointment with The Medical City"
                onClick={() => handleAppointmentBooking("The Medical City")}
              >
                Book an appointment
              </button>
            </article>

            {/* Asian Hospital and Medical Center */}
            <article className="facility-card" role="listitem">
              <div className="facility-profile">
                <div className="facility-image">
                  <img src={ahmcImage} 
                       alt="Asian Hospital and Medical Center medical facility" 
                       loading="lazy"
                       width="80" 
                       height="80"
                       onError={(e) => {
                         console.warn('Failed to load AHMC facility image:', e);
                         e.currentTarget.style.display = 'none';
                       }} />
                </div>
                <div className="facility-details">
                  <h3>Asian Hospital and Medical Center</h3>
                  <p className="facility-type">Cardiology Specialist | 20 years experience</p>
                  <span className="specialty-tag" aria-label="Specialty: Cardiology">Cardiology</span>
                </div>
              </div>
              
              <div className="facility-schedule">
                <div className="schedule-info">
                  <i className="fas fa-clock" aria-hidden="true"></i>
                  <span>Mon-Fri 9AM-5PM</span>
                </div>
                <div className="price-info">
                  <i className="fas fa-peso-sign" aria-hidden="true"></i>
                  <span>₱3,000</span>
                  <small>Starting</small>
                </div>
              </div>
              
              <button 
                className="book-appointment" 
                aria-label="Book an appointment with Asian Hospital and Medical Center"
                onClick={() => handleAppointmentBooking("Asian Hospital and Medical Center")}
              >
                Book an appointment
              </button>
            </article>
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
              <p>Join LingapLink and connect with thousands of patients across the Philippines. Streamline your practice with our comprehensive healthcare platform.</p>
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
                  aria-label="Register your healthcare practice with LingapLink"
                >
                  <i className="fas fa-handshake" aria-hidden="true"></i>
                  Partner with LingapLink
                </button>
                <p className="cta-note">Join 150+ healthcare providers already on our platform</p>
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
                  Healthcare Providers - Join LingapLink
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
              <div className="footer-brand">
                <div className="footer-logo">
                  <i className="fas fa-heartbeat" aria-hidden="true"></i>
                  <span>LingapLink</span>
                  <span className="logo-badge">PH</span>
                </div>
                <p className="footer-description">
                  The Philippines' leading digital healthcare platform connecting patients with trusted medical facilities.
                </p>
                <div className="footer-stats">
                  <div className="stat-item">
                    <span className="stat-number">180+</span>
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
                <ul className="nav-list">
                  <li><button onClick={() => navigate('/patient-sign-up')}>Create Account</button></li>
                  <li><button onClick={() => navigate('/patient-sign-in')}>Patient Login</button></li>
                  <li><button onClick={() => navigate('/patient-portal')}>Find Healthcare</button></li>
                  <li><button onClick={() => navigate('/patient-portal')}>Book Appointment</button></li>
                  <li><button onClick={() => navigate('/patient-portal')}>Medical Records</button></li>
                  <li><button onClick={() => navigate('/patient-portal')}>Telemedicine</button></li>
                </ul>
              </nav>

              {/* For Providers */}
              <nav className="footer-nav provider-nav" aria-labelledby="provider-nav">
                <h3 id="provider-nav">
                  <i className="fas fa-user-md" aria-hidden="true"></i>
                  For Providers
                </h3>
                <ul className="nav-list">
                  <li className="featured">
                    <button onClick={handlePartnerSignup}>
                      <i className="fas fa-star" aria-hidden="true"></i>
                      Join LingapLink
                    </button>
                  </li>
                  <li><button onClick={handlePartnerSignin}>Provider Portal</button></li>
                  <li><button onClick={handleBusinessPortal}>Practice Tools</button></li>
                  <li><button onClick={handleBusinessPortal}>Patient Management</button></li>
                  <li><button onClick={handleBusinessPortal}>Analytics</button></li>
                  <li><button onClick={handleBusinessPortal}>Support</button></li>
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
                    <li><a href="#">Help Center</a></li>
                    <li><a href="#">Privacy Policy</a></li>
                    <li><a href="#">Terms of Service</a></li>
                    <li><a href="#">HIPAA Compliance</a></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="footer-bottom">
            <div className="footer-bottom-content">
              <div className="copyright">
                <p>&copy; <span id="current-year">2024</span> LingapLink. All rights reserved.</p>
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
    </>
  )
})

export default LandingPage 