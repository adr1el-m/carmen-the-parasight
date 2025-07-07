// Modern Healthcare Dashboard - LingapLink
// Enhanced functionality for business dashboard

class HealthcareDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMobileNavigation();
        this.animateStatNumbers();
        this.generateCalendar();
        this.initializeFAQ();
        this.setupSearchFunctionality();
        this.setupTabFunctionality();
        this.initializeTooltips();
        this.updateCurrentDateTime();
        this.loadDashboardData();
        
        // Update time every minute
        setInterval(() => {
            this.updateCurrentDateTime();
        }, 60000);
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                if (section && section !== 'logout') {
                    this.showSection(section);
                }
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Quick action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });

        // Calendar navigation
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentMonth--;
                if (this.currentMonth < 0) {
                    this.currentMonth = 11;
                    this.currentYear--;
                }
                this.generateCalendar();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentMonth++;
                if (this.currentMonth > 11) {
                    this.currentMonth = 0;
                    this.currentYear++;
                }
                this.generateCalendar();
            });
        }

        // Settings toggles
        document.querySelectorAll('.toggle-switch input').forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.handleSettingsChange(e.target);
            });
        });

        // Form submissions
        const saveButtons = document.querySelectorAll('.btn-primary');
        saveButtons.forEach(btn => {
            if (btn.textContent.includes('Save')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.handleSaveSettings();
                });
            }
        });

        // User avatar dropdown
        const userAvatar = document.getElementById('userAvatar');
        if (userAvatar) {
            userAvatar.addEventListener('click', () => {
                this.toggleUserMenu();
            });
        }

        // Notifications
        const notifications = document.querySelector('.notifications');
        if (notifications) {
            notifications.addEventListener('click', () => {
                this.showNotifications();
            });
        }

        // Language selector
        const languageSelect = document.getElementById('language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                this.changeLanguage(e.target.value);
            });
        }
    }

    setupMobileNavigation() {
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        if (mobileToggle && sidebar && sidebarOverlay) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                sidebarOverlay.classList.toggle('active');
            });

            sidebarOverlay.addEventListener('click', () => {
                sidebar.classList.remove('open');
                sidebarOverlay.classList.remove('active');
            });

            // Close mobile menu when clicking nav links
            document.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    if (window.innerWidth <= 1024) {
                        sidebar.classList.remove('open');
                        sidebarOverlay.classList.remove('active');
                    }
                });
            });
        }
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`)?.closest('.nav-item');
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        this.currentSection = sectionName;
        this.announcePageChange(sectionName);

        // Section-specific initialization
        if (sectionName === 'staff-scheduling') {
            this.generateCalendar();
        } else if (sectionName === 'help') {
            this.initializeFAQ();
        }
    }

    animateStatNumbers() {
        const statNumbers = document.querySelectorAll('.stat-number');
        
        statNumbers.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            const duration = 2000; // 2 seconds
            const increment = target / (duration / 16); // 60fps
            let current = 0;

            const updateNumber = () => {
                current += increment;
                if (current < target) {
                    stat.textContent = Math.floor(current).toLocaleString();
                    requestAnimationFrame(updateNumber);
                } else {
                    stat.textContent = target.toLocaleString();
                }
            };

            // Start animation when element is visible
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateNumber();
                        observer.unobserve(entry.target);
                    }
                });
            });

            observer.observe(stat);
        });
    }

    generateCalendar() {
        const calendarGrid = document.getElementById('calendarGrid');
        const currentMonthElement = document.getElementById('currentMonth');
        
        if (!calendarGrid || !currentMonthElement) return;

        // Update month display
        currentMonthElement.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;

        // Clear existing calendar
        calendarGrid.innerHTML = '';

        // Get first day of month and number of days
        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const today = new Date();

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.className = 'calendar-day prev-month';
            calendarGrid.appendChild(emptyDay);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.className = 'calendar-day';
            
            const dayNumber = document.createElement('span');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day;
            
            // Highlight today
            if (this.currentYear === today.getFullYear() && 
                this.currentMonth === today.getMonth() && 
                day === today.getDate()) {
                dayElement.classList.add('today');
            }

            // Add sample appointments (mock data)
            if (day % 3 === 0 || day % 7 === 0) {
                const appointmentCount = Math.floor(Math.random() * 4) + 1;
                const appointmentDot = document.createElement('div');
                appointmentDot.className = 'appointment-indicator';
                appointmentDot.textContent = appointmentCount;
                dayElement.appendChild(appointmentDot);
            }

            dayElement.appendChild(dayNumber);
            dayElement.addEventListener('click', () => {
                this.selectCalendarDay(day);
            });

            calendarGrid.appendChild(dayElement);
        }
    }

    selectCalendarDay(day) {
        // Remove previous selection
        document.querySelectorAll('.calendar-day.selected').forEach(el => {
            el.classList.remove('selected');
        });

        // Select clicked day
        event.target.closest('.calendar-day').classList.add('selected');
        
        // Show day details (mock functionality)
        this.showMessage('info', `Selected ${this.monthNames[this.currentMonth]} ${day}, ${this.currentYear}`);
    }

    initializeFAQ() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.closest('.faq-item');
                const isActive = faqItem.classList.contains('active');
                
                // Close all other FAQ items
                document.querySelectorAll('.faq-item').forEach(item => {
                    item.classList.remove('active');
                });
                
                // Toggle current item
                if (!isActive) {
                    faqItem.classList.add('active');
                }
            });
        });
    }

    setupSearchFunctionality() {
        const searchInputs = document.querySelectorAll('input[type="text"]');
        
        searchInputs.forEach(input => {
            if (input.placeholder.includes('search') || input.placeholder.includes('Search')) {
                input.addEventListener('input', (e) => {
                    this.handleSearch(e.target.value, e.target);
                });
            }
        });
    }

    handleSearch(query, inputElement) {
        if (query.length < 2) return;

        // Determine search context based on input location
        const section = inputElement.closest('.content-section');
        const sectionId = section?.id;

        switch (sectionId) {
            case 'patient-records-section':
                this.searchPatients(query);
                break;
            case 'appointments-section':
                this.searchAppointments(query);
                break;
            case 'help-section':
                this.searchHelp(query);
                break;
            default:
                this.globalSearch(query);
        }
    }

    searchPatients(query) {
        const patientCards = document.querySelectorAll('.record-card');
        
        patientCards.forEach(card => {
            const patientName = card.querySelector('.patient-info h4')?.textContent.toLowerCase();
            const patientId = card.querySelector('.patient-info p')?.textContent.toLowerCase();
            
            if (patientName?.includes(query.toLowerCase()) || patientId?.includes(query.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    searchAppointments(query) {
        const appointmentCards = document.querySelectorAll('.appointment-card');
        
        appointmentCards.forEach(card => {
            const doctorName = card.querySelector('.doctor-details h4')?.textContent.toLowerCase();
            const patientName = card.querySelector('.patient-details h5')?.textContent.toLowerCase();
            
            if (doctorName?.includes(query.toLowerCase()) || patientName?.includes(query.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    searchHelp(query) {
        const helpCategories = document.querySelectorAll('.help-category');
        const faqItems = document.querySelectorAll('.faq-item');
        
        helpCategories.forEach(category => {
            const title = category.querySelector('h4')?.textContent.toLowerCase();
            const description = category.querySelector('p')?.textContent.toLowerCase();
            
            if (title?.includes(query.toLowerCase()) || description?.includes(query.toLowerCase())) {
                category.style.display = 'block';
            } else {
                category.style.display = 'none';
            }
        });

        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question span')?.textContent.toLowerCase();
            const answer = item.querySelector('.faq-answer p')?.textContent.toLowerCase();
            
            if (question?.includes(query.toLowerCase()) || answer?.includes(query.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    setupTabFunctionality() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tabGroup = button.closest('.filter-tabs');
                const tabValue = button.getAttribute('data-tab');
                
                // Update active tab
                tabGroup.querySelectorAll('.tab-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                button.classList.add('active');
                
                // Filter content based on tab
                this.filterContentByTab(tabValue, button);
            });
        });
    }

    filterContentByTab(tabValue, buttonElement) {
        const section = buttonElement.closest('.content-section');
        
        if (section.id === 'patient-records-section') {
            this.filterPatientRecords(tabValue);
        } else if (section.id === 'appointments-section') {
            this.filterAppointments(tabValue);
        }
    }

    filterPatientRecords(filter) {
        // Mock filtering logic
        const records = document.querySelectorAll('.record-card');
        
        records.forEach(record => {
            switch (filter) {
                case 'recent':
                    // Show only recent visits
                    record.style.display = Math.random() > 0.5 ? 'block' : 'none';
                    break;
                case 'upcoming':
                    // Show only upcoming appointments
                    record.style.display = Math.random() > 0.7 ? 'block' : 'none';
                    break;
                default:
                    record.style.display = 'block';
            }
        });
    }

    filterAppointments(filter) {
        // Mock filtering logic
        const appointments = document.querySelectorAll('.appointment-card');
        
        appointments.forEach(appointment => {
            switch (filter) {
                case 'today':
                    appointment.style.display = Math.random() > 0.6 ? 'block' : 'none';
                    break;
                case 'past':
                    appointment.style.display = Math.random() > 0.8 ? 'block' : 'none';
                    break;
                case 'cancelled':
                    appointment.style.display = 'none';
                    break;
                default:
                    appointment.style.display = 'block';
            }
        });
    }

    handleQuickAction(action) {
        switch (action) {
            case 'add-patient':
                this.showMessage('info', 'Add Patient form would open here');
                break;
            case 'schedule':
                this.showSection('appointments');
                this.showMessage('info', 'Switched to Appointments section');
                break;
            case 'add-staff':
                this.showMessage('info', 'Add Staff Member form would open here');
                break;
            case 'reports':
                this.showMessage('info', 'Reports dashboard would open here');
                break;
        }
    }

    handleSettingsChange(toggle) {
        const setting = toggle.id;
        const isEnabled = toggle.checked;
        
        this.showMessage('success', `${setting} has been ${isEnabled ? 'enabled' : 'disabled'}`);
        
        // Store setting in localStorage
        localStorage.setItem(`dashboard_${setting}`, isEnabled);
    }

    handleSaveSettings() {
        this.showLoadingOverlay('Saving settings...');
        
        // Simulate API call
        setTimeout(() => {
            this.hideLoadingOverlay();
            this.showMessage('success', 'Settings saved successfully!');
        }, 1500);
    }

    handleLogout() {
        this.showLoadingOverlay('Signing out...');
        
        // Simulate logout process
        setTimeout(() => {
            localStorage.removeItem('dashboard_user');
            window.location.href = '/public/businessSignIn.html';
        }, 1500);
    }

    initializeTooltips() {
        const elementsWithTooltips = document.querySelectorAll('[title]');
        
        elementsWithTooltips.forEach(element => {
            element.addEventListener('mouseenter', (e) => {
                this.showTooltip(e.target, e.target.getAttribute('title'));
            });
            
            element.addEventListener('mouseleave', () => {
                this.hideTooltip();
            });
        });
    }

    showTooltip(element, text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        tooltip.id = 'dashboard-tooltip';
        
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'absolute';
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 8}px`;
        tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2)}px`;
    }

    hideTooltip() {
        const tooltip = document.getElementById('dashboard-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    updateCurrentDateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        // Update any time displays
        const timeElements = document.querySelectorAll('.current-time');
        timeElements.forEach(element => {
            element.textContent = timeString;
        });
    }

    loadDashboardData() {
        // Simulate loading dashboard data
        this.showLoadingOverlay('Loading dashboard...');
        
        setTimeout(() => {
            this.populateDashboardData();
            this.hideLoadingOverlay();
        }, 2000);
    }

    populateDashboardData() {
        // Populate organization name
        const orgName = document.getElementById('organizationName');
        if (orgName) {
            orgName.textContent = 'Manila Medical Center';
        }

        // Populate user initials
        const userInitials = document.getElementById('userInitials');
        if (userInitials) {
            userInitials.textContent = 'MMC';
        }

        // Add any other dynamic data population here
    }

    toggleUserMenu() {
        // Implement user menu dropdown
        const existingMenu = document.querySelector('.user-dropdown');
        
        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const userMenu = document.createElement('div');
        userMenu.className = 'user-dropdown';
        userMenu.innerHTML = `
            <div class="dropdown-item" onclick="dashboard.editProfile()">
                <i class="fas fa-user"></i>
                Edit Profile
            </div>
            <div class="dropdown-item" onclick="dashboard.showSettings()">
                <i class="fas fa-cog"></i>
                Settings
            </div>
            <div class="dropdown-item" onclick="dashboard.handleLogout()">
                <i class="fas fa-sign-out-alt"></i>
                Logout
            </div>
        `;

        const userAvatar = document.getElementById('userAvatar');
        userAvatar.appendChild(userMenu);

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                if (!userAvatar.contains(e.target)) {
                    userMenu.remove();
                }
            }, { once: true });
        }, 100);
    }

    showNotifications() {
        this.showMessage('info', 'Notifications panel would open here');
    }

    changeLanguage(language) {
        this.showMessage('info', `Language changed to ${language.toUpperCase()}`);
        localStorage.setItem('dashboard_language', language);
    }

    editProfile() {
        this.showMessage('info', 'Profile editing would open here');
    }

    showSettings() {
        this.showSection('virtual-care');
    }

    // Utility Methods
    showMessage(type, text) {
        const messageContainer = document.getElementById('messageContainer');
        const message = messageContainer.querySelector('.message');
        const messageText = message.querySelector('.message-text');
        const messageIcon = message.querySelector('.message-icon');

        // Set message content
        messageText.textContent = text;
        
        // Set icon based on type
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        messageIcon.className = `message-icon ${icons[type] || icons.info}`;
        message.className = `message ${type}`;
        
        // Show message
        messageContainer.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            messageContainer.style.display = 'none';
        }, 5000);

        // Close button functionality
        const closeBtn = message.querySelector('.message-close');
        closeBtn.onclick = () => {
            messageContainer.style.display = 'none';
        };
    }

    showLoadingOverlay(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const loadingMessage = document.getElementById('loadingMessage');
        
        if (overlay && loadingMessage) {
            loadingMessage.textContent = message;
            overlay.style.display = 'flex';
        }
    }

    hideLoadingOverlay() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    announcePageChange(sectionName) {
        const liveRegion = document.getElementById('live-region');
        if (liveRegion) {
            liveRegion.textContent = `Switched to ${sectionName} section`;
        }
    }

    globalSearch(query) {
        // Global search across all sections
        this.showMessage('info', `Searching for "${query}" across all sections...`);
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new HealthcareDashboard();
});

// Export for global access
window.HealthcareDashboard = HealthcareDashboard; 