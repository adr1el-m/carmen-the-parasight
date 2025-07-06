// Dashboard JavaScript - Healthcare Management Dashboard

class HealthcareDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCalendar();
        this.loadDashboardData();
        this.setupFormHandlers();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                
                if (section === 'logout') {
                    this.handleLogout();
                } else {
                    this.switchSection(section);
                }
            });
        });

        // Tab buttons
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target);
            });
        });

        // Calendar navigation
        const prevBtn = document.querySelector('.prev-btn');
        const nextBtn = document.querySelector('.next-btn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousMonth());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextMonth());
        }

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const actionType = this.getActionType(e.target);
                this.handleAction(actionType);
            });
        });

        // Form buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const btnType = e.target.textContent.trim();
                this.handleFormAction(btnType, e.target);
            });
        });

        // Mobile menu toggle (for responsive)
        this.setupMobileMenu();
    }

    switchSection(sectionName) {
        if (sectionName === this.currentSection) return;

        // Hide current section
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show new section
        const newSection = document.getElementById(`${sectionName}-section`);
        if (newSection) {
            newSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`).parentNode;
        activeNavItem.classList.add('active');

        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    switchTab(clickedTab) {
        const tabContainer = clickedTab.parentNode;
        
        // Remove active class from all tabs in the same container
        tabContainer.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to clicked tab
        clickedTab.classList.add('active');

        // Handle tab-specific logic
        const tabType = clickedTab.dataset.tab;
        this.handleTabSwitch(tabType);
    }

    setupCalendar() {
        this.updateCalendarDisplay();
        this.setupCalendarInteractions();
    }

    updateCalendarDisplay() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        const monthDisplay = document.querySelector('.current-month');
        if (monthDisplay) {
            monthDisplay.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        }

        // Update calendar grid
        this.generateCalendarDays();
    }

    generateCalendarDays() {
        const calendarGrid = document.querySelector('.calendar-grid');
        if (!calendarGrid) return;

        // Clear existing calendar days
        calendarGrid.innerHTML = '';

        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        
        // Adjust to start from Monday
        startDate.setDate(startDate.getDate() - ((startDate.getDay() + 6) % 7));

        // Generate 42 days (6 weeks)
        for (let i = 0; i < 42; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayElement = this.createCalendarDay(currentDate);
            calendarGrid.appendChild(dayElement);
        }
    }

    createCalendarDay(date) {
        const dayElement = document.createElement('div');
        dayElement.classList.add('calendar-day');
        
        const isCurrentMonth = date.getMonth() === this.currentMonth;
        const isToday = this.isToday(date);
        
        if (!isCurrentMonth) {
            dayElement.classList.add('prev-month');
        }
        
        if (isToday) {
            dayElement.classList.add('today');
        }

        const dayNumber = document.createElement('span');
        dayNumber.classList.add('day-number');
        dayNumber.textContent = date.getDate();

        const timeSlots = document.createElement('div');
        timeSlots.classList.add('time-slots');

        // Add sample time slots for current month days
        if (isCurrentMonth && Math.random() > 0.3) {
            const slotsCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < slotsCount; i++) {
                const slot = document.createElement('span');
                slot.classList.add('time-slot');
                slot.textContent = String(i + 1).padStart(2, '0');
                timeSlots.appendChild(slot);
            }
        }

        dayElement.appendChild(dayNumber);
        dayElement.appendChild(timeSlots);

        dayElement.addEventListener('click', () => {
            this.selectCalendarDay(date, dayElement);
        });

        return dayElement;
    }

    setupCalendarInteractions() {
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', (e) => {
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
            });
        });
    }

    selectCalendarDay(date, element) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });

        // Add selection to clicked day
        element.classList.add('selected');

        // Show day details or allow actions
        this.showDayDetails(date);
    }

    showDayDetails(date) {
        // This would typically show appointment details for the selected day
        console.log('Selected date:', date);
        
        // You could implement a modal or sidebar showing day details
        this.showNotification(`Selected: ${date.toDateString()}`);
    }

    previousMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.updateCalendarDisplay();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.updateCalendarDisplay();
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    getActionType(element) {
        const text = element.textContent.trim().toLowerCase();
        const icon = element.querySelector('i');
        
        if (text.includes('edit') || (icon && icon.classList.contains('fa-edit'))) {
            return 'edit';
        } else if (text.includes('add') || text.includes('new') || (icon && icon.classList.contains('fa-plus'))) {
            return 'add';
        } else if (text.includes('view') || (icon && icon.classList.contains('fa-eye'))) {
            return 'view';
        } else if (text.includes('delete') || (icon && icon.classList.contains('fa-trash'))) {
            return 'delete';
        }
        
        return 'unknown';
    }

    handleAction(actionType) {
        switch (actionType) {
            case 'edit':
                this.showNotification('Edit functionality coming soon!');
                break;
            case 'add':
                this.showNotification('Add new item functionality coming soon!');
                break;
            case 'view':
                this.showNotification('View details functionality coming soon!');
                break;
            case 'delete':
                this.showNotification('Delete functionality coming soon!');
                break;
            default:
                this.showNotification('Action not recognized');
        }
    }

    handleFormAction(btnType, element) {
        switch (btnType.toLowerCase()) {
            case 'save':
                this.saveFormData(element);
                break;
            case 'reset':
                this.resetForm(element);
                break;
            case 'new patient':
            case 'new appointment':
                this.showNotification(`${btnType} functionality coming soon!`);
                break;
            default:
                // Handle other button types
                break;
        }
    }

    saveFormData(element) {
        const form = element.closest('form') || element.closest('.consult-form');
        if (!form) return;

        // Get form data
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        // Simulate save
        this.showNotification('Settings saved successfully!', 'success');
        
        // You would typically send this data to your server
        console.log('Form data:', data);
    }

    resetForm(element) {
        const form = element.closest('form') || element.closest('.consult-form');
        if (!form) return;

        // Reset form fields
        form.reset();
        this.showNotification('Form reset successfully!', 'info');
    }

    setupFormHandlers() {
        // Handle radio buttons
        document.querySelectorAll('input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.handleRadioChange(e.target);
            });
        });

        // Handle checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleCheckboxChange(e.target);
            });
        });

        // Handle select dropdowns
        document.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', (e) => {
                this.handleSelectChange(e.target);
            });
        });
    }

    handleRadioChange(radio) {
        const availability = radio.value;
        console.log('Availability changed to:', availability);
        
        // Enable/disable related form elements based on availability
        const formElements = document.querySelectorAll('.checkbox-group input, .form-row input, .form-row select');
        formElements.forEach(element => {
            element.disabled = availability === 'disable';
        });
    }

    handleCheckboxChange(checkbox) {
        const consultType = checkbox.value;
        const isChecked = checkbox.checked;
        
        console.log(`${consultType} consultation:`, isChecked ? 'enabled' : 'disabled');
    }

    handleSelectChange(select) {
        const value = select.value;
        const name = select.name;
        
        console.log(`${name} changed to:`, value);
    }

    handleTabSwitch(tabType) {
        // Load different data based on tab
        switch (tabType) {
            case 'today':
                this.loadTodayRecords();
                break;
            case 'yesterday':
                this.loadYesterdayRecords();
                break;
            case 'past':
                this.loadPastRecords();
                break;
            case 'upcoming':
                this.loadUpcomingAppointments();
                break;
            case 'cancelled':
                this.loadCancelledAppointments();
                break;
            default:
                break;
        }
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'patient-records':
                this.loadPatientRecords();
                break;
            case 'availability':
                this.loadAvailabilityData();
                break;
            case 'consults':
                this.loadConsultsData();
                break;
            case 'online-consult':
                this.loadOnlineConsultSettings();
                break;
            case 'help':
                this.loadHelpData();
                break;
        }
    }

    loadDashboardData() {
        // This would typically load from API
        console.log('Loading dashboard data...');
        
        // Simulate loading stats
        this.updateStats({
            totalPatients: 2547,
            activeDoctors: 45,
            todaysAppointments: 128,
            onlineConsults: 34
        });
    }

    loadPatientRecords() {
        console.log('Loading patient records...');
        this.loadTodayRecords();
    }

    loadAvailabilityData() {
        console.log('Loading availability data...');
        this.updateCalendarDisplay();
    }

    loadConsultsData() {
        console.log('Loading consults data...');
        this.loadUpcomingAppointments();
    }

    loadOnlineConsultSettings() {
        console.log('Loading online consult settings...');
        // Load saved settings
    }

    loadHelpData() {
        console.log('Loading help data...');
        // Setup help interactions
        this.setupHelpInteractions();
    }

    loadTodayRecords() {
        console.log('Loading today\'s records...');
        // This would load from API
    }

    loadYesterdayRecords() {
        console.log('Loading yesterday\'s records...');
        // This would load from API
    }

    loadPastRecords() {
        console.log('Loading past records...');
        // This would load from API
    }

    loadUpcomingAppointments() {
        console.log('Loading upcoming appointments...');
        // This would load from API
    }

    loadCancelledAppointments() {
        console.log('Loading cancelled appointments...');
        // This would load from API
    }

    updateStats(stats) {
        const statCards = document.querySelectorAll('.stat-card');
        statCards.forEach((card, index) => {
            const valueElement = card.querySelector('h3');
            if (valueElement) {
                // Animate counter
                this.animateCounter(valueElement, Object.values(stats)[index]);
            }
        });
    }

    animateCounter(element, targetValue) {
        const startValue = 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentValue = Math.floor(startValue + (targetValue - startValue) * progress);
            element.textContent = currentValue.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    setupHelpInteractions() {
        // Setup FAQ interactions
        document.querySelectorAll('.faq-item').forEach(item => {
            item.addEventListener('click', () => {
                item.classList.toggle('expanded');
            });
        });

        // Setup help category interactions
        document.querySelectorAll('.help-category').forEach(category => {
            category.addEventListener('click', () => {
                const categoryName = category.querySelector('h3').textContent;
                this.showNotification(`Opening help for: ${categoryName}`);
            });
        });
    }

    setupMobileMenu() {
        // Add mobile menu toggle functionality
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        const sidebar = document.querySelector('.sidebar');

        if (mobileMenuToggle && sidebar) {
            mobileMenuToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            if (sidebar && sidebar.classList.contains('open')) {
                if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    sidebar.classList.remove('open');
                }
            }
        });
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Simulate logout
            this.showNotification('Logging out...', 'info');
            
            // Redirect to login page after delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '9999',
            maxWidth: '300px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        });

        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#10b981';
                break;
            case 'error':
                notification.style.backgroundColor = '#ef4444';
                break;
            case 'warning':
                notification.style.backgroundColor = '#f59e0b';
                break;
            default:
                notification.style.backgroundColor = '#0ea5e9';
        }

        // Add to document
        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new HealthcareDashboard();
    
    // Make dashboard globally accessible for debugging
    window.dashboard = dashboard;
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        // Refresh data when page becomes visible
        if (window.dashboard) {
            window.dashboard.loadSectionData(window.dashboard.currentSection);
        }
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.dashboard) {
        // Recalculate calendar layout if needed
        window.dashboard.updateCalendarDisplay();
    }
}); 