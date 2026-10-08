import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import authService from '../services/auth-service'


import '../styles/patientSign-up.css'
import '../styles/csp-utilities.css'

// Regex patterns for validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
const nameRegex = /^[a-zA-Z\s\-']{2,50}$/

// Extend Window interface for custom properties
declare global {
  interface Window {
    inputValidator?: any
    secureSessionManager?: any
  }
}

interface FormData {
  email: string
  phone: string
  password: string
  confirmPassword: string
  birthDate: string
  firstName: string
  lastName: string
  address: string
  countryCode: string
  remember: boolean
  termsAccepted: boolean
  dataSharingAccepted: boolean
  dpaComplianceAccepted: boolean
  communicationAccepted: boolean
}

interface ValidationErrors {
  email?: string
  phone?: string
  password?: string
  confirmPassword?: string
  birthDate?: string
  firstName?: string
  lastName?: string
  address?: string
  general?: string
  termsAccepted?: string
  dataSharingAccepted?: string
  dpaComplianceAccepted?: string
  communicationAccepted?: string
}

// Removed unused AuthError interface

// Error Boundary Component
class PatientSignUpErrorBoundary extends React.Component<
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
    console.error('PatientSignUp Error Boundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>We're sorry, but there was an error loading the sign-up form.</p>
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

const PatientSignUp: React.FC = React.memo(() => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    email: '', phone: '', password: '', confirmPassword: '', birthDate: '',
    firstName: '', lastName: '', address: '', countryCode: '+63', remember: false,
    termsAccepted: false, dataSharingAccepted: false, dpaComplianceAccepted: false, communicationAccepted: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})
  const [isFormValid, setIsFormValid] = useState(false)
  // Removed unused lastActivity state
  const [formProgress, setFormProgress] = useState(0)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)

  const emailInputRef = useRef<HTMLInputElement>(null)
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Import input validator
  const inputValidator = useMemo(() => {
    try {
      if (typeof window !== 'undefined' && window.inputValidator) {
        return window.inputValidator;
      }
    } catch (error) {
      console.log('Input validator not available:', error);
    }
    return null;
  }, [])
  
  const isFormComplete = useMemo(() => 
    formData.email.trim() !== '' && formData.phone.trim() !== '' && 
    formData.password.length > 0 && formData.confirmPassword.length > 0 &&
    formData.birthDate !== '' && formData.firstName.trim() !== '' &&
    formData.lastName.trim() !== '' && formData.address.trim() !== '', 
    [formData]
  )



  useEffect(() => {
    const errors: ValidationErrors = {}
    
    if (formData.email.trim() && !emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    if (formData.phone.trim() && !phoneRegex.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number'
    }
    if (formData.password.length > 0 && formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters long'
    }
    if (formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    if (formData.firstName.trim() && !nameRegex.test(formData.firstName)) {
      errors.firstName = 'Please enter a valid first name'
    }
    if (formData.lastName.trim() && !nameRegex.test(formData.lastName)) {
      errors.lastName = 'Please enter a valid last name'
    }
    if (formData.birthDate) {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 13 || age > 120) {
        errors.birthDate = 'Please enter a valid birth date (age 13-120)'
      }
    }
    
    setValidationErrors(errors)
    setIsFormValid(Object.keys(errors).length === 0 && isFormComplete)
    
    // Calculate form progress
    const totalFields = 12 // email, phone, password, confirmPassword, birthDate, firstName, lastName, address, termsAccepted, dataSharingAccepted, dpaComplianceAccepted, communicationAccepted
    const filledFields = [
      formData.email.trim(),
      formData.phone.trim(),
      formData.password,
      formData.confirmPassword,
      formData.birthDate,
      formData.firstName.trim(),
      formData.lastName.trim(),
      formData.address.trim(),
      formData.termsAccepted,
      formData.dataSharingAccepted,
      formData.dpaComplianceAccepted,
      formData.communicationAccepted
    ].filter(Boolean).length
    
    setFormProgress(Math.round((filledFields / totalFields) * 100))
  }, [formData, inputValidator, isFormComplete])

  useEffect(() => {
    if (emailInputRef.current && !formData.email) {
      emailInputRef.current.focus()
    }
  }, [formData.email])

  useEffect(() => {
    try {
      if (formData.email || formData.firstName || formData.lastName || formData.remember) {
        if (window.secureSessionManager && typeof window.secureSessionManager.setSessionData === 'function') {
          window.secureSessionManager.setSessionData('patientSignUp_data', {
            email: formData.email, firstName: formData.firstName, 
            lastName: formData.lastName, countryCode: formData.countryCode, 
            remember: formData.remember
          })
        }
      }
    } catch (error) {
      console.log('Failed to save session data:', error);
    }
  }, [formData.email, formData.firstName, formData.lastName, formData.countryCode, formData.remember])

  useEffect(() => {
    try {
      if (window.secureSessionManager && typeof window.secureSessionManager.getSessionData === 'function') {
        const savedData = window.secureSessionManager.getSessionData('patientSignUp_data')
        if (savedData) {
          setFormData(prev => ({
            ...prev,
            email: savedData.email || '',
            firstName: savedData.firstName || '',
            lastName: savedData.lastName || '',
            countryCode: savedData.countryCode || '+63',
            remember: savedData.remember || false
          }))
        }
      }
    } catch (error) {
      console.log('Failed to load session data:', error);
    }
  }, [])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
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

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword(prev => !prev)
    // Focus back to confirm password input after toggle
    setTimeout(() => {
      confirmPasswordInputRef.current?.focus()
    }, 100)
  }, [])

  const validateForm = useCallback((): ValidationErrors => {
    const errors: ValidationErrors = {}

    if (!inputValidator) {
      // Fallback validation if input validator is not available
      if (!formData.email.trim()) {
        errors.email = 'Email is required'
      }
      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required'
      }
      if (!formData.password) {
        errors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long'
      }
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Please confirm your password'
      } else if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match'
      }
      return errors
    }

    // Use input validator for comprehensive validation
    try {
      const emailValidation = inputValidator.validateEmail(formData.email)
      if (!emailValidation.valid) {
        errors.email = emailValidation.error
      }

      const phoneValidation = inputValidator.validatePhone(formData.phone)
      if (!phoneValidation.valid) {
        errors.phone = phoneValidation.error
      }

      const passwordValidation = inputValidator.validatePassword(formData.password)
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.error
      }
    } catch (error) {
      console.log('Input validator failed, using fallback validation:', error);
      // Fallback to basic validation
      if (!formData.email.trim()) {
        errors.email = 'Email is required'
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Please enter a valid email address'
      }
      if (!formData.phone.trim()) {
        errors.phone = 'Phone number is required'
      } else if (!phoneRegex.test(formData.phone)) {
        errors.phone = 'Please enter a valid phone number'
      }
      if (!formData.password) {
        errors.password = 'Password is required'
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters long'
      }
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.birthDate) {
      errors.birthDate = 'Birth date is required'
    } else {
      const birthDate = new Date(formData.birthDate)
      const today = new Date()
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age < 13 || age > 120) {
        errors.birthDate = 'Please enter a valid birth date (age 13-120)'
      }
    }

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    } else if (!nameRegex.test(formData.firstName)) {
      errors.firstName = 'Please enter a valid first name'
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    } else if (!nameRegex.test(formData.lastName)) {
      errors.lastName = 'Please enter a valid last name'
    }

    if (!formData.address.trim()) {
      errors.address = 'Address is required'
    }

    if (!formData.termsAccepted) {
      errors.termsAccepted = 'You must accept the Terms of Service and Privacy Policy to proceed.'
    }
    if (!formData.dataSharingAccepted) {
      errors.dataSharingAccepted = 'You must consent to data sharing with healthcare facilities.'
    }
    if (!formData.dpaComplianceAccepted) {
      errors.dpaComplianceAccepted = 'You must acknowledge DPA compliance.'
    }
    if (!formData.communicationAccepted) {
      errors.communicationAccepted = 'You must agree to receive communications.'
    }

    return errors
  }, [formData, emailRegex, phoneRegex, nameRegex])

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

  const handleEmailSignUp = useCallback(async (e: React.FormEvent) => {
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
      // Create user with Custom Auth Service
      const user = await authService.registerWithEmail(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName
      })
      
      if (user) {
        console.log('Account created successfully:', user.email)

        
        showSuccess('Account created successfully! Welcome to Haliya!')

        
        showSuccess('Account created successfully! Please check your email for verification.')
        
        // Save successful registration time using secure session manager
        try {
          if (window.secureSessionManager && typeof window.secureSessionManager.setSessionData === 'function') {
            window.secureSessionManager.setSessionData('lastSuccessfulRegistration', new Date().toISOString())
          }
        } catch (error) {
          console.log('Failed to save registration time:', error);
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          navigate('/patient-portal')
        }, 2000)
      }
      
    } catch (error: any) {
      console.error('Sign up error:', error)
      
      showError(error.message || 'Sign up failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [formData.email, formData.password, validateForm, showError, showSuccess, navigate])

  const handleGoogleSignUp = useCallback(async () => {
    showError('Google sign-up is no longer supported. Please use email and password.')
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

  useEffect(() => {
    if (errorMessage) {
      const liveRegion = document.getElementById('live-region')
      if (liveRegion) {
        liveRegion.textContent = `Error: ${errorMessage}`
      }
    }
  }, [errorMessage])

  return (
    <PatientSignUpErrorBoundary>
      <div className="signup-container" role="main" aria-label="Patient Sign Up">
        {/* Accessibility live region */}
        <div id="live-region" aria-live="assertive" aria-atomic="true" className="sr-only"></div>
        
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
              <h1 style={{ color: 'var(--primary-blue)' }}>Hey there</h1>
              <p>Already know Haliya? <a href="/patient-sign-in" className="login-link">Log in</a></p>
            </div>

            <form 
              ref={formRef}
              onSubmit={handleEmailSignUp} 
              className="signup-form"
              aria-label="Sign up form"
              noValidate
            >
              {/* Form Progress Indicator */}
              <div className="form-progress" role="progressbar" aria-valuenow={formProgress} aria-valuemin={0} aria-valuemax={100}>
                <div className="progress-bar" style={{ width: `${formProgress}%` }}></div>
                <span className="progress-text">{formProgress}% Complete</span>
              </div>
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
                <label htmlFor="phone">Phone Number</label>
                <div className="phone-input">
                  <select 
                    className="country-code" 
                    id="countryCode" 
                    name="countryCode"
                    value={formData.countryCode}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    aria-label="Country code"
                  >
                    <option value="+63">🇵🇭 +63</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+49">🇩🇪 +49</option>
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+81">🇯🇵 +81</option>
                    <option value="+82">🇰🇷 +82</option>
                    <option value="+86">🇨🇳 +86</option>
                    <option value="+91">🇮🇳 +91</option>
                    <option value="+61">🇦🇺 +61</option>
                  </select>
                  <input 
                    type="tel" 
                    id="phone" 
                    name="phone" 
                    required 
                    autoComplete="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    aria-describedby={validationErrors.phone ? "phone-error" : undefined}
                    aria-invalid={!!validationErrors.phone}
                    placeholder="Enter your phone number"
                  />
                </div>
                {validationErrors.phone && (
                  <div id="phone-error" className="field-error" role="alert">
                    {validationErrors.phone}
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
                  autoComplete="new-password"
                  minLength={6}
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

              <div className="form-group">
                <label htmlFor="birthDate">Birth Date</label>
                <input 
                  type="date" 
                  id="birthDate" 
                  name="birthDate" 
                  required 
                  autoComplete="bday"
                  value={formData.birthDate}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  aria-describedby={validationErrors.birthDate ? "birthDate-error" : undefined}
                  aria-invalid={!!validationErrors.birthDate}
                />
                {validationErrors.birthDate && (
                  <div id="birthDate-error" className="field-error" role="alert">
                    {validationErrors.birthDate}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input 
                  type="text" 
                  id="firstName" 
                  name="firstName" 
                  required 
                  autoComplete="given-name"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  aria-describedby={validationErrors.firstName ? "firstName-error" : undefined}
                  aria-invalid={!!validationErrors.firstName}
                  placeholder="Enter your first name"
                />
                {validationErrors.firstName && (
                  <div id="firstName-error" className="field-error" role="alert">
                    {validationErrors.firstName}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input 
                  type="text" 
                  id="lastName" 
                  name="lastName" 
                  required 
                  autoComplete="family-name"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  aria-describedby={validationErrors.lastName ? "lastName-error" : undefined}
                  aria-invalid={!!validationErrors.lastName}
                  placeholder="Enter your last name"
                />
                {validationErrors.lastName && (
                  <div id="lastName-error" className="field-error" role="alert">
                    {validationErrors.lastName}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="address">Address</label>
                <input 
                  type="text" 
                  id="address" 
                  name="address" 
                  required 
                  autoComplete="street-address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  aria-describedby={validationErrors.address ? "address-error" : undefined}
                  aria-invalid={!!validationErrors.address}
                  placeholder="Enter your address"
                />
                {validationErrors.address && (
                  <div id="address-error" className="field-error" role="alert">
                    {validationErrors.address}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  required 
                  autoComplete="new-password"
                  minLength={6}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  ref={confirmPasswordInputRef}
                  disabled={isLoading}
                  aria-describedby={validationErrors.confirmPassword ? "confirmPassword-error" : undefined}
                  aria-invalid={!!validationErrors.confirmPassword}
                  placeholder="Confirm your password"
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  onClick={toggleConfirmPasswordVisibility}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  disabled={isLoading}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </button>
                {validationErrors.confirmPassword && (
                  <div id="confirmPassword-error" className="field-error" role="alert">
                    {validationErrors.confirmPassword}
                  </div>
                )}
              </div>

              {/* Terms and Conditions Section */}
              <div className="form-group terms-section">
                <div className="terms-header">
                  <h3>Terms and Conditions</h3>
                  <p className="terms-subtitle">Please read and accept the following terms before proceeding with your registration.</p>
                </div>
                
                <div className="terms-content">
                  <div className="terms-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="termsAccepted" 
                      name="termsAccepted"
                      checked={formData.termsAccepted}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      aria-describedby="terms-error"
                      aria-invalid={!!validationErrors.termsAccepted}
                    />
                    <label htmlFor="termsAccepted" className="terms-label">
                      I have read and agree to the <button 
                        type="button" 
                        className="terms-link" 
                        onClick={() => setShowTermsModal(true)}
                        disabled={isLoading}
                      >
                        Terms of Service
                      </button> and <button 
                        type="button" 
                        className="terms-link" 
                        onClick={() => setShowPrivacyModal(true)}
                        disabled={isLoading}
                      >
                        Privacy Policy
                      </button>
                    </label>
                    {validationErrors.termsAccepted && (
                      <div id="terms-error" className="field-error" role="alert">
                        {validationErrors.termsAccepted}
                      </div>
                    )}
                  </div>

                  <div className="terms-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="dataSharingAccepted" 
                      name="dataSharingAccepted"
                      checked={formData.dataSharingAccepted}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      aria-describedby="data-sharing-error"
                      aria-invalid={!!validationErrors.dataSharingAccepted}
                    />
                    <label htmlFor="dataSharingAccepted" className="terms-label">
                      I consent to share my personal and medical information with healthcare facilities I appoint for consultations and treatments. I understand this is necessary for proper medical care and treatment.
                    </label>
                    {validationErrors.dataSharingAccepted && (
                      <div id="data-sharing-error" className="field-error" role="alert">
                        {validationErrors.dataSharingAccepted}
                      </div>
                    )}
                  </div>

                  <div className="terms-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="dpaComplianceAccepted" 
                      name="dpaComplianceAccepted"
                      checked={formData.dpaComplianceAccepted}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      required
                      aria-describedby="dpa-compliance-error"
                      aria-invalid={!!validationErrors.dpaComplianceAccepted}
                    />
                    <label htmlFor="dpaComplianceAccepted" className="terms-label">
                      I acknowledge that Haliya complies with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173) and I understand my rights regarding the collection, use, and protection of my personal information.
                    </label>
                    {validationErrors.dpaComplianceAccepted && (
                      <div id="dpa-compliance-error" className="field-error" role="alert">
                        {validationErrors.dpaComplianceAccepted}
                      </div>
                    )}
                  </div>

                  <div className="terms-checkbox-group">
                    <input 
                      type="checkbox" 
                      id="communicationAccepted" 
                      name="communicationAccepted"
                      checked={formData.communicationAccepted}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      aria-describedby="communication-error"
                      aria-invalid={!!validationErrors.communicationAccepted}
                    />
                    <label htmlFor="communicationAccepted" className="terms-label">
                      I agree to receive communications from Haliya regarding my account, appointments, and healthcare services. I can opt out of marketing communications at any time.
                    </label>
                    {validationErrors.communicationAccepted && (
                      <div id="communication-error" className="field-error" role="alert">
                        {validationErrors.communicationAccepted}
                      </div>
                    )}
                  </div>
                </div>

                <div className="terms-footer">
                  <p className="terms-note">
                    <strong>Important:</strong> By checking these boxes, you acknowledge that your personal and medical information will be processed in accordance with the Philippine Data Privacy Act of 2012. 
                    You have the right to access, correct, and delete your personal information at any time through your account settings.
                  </p>
                </div>
              </div>

              <button 
                type="submit" 
                className="signup-btn" 
                disabled={isLoading || !isFormValid}
                aria-describedby={!isFormValid ? "form-validation-help" : undefined}
              >
                <span className="btn-text" style={{ display: isLoading ? 'none' : 'block' }}>
                  Sign Up
                </span>
                <div 
                  className="loading-spinner" 
                  style={{ display: isLoading ? 'block' : 'none' }}
                  aria-hidden="true"
                ></div>
              </button>
              {!isFormValid && (
                <div id="form-validation-help" className="sr-only">
                  Please fill in all required fields correctly to enable sign up
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
                <label htmlFor="remember">Remember me</label>
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

        {/* Terms of Service Modal */}
        {showTermsModal && (
          <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Terms of Service</h2>
                <button 
                  type="button" 
                  className="modal-close" 
                  onClick={() => setShowTermsModal(false)}
                  aria-label="Close terms of service"
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <h3>Haliya Terms of Service</h3>
                <p><strong>Effective Date:</strong> December 19, 2024</p>
                
                <h4>1. Acceptance of Terms</h4>
                <p>By accessing and using Haliya, you accept and agree to be bound by the terms and provision of this agreement.</p>
                
                <h4>2. Description of Service</h4>
                <p>Haliya is a digital healthcare platform that connects patients with healthcare facilities in the Philippines. Our services include appointment booking, medical consultation, and healthcare information management.</p>
                
                <h4>3. User Responsibilities</h4>
                <ul>
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account</li>
                  <li>Use the service for lawful purposes only</li>
                  <li>Respect the privacy and rights of other users</li>
                </ul>
                
                <h4>4. Healthcare Disclaimer</h4>
                <p>Haliya is a platform for connecting patients with healthcare providers. We do not provide medical advice, diagnosis, or treatment. Always consult with qualified healthcare professionals for medical concerns.</p>
                
                <h4>5. Limitation of Liability</h4>
                <p>Haliya shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
                
                <h4>6. Modifications</h4>
                <p>We reserve the right to modify these terms at any time. Continued use of the service constitutes acceptance of modified terms.</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="modal-btn" 
                  onClick={() => setShowTermsModal(false)}
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Policy Modal */}
        {showPrivacyModal && (
          <div className="modal-overlay" onClick={() => setShowPrivacyModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Privacy Policy</h2>
                <button 
                  type="button" 
                  className="modal-close" 
                  onClick={() => setShowPrivacyModal(false)}
                  aria-label="Close privacy policy"
                >
                  ×
                </button>
              </div>
              <div className="modal-body">
                <h3>Haliya Privacy Policy</h3>
                <p><strong>Effective Date:</strong> December 19, 2024</p>
                
                <h4>1. Information We Collect</h4>
                <ul>
                  <li><strong>Personal Information:</strong> Name, email, phone number, address, birth date</li>
                  <li><strong>Medical Information:</strong> Health conditions, medical history, appointment records</li>
                  <li><strong>Usage Data:</strong> How you interact with our platform</li>
                </ul>
                
                <h4>2. How We Use Your Information</h4>
                <ul>
                  <li>Provide healthcare services and appointment booking</li>
                  <li>Connect you with healthcare facilities</li>
                  <li>Send important notifications about your health</li>
                  <li>Improve our services and user experience</li>
                </ul>
                
                <h4>3. Information Sharing</h4>
                <p>Your personal and medical information will be shared with healthcare facilities you appoint for consultations and treatments. This sharing is necessary for proper medical care and is done with your explicit consent.</p>
                
                <h4>4. Philippine Data Privacy Act of 2012 Compliance</h4>
                <p>Haliya fully complies with Republic Act No. 10173 (Data Privacy Act of 2012). You have the following rights:</p>
                <ul>
                  <li><strong>Right to Access:</strong> View your personal information</li>
                  <li><strong>Right to Correction:</strong> Update inaccurate information</li>
                  <li><strong>Right to Erasure:</strong> Delete your personal information</li>
                  <li><strong>Right to Data Portability:</strong> Transfer your data</li>
                  <li><strong>Right to Object:</strong> Object to data processing</li>
                </ul>
                
                <h4>5. Data Security</h4>
                <p>We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.</p>
                
                <h4>6. Data Retention</h4>
                <p>We retain your personal information only for as long as necessary to provide our services and comply with legal obligations.</p>
                
                <h4>7. Contact Information</h4>
                <p>For privacy-related inquiries, contact our Data Protection Officer at:</p>
                <p>Email: privacy@lingaplink.ph<br/>
                Address: Makati City, Philippines</p>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="modal-btn" 
                  onClick={() => setShowPrivacyModal(false)}
                >
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientSignUpErrorBoundary>
  )
})

PatientSignUp.displayName = 'PatientSignUp'

export default PatientSignUp 