import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/auth-service'


import '../styles/patientSign-up.css'
import '../styles/csp-utilities.css'

// Types for better type safety
interface FormData {
  email: string
  password: string
  remember: boolean
}

interface ValidationErrors {
  email?: string
  password?: string
  general?: string
}

// Email regex pattern for validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Extend Window interface for custom properties
declare global {
  interface Window {
    inputValidator?: any
    secureSessionManager?: any
  }
}

// Error Boundary Component
class PatientSignInErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PatientSignIn Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>We're sorry, but there was an error loading the sign-in form.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

const PatientSignIn: React.FC = React.memo(() => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    remember: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isFormValid, setIsFormValid] = useState(false)
  // Removed unused lastActivity state

  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Import input validator
  const inputValidator = useMemo(() => {
    try {
      if (typeof window !== 'undefined' && window.inputValidator) {
        return window.inputValidator;
      }
    } catch (error) {
      console.warn('Input validator not available:', error);
    }
    return null;
  }, [])
  
  const isFormComplete = useMemo(() => 
    formData.email.trim() !== '' && formData.password.length > 0, 
    [formData.email, formData.password]
  )

  // Auto-refresh user activity
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        // Update last activity timestamp using secure session manager
        if (window.secureSessionManager && typeof window.secureSessionManager.updateLastActivity === 'function') {
          window.secureSessionManager.updateLastActivity()
        }
      } catch (error) {
        console.warn('Failed to update last activity:', error);
      }
    }, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Form validation effect
  useEffect(() => {
    try {
      const errors: ValidationErrors = {}
      
      if (inputValidator && formData.email.trim()) {
        try {
          const emailValidation = inputValidator.validateEmail(formData.email)
          if (!emailValidation.valid) {
            errors.email = emailValidation.error
          }
        } catch (error) {
          console.warn('Input validator failed, using fallback validation:', error);
          if (!emailRegex.test(formData.email)) {
            errors.email = 'Please enter a valid email address'
          }
        }
      } else if (formData.email.trim() && !emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }
      
      if (formData.password.length > 0 && formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long'
      }
      
      setValidationErrors(errors)
      setIsFormValid(Object.keys(errors).length === 0 && isFormComplete)
    } catch (error) {
      console.warn('Form validation failed:', error);
      // Set basic validation state
      setIsFormValid(isFormComplete)
    }
  }, [formData.email, formData.password, inputValidator, isFormComplete])

  // Focus management
  useEffect(() => {
    if (emailInputRef.current && !formData.email) {
      emailInputRef.current.focus()
    }
  }, [formData.email])

  // Auto-save form data using secure session manager
  useEffect(() => {
    try {
      if (formData.email || formData.remember) {
        if (window.secureSessionManager && typeof window.secureSessionManager.setSessionData === 'function') {
          window.secureSessionManager.setSessionData('patientSignIn_data', {
            email: formData.email,
            remember: formData.remember
          })
        }
      }
    } catch (error) {
      console.warn('Failed to save session data:', error);
    }
  }, [formData.email, formData.remember])

  // Load saved form data on mount
  useEffect(() => {
    try {
      if (window.secureSessionManager && typeof window.secureSessionManager.getSessionData === 'function') {
        const savedData = window.secureSessionManager.getSessionData('patientSignIn_data')
        if (savedData) {
          setFormData(prev => ({
            ...prev,
            email: savedData.email || '',
            remember: savedData.remember || false
          }))
        }
      }
    } catch (error) {
      console.warn('Failed to load session data:', error);
    }
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    
    // Clear error message when user starts typing
    if (errorMessage) {
      setErrorMessage('')
    }
    
    // Clear specific validation error
    if (validationErrors[name as keyof ValidationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }))
    }
  }, [errorMessage, validationErrors])

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev)
    // Focus back to password input after toggle
    setTimeout(() => {
      passwordInputRef.current?.focus()
    }, 100)
  }, [])

  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {}

    if (!inputValidator) {
      // Fallback validation if input validator is not available
      if (!formData.email.trim()) {
        errors.email = 'Email is required'
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }
      if (!formData.password) {
        errors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long'
      }
      return errors
    }

    // Use input validator for comprehensive validation
    try {
      const emailValidation = inputValidator.validateEmail(formData.email)
      if (!emailValidation.valid) {
        errors.email = emailValidation.error
      }

      const passwordValidation = inputValidator.validatePassword(formData.password)
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.error
      }
    } catch (error) {
      console.warn('Input validator failed, using fallback validation:', error);
      // Fallback to basic validation
      if (!formData.email.trim()) {
        errors.email = 'Email is required'
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }
      if (!formData.password) {
        errors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long'
      }
    }

    return errors
  }, [formData.email, formData.password, inputValidator])

  const showError = useCallback((message: string) => {
    setErrorMessage(message)
    setSuccessMessage('')
    
    // Auto-hide error after 8 seconds
    setTimeout(() => {
      setErrorMessage('')
    }, 8000)
  }, [])

  const showSuccess = useCallback((message: string) => {
    setSuccessMessage(message)
    setErrorMessage('')
    
    // Auto-hide success after 5 seconds
    setTimeout(() => {
      setSuccessMessage('')
    }, 5000)
  }, [])

  const handleEmailSignIn = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      showError(Object.values(errors)[0] || 'Please fix the errors above')
      return
    }

    setIsLoading(true)
    setErrorMessage('')
    setSuccessMessage('')
    setValidationErrors({})

    try {
      // Sign in with Custom Auth Service
      const user = await authService.loginWithEmail(formData.email, formData.password)
      
      if (user) {
        console.log('Sign-in successful:', user.email)

        showSuccess('Sign in successful! Welcome back!')
        
        // Save successful login time using secure session manager
        try {
          if (window.secureSessionManager && typeof window.secureSessionManager.setSessionData === 'function') {
            window.secureSessionManager.setSessionData('lastSuccessfulLogin', new Date().toISOString())
          }
        } catch (error) {
          console.warn('Failed to save login time:', error);
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/patient-portal')
        }, 1500)
      }
      
    } catch (error: any) {
      console.error('Sign in error:', error)
      
      showError(error.message || 'Sign in failed. Please check your credentials and try again.')
    } finally {
      setIsLoading(false)
    }
  }, [formData.email, formData.password, validateForm, showError, showSuccess, navigate])


  const handleForgotPassword = useCallback(async () => {
    const email = formData.email.trim()
    
    if (!email) {
      showError('Please enter your email address first, then click "Forgot your password?"')
      emailInputRef.current?.focus()
      return
    }
    
    try {
      if (!emailRegex.test(email)) {
        showError('Please enter a valid email address')
        emailInputRef.current?.focus()
        return
      }
    } catch (error) {
      console.warn('Email validation failed:', error);
      showError('Please enter a valid email address')
      emailInputRef.current?.focus()
      return
    }

    try {
      showError('Password reset is not yet available in the new platform. Please contact support.')

      
    } catch (error: any) {
      console.error('Password reset error:', error)
      
      let errorMsg = 'Failed to send password reset email. Please try again.'
      
      switch (error.code) {
        case 'auth/user-not-found':
          errorMsg = 'No account found with this email address. Please check your email or sign up.'
          break
        case 'auth/invalid-email':
          errorMsg = 'Please enter a valid email address.'
          break
        case 'auth/too-many-requests':
          errorMsg = 'Too many requests. Please wait before requesting another password reset email.'
          break
        case 'auth/operation-not-allowed':
          errorMsg = 'Password reset is not enabled. Please contact support.'
          break
        default:
          errorMsg = error.message || errorMsg
      }
      
      showError(errorMsg)
    }

    // Auto-focus first input for accessibility
    emailInputRef.current?.focus()
  }, [formData.email, showError, showSuccess])

  const handleSocialSignIn = useCallback((platform: string) => {
    console.log(`Signing in with ${platform}...`)
    showError(`${platform} sign-in is not implemented yet. Please use email or Google sign-in.`)
  }, [showError])

  const handleClose = useCallback(() => {
    navigate('/')
  }, [navigate])

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
      if (event.key === 'Enter' && event.ctrlKey) {
        event.preventDefault()
        if (isFormValid && !isLoading) {
          formRef.current?.requestSubmit()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, isFormValid, isLoading])

  // Accessibility: Announce form state changes
  useEffect(() => {
    if (errorMessage) {
      const liveRegion = document.getElementById('live-region')
      if (liveRegion) {
        liveRegion.textContent = `Error: ${errorMessage}`
      }
    }
  }, [errorMessage])

  return (
    <PatientSignInErrorBoundary>
      <div className="signup-container" role="main" aria-label="Patient Sign In">
        {/* Accessibility live region */}
        <div id="live-region" aria-live="assertive" aria-atomic="true" className="sr-only"></div>
        
        {/* Left Side - Medical Professionals Image */}
        <div className="left-section" aria-hidden="true">
          <div className="logo-section">
            <div className="logo">
              <span className="logo-icon" aria-hidden="true">♡</span>
              <span className="logo-text">Haliya</span>
            </div>
          </div>
          <div className="medical-professionals">
            <div className="professionals-content">
              <div className="professional-group">
                <div className="professional doctor" aria-hidden="true"></div>
                <div className="professional nurse-1" aria-hidden="true"></div>
                <div className="professional nurse-2" aria-hidden="true"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Signin Form */}
        <div className="right-section">
          <div className="close-btn">
            <button 
              type="button" 
              className="close-link" 
              onClick={handleClose}
              aria-label="Close and return to home page"
              style={{ 
                backgroundColor: 'var(--primary-blue)', 
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
          
          <div className="signup-content">
            <div className="signup-header">
              <h1 style={{ color: 'var(--primary-blue)' }}>Welcome Back</h1>
              <p>New to Haliya? <a href="/patient-sign-up" className="login-link" style={{ color: 'var(--primary-blue)' }}>Sign up</a></p>
            </div>

            <form 
              ref={formRef}
              onSubmit={handleEmailSignIn} 
              className="signup-form"
              aria-label="Sign in form"
              noValidate
            >
              <div className="form-group">
                <label htmlFor="email">Email address</label>
                <input 
                  type="email" 
                  id="email" 
                  name="email" 
                  required 
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  ref={emailInputRef}
                  disabled={isLoading}
                  aria-describedby={validationErrors.email ? "email-error" : undefined}
                  aria-invalid={!!validationErrors.email}
                  placeholder="Enter your email address"
                />
                {validationErrors.email && (
                  <div id="email-error" className="field-error" role="alert">
                    {validationErrors.email}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">Your password</label>
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password" 
                  name="password" 
                  required 
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleInputChange}
                  ref={passwordInputRef}
                  disabled={isLoading}
                  aria-describedby={validationErrors.password ? "password-error" : undefined}
                  aria-invalid={!!validationErrors.password}
                  placeholder="Enter your password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                {validationErrors.password && (
                  <div id="password-error" className="field-error" role="alert">
                    {validationErrors.password}
                  </div>
                )}
              </div>

              <div className="form-group forgot-password">
                <button 
                  type="button" 
                  className="forgot-link" 
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  aria-describedby="forgot-password-help"
                >
                  Forgot your password?
                </button>
                <div id="forgot-password-help" className="sr-only">
                  Click to receive a password reset email
                </div>
              </div>

              <button 
                type="submit" 
                className="signup-btn" 
                disabled={isLoading || !isFormValid}
                aria-describedby={!isFormValid ? "form-validation-help" : undefined}
              >
                <span className="btn-text" style={{ display: isLoading ? 'none' : 'block' }}>
                  Sign In
                </span>
                <div 
                  className="loading-spinner" 
                  style={{ display: isLoading ? 'block' : 'none' }}
                  aria-hidden="true"
                ></div>
              </button>
              {!isFormValid && (
                <div id="form-validation-help" className="sr-only">
                  Please fill in all required fields correctly to enable sign in
                </div>
              )}
            </form>

            <div className="form-footer">
              <div className="remember-me">
                <input 
                  type="checkbox" 
                  id="remember" 
                  name="remember"
                  checked={formData.remember}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  aria-describedby="remember-help"
                />
                <label htmlFor="remember" style={{ color: 'var(--primary-blue)' }}>Remember me</label>
                <div id="remember-help" className="sr-only">
                  Keep me signed in on this device
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="error-message" role="alert" aria-live="assertive">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="success-message" aria-live="polite">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                {successMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </PatientSignInErrorBoundary>
  )
})

PatientSignIn.displayName = 'PatientSignIn'

export default PatientSignIn 