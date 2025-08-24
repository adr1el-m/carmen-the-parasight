import React from 'react'
import { formatTime, formatDateTime } from '../utils/dateUtils'

interface AppointmentCardProps {
  appointment: any
  onEdit: (appointment: any) => void
  onDelete: (appointmentId: string) => void
  formatTime: (time: string) => string
  formatDateTime: (dateTime: string) => string
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ 
  appointment, 
  onEdit, 
  onDelete, 
  formatTime, 
  formatDateTime
}) => {

  return (
    <div className={`appointment-card ${appointment.updatedBy === 'facility' ? 'has-modifications' : ''}`}>
      


      <div className="appointment-date">
        <span className="date">{new Date(appointment.date).getDate()}</span>
        <span className="month">{new Date(appointment.date).toLocaleDateString('en-US', { month: 'short' })}</span>
      </div>
      
      <div className="appointment-info">
        <h4>{appointment.doctor || 'Doctor TBD'}</h4>
        <p>{appointment.type || 'Consultation'}</p>
        <div className="appointment-time">{formatTime(appointment.time)}</div>
        <div className="appointment-facility">{appointment.facilityName || 'Facility TBD'}</div>
        
        {/* Show modification indicator if appointment was modified by facility */}
        {appointment.updatedBy === 'facility' && appointment.modificationHistory && appointment.modificationHistory.length > 0 && (
          <div className="appointment-modification-info">
            <div className="modification-indicator">
              <i className="fas fa-edit"></i>
              <span>Modified by {appointment.facilityName || 'Healthcare Facility'}</span>
            </div>
            <div className="modification-details">
              {appointment.modificationHistory[appointment.modificationHistory.length - 1]?.changes && (
                <div className="changes-list">
                  {Object.entries(appointment.modificationHistory[appointment.modificationHistory.length - 1].changes).map(([field, change]: [string, any]) => {
                    if (change && change.from !== change.to) {
                      return (
                        <div key={field} className="change-item">
                          <span className="change-field">{field.charAt(0).toUpperCase() + field.slice(1)}:</span>
                          <span className="change-from">{change.from}</span>
                          <i className="fas fa-arrow-right"></i>
                          <span className="change-to">{change.to}</span>
                        </div>
                      )
                    }
                    return null
                  })}
                </div>
              )}
              <small className="modification-time">
                Updated: {formatDateTime(appointment.updatedAt)}
              </small>
            </div>
          </div>
        )}
        
        {/* Show completion/cancellation timestamp */}
        {(appointment.status === 'completed' || appointment.status === 'cancelled') && appointment.updatedAt && (
          <div className="appointment-status-info">
            <small className="status-time">
              {appointment.status === 'completed' ? 'Completed' : 'Cancelled'}: {formatDateTime(appointment.updatedAt)}
            </small>
          </div>
        )}
      </div>
      
      <div className="appointment-actions">
        <div className={`status ${appointment.status}`}>
          {appointment.status === 'confirmed' ? 'Confirmed' : 
           appointment.status === 'pending' ? 'Pending' : 
           appointment.status === 'scheduled' ? 'Scheduled' : 
           appointment.status === 'completed' ? 'Completed' : 
           appointment.status === 'cancelled' ? 'Cancelled' : appointment.status}
        </div>
        <div className="action-buttons">
          {/* Only show edit/delete for upcoming appointments */}
          {['scheduled', 'confirmed', 'pending'].includes(appointment.status) && (
            <>
              <button 
                className="btn btn-outline btn-sm"
                onClick={() => onEdit(appointment)}
                title="Edit appointment"
                aria-label="Edit this appointment"
              >
                <i className="fas fa-edit" aria-hidden="true"></i>
                Edit
              </button>
              <button 
                className="btn btn-danger btn-sm"
                onClick={() => onDelete(appointment.id)}
                title="Delete appointment"
                aria-label="Delete this appointment"
              >
                <i className="fas fa-trash" aria-hidden="true"></i>
                Delete
              </button>
            </>
          )}
          {/* Show view details for completed/cancelled appointments */}
          {(appointment.status === 'completed' || appointment.status === 'cancelled') && (
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => onEdit(appointment)}
              title="View appointment details"
              aria-label="View appointment details"
            >
              <i className="fas fa-eye" aria-hidden="true"></i>
              View
              </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default React.memo(AppointmentCard)



