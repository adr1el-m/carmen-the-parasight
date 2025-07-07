// Patient Portal JavaScript - Healthcare Patient Dashboard

// Import required services
import authService from '../services/auth-service.js';
import { getCurrentPatientData, getPatientData } from '../services/firestoredb.js';

class PatientPortal {
    constructor() {
        this.currentSection = 'dashboard';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.calendarEventListeners = new Map(); // Track calendar event listeners
        this.patientData = null;
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        try {
            await this.loadUserData();
            this.setupEventListeners();
            this.setupCalendar();
            this.setupFormHandlers();
            this.setupTabHandlers();
            this.setupModalHandlers();
        } catch (error) {
            console.error('Initialization failed:', error);
            this.handleError(error);
        }
    }

    async loadUserData() {
        try {
            console.log('Loading user data...');
            this.showLoading('Loading patient information...');
            
            // Wait for auth state to settle
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Get current user
            const user = authService.getCurrentUser();
            
            if (!user) {
                console.log('No user found, auth guard will handle redirect');
                return;
            }

            console.log('User authenticated:', user.email);

            // Load patient data from Firestore
            let patientData = null;
            try {
                console.log('Loading patient data from Firestore...');
                patientData = await getPatientData(user.uid);
                
                // If no patient data exists, create it
                if (!patientData) {
                    console.log('No patient data found, creating new patient document...');
                    try {
                        const { createPatientDocument } = await import('../services/firestoredb.js');
                        await createPatientDocument(user, {
                            personalInfo: {
                                firstName: user.displayName ? user.displayName.split(' ')[0] : '',
                                lastName: user.displayName ? user.displayName.split(' ').slice(1).join(' ') : '',
                                fullName: user.displayName || user.email.split('@')[0]
                            }
                        });
                        
                        patientData = await getPatientData(user.uid);
                        console.log('Patient document created successfully');
                    } catch (createError) {
                        console.warn('Could not create patient document:', createError);
                    }
                }
            } catch (error) {
                console.warn('Could not load patient data from Firestore:', error);
            }

            this.displayUserInfo(user, patientData);
            this.hideLoading();
            
        } catch (error) {
            console.error('Error loading user data:', error);
            this.hideLoading();
            
            // Fallback to basic user info
            const user = authService.getCurrentUser();
            if (user) {
                this.displayUserInfo(user, null);
            } else {
                this.displayFallbackUserInfo();
            }
        }
    }

    displayUserInfo(user, patientData) {
        try {
            // Get user's name
            let firstName = '';
            let lastName = '';
            let fullName = '';

            if (patientData && patientData.personalInfo) {
                firstName = patientData.personalInfo.firstName || '';
                lastName = patientData.personalInfo.lastName || '';
                fullName = patientData.personalInfo.fullName || '';
            }

            // Fallback to Auth displayName
            if (!fullName && user.displayName) {
                const nameParts = user.displayName.split(' ');
                firstName = nameParts[0] || '';
                lastName = nameParts.slice(1).join(' ') || '';
                fullName = user.displayName;
            }

            // Final fallback to email
            if (!fullName) {
                fullName = user.email.split('@')[0];
                firstName = fullName;
            }

            // Update UI elements
            this.updateUserElements(firstName, lastName, fullName, user.email, patientData);

        } catch (error) {
            console.error('Error displaying user info:', error);
            this.displayFallbackUserInfo();
        }
    }

    updateUserElements(firstName, lastName, fullName, email, patientData) {
        // Update patient name in header
        const patientNameElement = document.getElementById('patientName');
        if (patientNameElement) {
            patientNameElement.textContent = firstName;
        }

        const patientDisplayNameElement = document.getElementById('patientDisplayName');
        if (patientDisplayNameElement) {
            patientDisplayNameElement.textContent = firstName;
        }

        // Update profile information
        const elements = {
            fullName: fullName,
            emailAddress: email,
            phoneNumber: patientData?.personalInfo?.phone || 'Not provided',
            dateOfBirth: patientData?.personalInfo?.dateOfBirth || 'Not provided',
            bio: patientData?.personalInfo?.bio || 'Patient'
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                    element.textContent = value;
            }
        });

        // Calculate and display age if DOB is available
        if (patientData?.personalInfo?.dateOfBirth) {
            const age = this.calculateAge(patientData.personalInfo.dateOfBirth);
            const ageElement = document.getElementById('age');
            if (ageElement) {
                ageElement.textContent = age;
            }
        }

        // Update profile name with gender tag
        const profileNameElement = document.querySelector('.profile-name');
        if (profileNameElement) {
            const genderTag = profileNameElement.querySelector('.gender-tag');
            const genderText = genderTag ? genderTag.outerHTML : '(Patient)';
            profileNameElement.innerHTML = `${fullName} <span class="gender-tag">${genderText}</span>`;
        }
        
        // Update user avatar initials
        const userAvatarElements = document.querySelectorAll('.user-avatar span, .profile-avatar-placeholder span');
        userAvatarElements.forEach(element => {
            const initials = this.getInitials(firstName, lastName, fullName);
            element.textContent = initials;
        });
    }

    getInitials(firstName, lastName, fullName) {
        if (firstName && lastName) {
            return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
        } else if (fullName) {
            const nameParts = fullName.split(' ');
            if (nameParts.length >= 2) {
                return (nameParts[0].charAt(0) + nameParts[1].charAt(0)).toUpperCase();
                    } else {
                return fullName.charAt(0).toUpperCase();
            }
        }
        return 'U';
    }

    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    displayFallbackUserInfo() {
        const patientNameElement = document.getElementById('patientName');
        if (patientNameElement) {
            patientNameElement.textContent = 'Patient';
        }

        const patientDisplayNameElement = document.getElementById('patientDisplayName');
        if (patientDisplayNameElement) {
            patientDisplayNameElement.textContent = 'Patient';
        }
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                
                if (section === 'logout') {
                    this.handleLogout();
                } else if (section) {
                    this.switchSection(section);
                }
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
                this.handleAction(actionType, e.target);
            });
        });

        // General buttons
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.handleButtonClick(e.target);
            });
        });

        // FAQ interactions
        document.querySelectorAll('.faq-question').forEach(question => {
            question.addEventListener('click', () => {
                const faqItem = question.closest('.faq-item');
                if (faqItem) {
                    faqItem.classList.toggle('expanded');
                }
            });
        });

        // Help categories
        document.querySelectorAll('.help-category').forEach(category => {
            category.addEventListener('click', () => {
                const categoryName = category.querySelector('h3');
                if (categoryName) {
                    this.showNotification(`Opening help for: ${categoryName.textContent}`);
                }
            });
        });

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }
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
            
        const navLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (navLink && navLink.parentNode) {
            navLink.parentNode.classList.add('active');
        }

        this.currentSection = sectionName;

        // Load section-specific data
        this.loadSectionData(sectionName);
    }

    setupTabHandlers() {
        document.querySelectorAll('.tab-btn').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target);
            });
        });
    }

    switchTab(clickedTab) {
        const tabContainer = clickedTab.parentNode;
        
        if (!tabContainer) return;
        
        // Remove active class from all tabs
        tabContainer.querySelectorAll('.tab-btn').forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to clicked tab
        clickedTab.classList.add('active');

        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });

        // Show corresponding tab content
        const tabType = clickedTab.dataset.tab;
        if (tabType) {
            const tabContent = document.getElementById(`${tabType}-tab`);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        }
    }

    setupCalendar() {
        this.updateCalendarDisplay();
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

        this.generateCalendarDays();
    }

    generateCalendarDays() {
        const calendarGrid = document.getElementById('calendarDays');
        if (!calendarGrid) return;

        this.cleanupCalendarEventListeners();
        calendarGrid.innerHTML = '';

        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const startDate = new Date(firstDay);
        
        // Adjust to start from Sunday
        startDate.setDate(startDate.getDate() - firstDay.getDay());

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

        // Add appointment indicators for sample dates
        if (isCurrentMonth && (date.getDate() === 22 || date.getDate() === 25)) {
            const indicator = document.createElement('div');
            indicator.classList.add('appointment-indicator');
            dayElement.appendChild(indicator);
        }

        dayElement.appendChild(dayNumber);

        const clickHandler = () => {
            this.selectCalendarDay(date, dayElement);
        };
        
        dayElement.addEventListener('click', clickHandler);
        this.calendarEventListeners.set(dayElement, clickHandler);

        return dayElement;
    }

    cleanupCalendarEventListeners() {
        this.calendarEventListeners.forEach((handler, element) => {
            element.removeEventListener('click', handler);
        });
        this.calendarEventListeners.clear();
    }

    selectCalendarDay(date, element) {
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.classList.remove('selected');
        });

        element.classList.add('selected');
        this.showDayDetails(date);
    }

    showDayDetails(date) {
        console.log('Selected date:', date);
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
        
        if (text.includes('book') || text.includes('schedule')) {
            return 'book-appointment';
        } else if (text.includes('video') || text.includes('join')) {
            return 'join-video';
        } else if (text.includes('reschedule')) {
            return 'reschedule';
        } else if (text.includes('download')) {
            return 'download';
        } else if (text.includes('upload')) {
            return 'upload';
        } else if (text.includes('edit')) {
            return 'edit';
        } else if (text.includes('view')) {
            return 'view';
        } else if (text.includes('refill')) {
            return 'refill-prescription';
        }
        
        return 'unknown';
    }

    handleAction(actionType, element) {
        switch (actionType) {
            case 'book-appointment':
                this.showNotification('Opening appointment booking...');
                break;
            case 'join-video':
                this.showNotification('Joining video consultation...');
                break;
            case 'reschedule':
                this.showNotification('Opening reschedule options...');
                break;
            case 'download':
                this.showNotification('Starting download...');
                break;
            case 'upload':
                this.showNotification('Opening file upload...');
                break;
            case 'edit':
                this.showNotification('Opening edit form...');
                break;
            case 'view':
                this.showNotification('Opening document viewer...');
                break;
            case 'refill-prescription':
                this.showNotification('Processing prescription refill...');
                break;
            default:
                this.showNotification('Action not recognized');
        }
    }

    handleButtonClick(element) {
        const btnId = element.id;

        if (btnId === 'editProfileBtn') {
            this.openEditProfileModal();
        } else if (btnId === 'saveProfile') {
            this.saveProfile();
        } else if (btnId === 'cancelEdit') {
            this.closeEditProfileModal();
        } else if (btnId === 'closeModal') {
            this.closeEditProfileModal();
        } else if (element.textContent.trim().toLowerCase().includes('change')) {
            this.showNotification('Password change functionality coming soon!');
        }
    }

    setupFormHandlers() {
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                this.handleToggleChange(e.target);
            });
        });
    }

    handleToggleChange(toggle) {
        const isChecked = toggle.checked;
        const toggleType = toggle.id;
        
        if (toggleType === 'notificationsToggle') {
            this.showNotification(`Notifications ${isChecked ? 'enabled' : 'disabled'}`, 'success');
        }
    }

    setupModalHandlers() {
        const modal = document.getElementById('editProfileModal');
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelEdit');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeEditProfileModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeEditProfileModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeEditProfileModal();
                }
            });
        }
    }

    openEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
                    if (modal) {
                        this.populateEditForm();
            modal.style.display = 'flex';
        }
    }

    closeEditProfileModal() {
        const modal = document.getElementById('editProfileModal');
                    if (modal) {
                        modal.style.display = 'none';
                    }
    }

    populateEditForm() {
        const elements = {
            editFullName: 'fullName',
            editDateOfBirth: 'dateOfBirth',
            editPhoneNumber: 'phoneNumber',
            editEmailAddress: 'emailAddress',
            editBio: 'bio'
        };

        Object.entries(elements).forEach(([formId, displayId]) => {
            const formElement = document.getElementById(formId);
            const displayElement = document.getElementById(displayId);
            
            if (formElement && displayElement) {
                const value = displayElement.textContent;
                if (value && value !== '--/--/----' && value !== 'Loading...' && value !== 'Not provided') {
                    formElement.value = value;
                }
            }
        });
    }

    saveProfile() {
        const form = document.getElementById('profileForm');
        if (!form) {
            this.showNotification('Form not found!', 'error');
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        this.updateProfileDisplay(data);
        this.closeEditProfileModal();
        this.showNotification('Profile updated successfully!', 'success');

        console.log('Profile data:', data);
    }

    updateProfileDisplay(data) {
        const elements = {
            fullName: data.editFullName || '',
            dateOfBirth: data.editDateOfBirth || '',
            phoneNumber: data.editPhoneNumber || '',
            emailAddress: data.editEmailAddress || '',
            bio: data.editBio || ''
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element && value) {
                element.textContent = value;
            }
        });

        // Update name in header
        if (data.editFullName) {
            const firstName = data.editFullName.split(' ')[0];
            
            const patientName = document.getElementById('patientName');
            const patientDisplayName = document.getElementById('patientDisplayName');
            
            if (patientName) patientName.textContent = firstName;
            if (patientDisplayName) patientDisplayName.textContent = firstName;
        }
    }

    loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                console.log('Loading dashboard data...');
                break;
            case 'calendar':
                console.log('Loading calendar data...');
                this.updateCalendarDisplay();
                break;
            case 'profile':
                console.log('Loading profile data...');
                break;
            case 'help':
                console.log('Loading help data...');
                break;
        }
    }

    showLoading(message = 'Loading...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingMessage = document.getElementById('loadingMessage');
        
        if (loadingMessage) {
            loadingMessage.textContent = message;
        }
        
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                // Show loading notification
                this.showNotification('Logging out...', 'info');
                
                // Disable logout button to prevent multiple clicks
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.disabled = true;
                    logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Logging out...</span>';
                }
                
                // Import and call auth service logout
                const authServiceModule = await import('../services/auth-service.js');
                const authService = authServiceModule.default;
                
                // Call proper logout method
                await authService.logout();
                
                // Clear any cached data
                authService.forceClearAuthState();
                
                // Show success message
                this.showNotification('Logged out successfully. Redirecting...', 'success');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.href = '/public/patientSign-in.html';
                }, 1500);
                
            } catch (error) {
                console.error('Logout error:', error);
                
                // Reset logout button state
                const logoutBtn = document.getElementById('logoutBtn');
                if (logoutBtn) {
                    logoutBtn.disabled = false;
                    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> <span>Logout</span>';
                }
                
                // Show error notification
                this.showNotification('Logout failed. Please try again.', 'error');
            }
        }
    }

    handleError(error) {
        console.error('Patient Portal Error:', error);
        this.showNotification('An error occurred. Please try again.', 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

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
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }
}

// Initialize patient portal when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const patientPortal = new PatientPortal();
    
    // Make patient portal globally accessible for debugging
    window.patientPortal = patientPortal;
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
        if (window.patientPortal) {
            window.patientPortal.loadSectionData(window.patientPortal.currentSection);
        }
    }
});

// Handle window resize
window.addEventListener('resize', () => {
    if (window.patientPortal) {
        window.patientPortal.updateCalendarDisplay();
    }
}); 