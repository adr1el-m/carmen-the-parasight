import React from 'react'

interface LoadingOverlayProps {
  isLoading: boolean
  isLoadingPatientData: boolean
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ isLoading, isLoadingPatientData }) => {
  if (!isLoading && !isLoadingPatientData) return null

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-message">Loading your health dashboard...</p>
        <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          {isLoading ? 'Checking authentication...' : 'Loading patient data...'}
        </p>
      </div>
    </div>
  )
}

export default React.memo(LoadingOverlay)







