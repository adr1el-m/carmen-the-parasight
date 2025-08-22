import React, { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/index.css'

const QuickAppoinments: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    preferredDate: '',
    preferredTime: '',
    facility: '',
    specialty: '',
    symptoms: '',
    urgency: 'normal'
  })

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    // Here you would typically send the data to your backend
    // For now, we'll just show a success message and redirect
    alert('Quick appointment request submitted successfully! We will contact you within 24 hours.')
    navigate('/')
  }, [navigate])

  const handleBackToHome = useCallback(() => {
    navigate('/')
  }, [navigate])

  return (
    <div className="quick-appointments-container">
      <div className="container">
        <div className="quick-appointments-header">
          <button 
            onClick={handleBackToHome}
            className="back-btn"
            aria-label="Return to home page"
          >
            <i className="fas fa-arrow-left" aria-hidden="true"></i>
            Back to Home
          </button>
          <h1>Quick Appointment Request</h1>
          <p>Need an appointment fast? Fill out this form and we'll get back to you within 24 hours.</p>
        </div>

        <form onSubmit={handleSubmit} className="quick-appointment-form">
          <div className="form-section">
            <h2>Personal Information</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your first name"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your last name"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your email address"
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Appointment Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="facility">Preferred Facility</label>
                <select
                  id="facility"
                  name="facility"
                  value={formData.facility}
                  onChange={handleInputChange}
                >
                  <option value="">Select a facility</option>
                  <option value="slmc">St. Luke's Medical Center</option>
                  <option value="tmc">The Medical City</option>
                  <option value="ahmc">Asian Hospital and Medical Center</option>
                  <option value="any">Any available facility</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="specialty">Medical Specialty</label>
                <select
                  id="specialty"
                  name="specialty"
                  value={formData.specialty}
                  onChange={handleInputChange}
                >
                  <option value="">Select specialty</option>
                  <option value="general">General Medicine</option>
                  <option value="cardiology">Cardiology</option>
                  <option value="orthopedics">Orthopedics</option>
                  <option value="pediatrics">Pediatrics</option>
                  <option value="dermatology">Dermatology</option>
                  <option value="neurology">Neurology</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="preferredDate">Preferred Date</label>
                <input
                  type="date"
                  id="preferredDate"
                  name="preferredDate"
                  value={formData.preferredDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="form-group">
                <label htmlFor="preferredTime">Preferred Time</label>
                <select
                  id="preferredTime"
                  name="preferredTime"
                  value={formData.preferredTime}
                  onChange={handleInputChange}
                >
                  <option value="">Select time</option>
                  <option value="morning">Morning (8AM - 12PM)</option>
                  <option value="afternoon">Afternoon (12PM - 5PM)</option>
                  <option value="evening">Evening (5PM - 8PM)</option>
                  <option value="any">Any available time</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="urgency">Urgency Level</label>
              <select
                id="urgency"
                name="urgency"
                value={formData.urgency}
                onChange={handleInputChange}
              >
                <option value="normal">Normal - Schedule within a week</option>
                <option value="urgent">Urgent - Within 2-3 days</option>
                <option value="emergency">Emergency - Same day if possible</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="symptoms">Symptoms or Reason for Visit</label>
              <textarea
                id="symptoms"
                name="symptoms"
                value={formData.symptoms}
                onChange={handleInputChange}
                rows={4}
                placeholder="Please describe your symptoms or reason for the appointment..."
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={handleBackToHome} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Submit Quick Appointment Request
            </button>
          </div>
        </form>

        <div className="quick-appointments-info">
          <h3>What happens next?</h3>
          <div className="info-steps">
            <div className="info-step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Submit Request</h4>
                <p>Fill out this form with your appointment details</p>
              </div>
            </div>
            <div className="info-step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>We'll Contact You</h4>
                <p>Our team will reach out within 24 hours to confirm details</p>
              </div>
            </div>
            <div className="info-step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Get Confirmed</h4>
                <p>Receive your confirmed appointment time and facility</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuickAppoinments
