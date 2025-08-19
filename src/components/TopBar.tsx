import React from 'react'

interface TopBarProps {
  onToggleSidebar: () => void
  isSidebarOpen: boolean
}

const TopBar: React.FC<TopBarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  return (
    <div className="top-bar">
      <button 
        className="mobile-menu-toggle" 
        onClick={onToggleSidebar}
        aria-label="Toggle navigation menu"
        aria-expanded={isSidebarOpen}
        aria-controls="sidebar-navigation"
      >
        <i className="fas fa-bars" aria-hidden="true"></i>
      </button>
    </div>
  )
}

export default React.memo(TopBar)



