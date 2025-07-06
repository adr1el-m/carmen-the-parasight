// 🚀 FLAWLESS Patient Portal JavaScript - Ultimate Version
console.log('🎯 Patient Portal JavaScript loading...');

// Advanced Performance Observer
if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
                console.log(`⚡ ${entry.name}: ${entry.duration.toFixed(2)}ms`);
            }
        }
    });
    observer.observe({ entryTypes: ['measure'] });
}

// 🎯 FLAWLESS Navigation and UI Management
class PatientPortalUI {
    constructor() {
        this.currentSection = 'Dashboard';
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.isLoading = false;
        this.cache = new Map();
        this.observers = [];
        this.touchStartX = 0;
        this.touchStartY = 0;
        
        // Accessibility features
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
        
        // Performance tracking
        performance.mark('portal-start');
        
        this.init();
    }

    async init() {
        try {
            performance.mark('init-start');
            
            await this.setupAccessibility();
            await this.setupNavigation();
            await this.setupCalendar();
            await this.setupProfile();
            await this.setupHelp();
            await this.setupMobileMenu();
            await this.setupNotifications();
            await this.setupAdvancedFeatures();
            
            performance.mark('init-end');
            performance.measure('initialization', 'init-start', 'init-end');
            
            console.log('✅ Patient Portal initialized successfully');
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.handleError(error);
        }
    }

    // 🎯 FLAWLESS Accessibility Setup
    async setupAccessibility() {
        // Add skip link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Add main content ID
        const mainContent = document.querySelector('.main-container');
        if (mainContent) {
            mainContent.id = 'main-content';
            mainContent.setAttribute('tabindex', '-1');
        }

        // Setup keyboard navigation
        this.setupKeyboardNavigation();
        
        // Setup ARIA labels
        this.setupAriaLabels();
        
        // Setup focus management
        this.setupFocusManagement();
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // ESC key handling
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
            
            // Tab navigation enhancement
            if (e.key === 'Tab') {
                this.handleTabNavigation(e);
            }
            
            // Arrow key navigation for calendar
            if (e.target.classList.contains('calendar-day')) {
                this.handleCalendarArrowKeys(e);
            }
        });
    }

    setupAriaLabels() {
        // Add ARIA labels to interactive elements
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach((link, index) => {
            const sectionName = link.querySelector('span').textContent.trim();
            link.setAttribute('aria-label', `Navigate to ${sectionName}`);
            link.setAttribute('role', 'button');
        });

        // Calendar accessibility
        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(day => {
            if (!day.classList.contains('empty')) {
                day.setAttribute('role', 'button');
                day.setAttribute('tabindex', '0');
            }
        });
    }

    setupFocusManagement() {
        // Enhanced focus visible
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });

        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    handleEscapeKey() {
        // Close modals
        const modal = document.getElementById('editProfileModal');
        if (modal && modal.style.display === 'block') {
            modal.style.display = 'none';
        }

        // Close mobile menu
        const sidebar = document.querySelector('.sidebar');
        if (sidebar && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
            this.toggleSidebarOverlay();
        }
    }

    // 🚀 FLAWLESS Navigation System
    async setupNavigation() {
        const navLinks = document.querySelectorAll('.nav-link');
        const logoutBtn = document.getElementById('logoutBtn');

        navLinks.forEach((link, index) => {
            // Enhanced click handling with debouncing
            link.addEventListener('click', this.debounce((e) => {
                e.preventDefault();
                this.handleNavigation(link, index);
            }, 300));

            // Keyboard support
            link.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleNavigation(link, index);
                }
            });

            // Enhanced hover effects
            if (!this.reducedMotion) {
                link.addEventListener('mouseenter', () => {
                    link.style.transform = 'translateX(8px) scale(1.02)';
                });

                link.addEventListener('mouseleave', () => {
                    if (!link.closest('.nav-item').classList.contains('active')) {
                        link.style.transform = '';
                    }
                });
            }
        });

        // Enhanced logout functionality
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                await this.handleLogout();
            });
        }
    }

    async handleNavigation(link, index) {
        if (this.isLoading) return;

        this.isLoading = true;
        
        try {
            // Visual feedback
            link.classList.add('micro-bounce');
            setTimeout(() => link.classList.remove('micro-bounce'), 600);

            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Add active class to clicked item
            const navItem = link.closest('.nav-item');
            if (navItem) {
                navItem.classList.add('active');
            }
            
            // Get section name and navigate
            const sectionName = link.querySelector('span').textContent.trim();
            await this.navigateToSection(sectionName);
            
            // Announce to screen readers
            this.announceToScreenReader(`Navigated to ${sectionName} section`);
            
        } catch (error) {
            console.error('Navigation error:', error);
            this.handleError(error);
        } finally {
            this.isLoading = false;
        }
    }

    async handleLogout() {
        const result = await this.showConfirmDialog(
            'Logout Confirmation',
            'Are you sure you want to logout?',
            'Logout',
            'Cancel'
        );

        if (result) {
            // Show loading state
            this.showLoading('Logging out...');
            
            // Simulate logout process
            await this.delay(1000);
            
            // Clear cache and session data
            this.cache.clear();
            localStorage.removeItem('patient-portal-cache');
            
            window.location.href = '../index.html';
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    async navigateToSection(sectionName) {
        performance.mark(`navigate-${sectionName}-start`);
        
        // Check cache first
        if (this.cache.has(sectionName)) {
            console.log(`📦 Loading ${sectionName} from cache`);
        }

        // Show loading if needed
        if (['Calendar', 'Profile'].includes(sectionName)) {
            this.showSectionLoading(sectionName);
        }

        // Hide all sections with animation
        const allSections = document.querySelectorAll('.content-section');
        allSections.forEach(section => {
            section.classList.add('content-loading');
            section.classList.remove('active');
        });

        // Update page title with animation
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) {
            pageTitle.style.opacity = '0';
            await this.delay(150);
            pageTitle.textContent = sectionName;
            pageTitle.style.opacity = '1';
        }

        // Determine target section
        let targetId;
        switch(sectionName) {
            case 'Dashboard':
                targetId = 'dashboard-content';
                break;
            case 'Calendar':
                targetId = 'calendar-content';
                await this.initializeCalendar();
                break;
            case 'Profile':
                targetId = 'profile-content';
                await this.initializeProfile();
                break;
            case 'Help':
                targetId = 'help-content';
                await this.initializeHelp();
                break;
            default:
                targetId = 'dashboard-content';
        }

        // Show target section with enhanced animation
        await this.delay(100);
        const targetSection = document.getElementById(targetId);
        if (targetSection) {
            targetSection.classList.remove('content-loading');
            targetSection.classList.add('active', 'page-transition');
            
            // Focus management for accessibility
            targetSection.focus();
            
            // Remove transition class after animation
            setTimeout(() => {
                targetSection.classList.remove('page-transition');
            }, 500);
        }

        this.currentSection = sectionName;
        
        // Update URL without page reload
        if (history.pushState) {
            const url = new URL(window.location);
            url.searchParams.set('section', sectionName.toLowerCase());
            history.pushState({ section: sectionName }, '', url);
        }
        
        performance.mark(`navigate-${sectionName}-end`);
        performance.measure(`navigate-${sectionName}`, `navigate-${sectionName}-start`, `navigate-${sectionName}-end`);
    }

    // 🎯 FLAWLESS Utility Functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showSectionLoading(sectionName) {
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading-spinner';
        loadingElement.id = `loading-${sectionName}`;
        
        const targetSection = document.getElementById(`${sectionName.toLowerCase()}-content`);
        if (targetSection) {
            targetSection.appendChild(loadingElement);
            setTimeout(() => {
                loadingElement.remove();
            }, 1000);
        }
    }

    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.style.position = 'absolute';
        announcement.style.left = '-10000px';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.overflow = 'hidden';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    showConfirmDialog(title, message, confirmText, cancelText) {
        return new Promise((resolve) => {
            // Create custom modal dialog for better UX
            const modal = document.createElement('div');
            modal.className = 'modal confirm-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                    </div>
                    <div class="modal-body">
                        <p>${message}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-secondary cancel-btn">${cancelText}</button>
                        <button class="btn-primary confirm-btn">${confirmText}</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            modal.style.display = 'block';
            
            // Focus management
            const confirmBtn = modal.querySelector('.confirm-btn');
            const cancelBtn = modal.querySelector('.cancel-btn');
            confirmBtn.focus();
            
            // Event listeners
            confirmBtn.addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });
            
            cancelBtn.addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
            
            // Keyboard support
            modal.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    resolve(false);
                }
            });
        });
    }

    showLoading(message = 'Loading...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingMessage = document.getElementById('loadingMessage');
        
        if (loadingOverlay && loadingMessage) {
            loadingMessage.textContent = message;
            loadingOverlay.style.display = 'flex';
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    handleError(error) {
        console.error('🚨 Portal Error:', error);
        this.showNotification(`Something went wrong: ${error.message}`, 'error');
        
        // Send error to monitoring service in production
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: error.message,
                fatal: false
            });
        }
    }

    // Enhanced Calendar System
    setupCalendar() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        const bookAppointmentBtn = document.getElementById('bookAppointmentBtn');

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

        if (bookAppointmentBtn) {
            bookAppointmentBtn.addEventListener('click', () => {
                this.showBookingModal();
            });
        }
    }

    initializeCalendar() {
        this.generateCalendar();
    }

    generateCalendar() {
        const calendarDays = document.getElementById('calendarDays');
        const currentMonthElement = document.getElementById('currentMonth');
        
        if (!calendarDays) return;

        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];

        if (currentMonthElement) {
            currentMonthElement.textContent = `${monthNames[this.currentMonth]} ${this.currentYear}`;
        }

        const firstDay = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const today = new Date();

        calendarDays.innerHTML = '';

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            calendarDays.appendChild(emptyDay);
        }

        // Add calendar days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            
            const dayNumber = document.createElement('span');
            dayNumber.classList.add('day-number');
            dayNumber.textContent = day;
            dayElement.appendChild(dayNumber);

            // Highlight today
            if (this.currentMonth === today.getMonth() && 
                this.currentYear === today.getFullYear() && 
                day === today.getDate()) {
                dayElement.classList.add('today');
            }

            // Add sample appointments
            if (day === 22 || day === 25) {
                dayElement.classList.add('has-appointment');
            }

            // Add click handler for calendar days
            dayElement.addEventListener('click', () => {
                this.handleCalendarDayClick(day, dayElement);
            });

            calendarDays.appendChild(dayElement);
        }
    }

    handleCalendarDayClick(day, element) {
        // Add click animation
        element.classList.add('clicked');
        setTimeout(() => {
            element.classList.remove('clicked');
        }, 300);

        // Show day details or booking modal
        if (element.classList.contains('has-appointment')) {
            this.showAppointmentDetails(day);
        } else {
            this.showBookingModal(day);
        }
    }

    showAppointmentDetails(day) {
        const appointments = this.getAppointmentsForDay(day);
        let message = `Appointments on ${this.currentMonth + 1}/${day}/${this.currentYear}:\n\n`;
        
        appointments.forEach(apt => {
            message += `• ${apt.time} - ${apt.doctor}\n  ${apt.type}\n\n`;
        });

        alert(message);
    }

    showBookingModal(day = null) {
        const dateStr = day ? `${this.currentMonth + 1}/${day}/${this.currentYear}` : 'Selected Date';
        alert(`Book appointment for ${dateStr}\n\nThis would open a booking modal in a full implementation.`);
    }

    getAppointmentsForDay(day) {
        // Sample appointment data
        const appointments = {
            22: [
                { time: '10:30 AM', doctor: 'Dr. Sarah Johnson', type: 'Cardiology Consultation' }
            ],
            25: [
                { time: '2:00 PM', doctor: 'Dr. Lisa Wong', type: 'Speech Therapy Session' }
            ]
        };
        return appointments[day] || [];
    }

    // Enhanced Profile System
    setupProfile() {
        this.setupProfileTabs();
        this.setupProfileEditing();
        this.setupDiseaseManagement();
    }

    initializeProfile() {
        // Profile initialization logic
        console.log('Profile section initialized');
    }

    setupProfileTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                
                // Remove active class from all tabs
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked tab
                button.classList.add('active');
                const targetContent = document.getElementById(`${targetTab}-tab`);
                if (targetContent) {
                    targetContent.classList.add('active');
                }
            });
        });
    }

    setupProfileEditing() {
        const editProfileBtn = document.getElementById('editProfileBtn');
        const editPersonalBtn = document.getElementById('editPersonalBtn');
        const modal = document.getElementById('editProfileModal');
        const closeModal = document.getElementById('closeModal');
        const cancelEdit = document.getElementById('cancelEdit');
        const saveProfile = document.getElementById('saveProfile');

        // Open modal
        [editProfileBtn, editPersonalBtn].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    if (modal) {
                        modal.style.display = 'block';
                        this.populateEditForm();
                    }
                });
            }
        });

        // Close modal
        [closeModal, cancelEdit].forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => {
                    if (modal) {
                        modal.style.display = 'none';
                    }
                });
            }
        });

        // Save profile
        if (saveProfile) {
            saveProfile.addEventListener('click', () => {
                this.saveProfileChanges();
            });
        }

        // Close modal when clicking outside
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
    }

    populateEditForm() {
        // Get current values and populate form
        const fullName = document.getElementById('fullName')?.textContent;
        const dateOfBirth = document.getElementById('dateOfBirth')?.textContent;
        const phoneNumber = document.getElementById('phoneNumber')?.textContent;
        const emailAddress = document.getElementById('emailAddress')?.textContent;
        const bio = document.getElementById('bio')?.textContent;

        if (fullName) document.getElementById('editFullName').value = fullName;
        if (dateOfBirth) {
            // Convert display format to input format
            const [month, day, year] = dateOfBirth.split('/');
            if (month && day && year) {
                document.getElementById('editDateOfBirth').value = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }
        if (phoneNumber) document.getElementById('editPhoneNumber').value = phoneNumber;
        if (emailAddress) document.getElementById('editEmailAddress').value = emailAddress;
        if (bio) document.getElementById('editBio').value = bio;
    }

    saveProfileChanges() {
        // Get form values
        const fullName = document.getElementById('editFullName').value;
        const dateOfBirth = document.getElementById('editDateOfBirth').value;
        const phoneNumber = document.getElementById('editPhoneNumber').value;
        const emailAddress = document.getElementById('editEmailAddress').value;
        const bio = document.getElementById('editBio').value;

        // Update display values
        if (fullName) document.getElementById('fullName').textContent = fullName;
        if (dateOfBirth) {
            const [year, month, day] = dateOfBirth.split('-');
            document.getElementById('dateOfBirth').textContent = `${month}/${day}/${year}`;
            
            // Calculate and update age
            const birthDate = new Date(dateOfBirth);
            const age = new Date().getFullYear() - birthDate.getFullYear();
            document.getElementById('age').textContent = age;
        }
        if (phoneNumber) document.getElementById('phoneNumber').textContent = phoneNumber;
        if (emailAddress) document.getElementById('emailAddress').textContent = emailAddress;
        if (bio) document.getElementById('bio').textContent = bio;

        // Update greeting
        const greetingElement = document.querySelector('.greeting h1 span');
        if (greetingElement && fullName) {
            greetingElement.textContent = fullName;
        }

        // Close modal
        document.getElementById('editProfileModal').style.display = 'none';
        
        // Show success notification
        this.showNotification('Profile updated successfully!', 'success');
    }

    setupDiseaseManagement() {
        const addDiseaseBtn = document.getElementById('addDiseaseBtn');
        
        if (addDiseaseBtn) {
            addDiseaseBtn.addEventListener('click', () => {
                this.showAddConditionModal();
            });
        }

        // Setup existing disease tag removal
        this.setupDiseaseTagRemoval();
    }

    showAddConditionModal() {
        const condition = prompt('Enter medical condition:');
        const category = prompt('Enter category (Speech/Physical):');
        
        if (condition && category) {
            this.addConditionTag(condition, category);
        }
    }

    addConditionTag(condition, category) {
        const categoryId = category.toLowerCase() === 'speech' ? 'speechDiseases' : 'physicalDiseases';
        const container = document.getElementById(categoryId);
        
        if (container) {
            const tag = document.createElement('span');
            tag.className = 'disease-tag';
            tag.innerHTML = `${condition} <i class="fas fa-times"></i>`;
            
            // Add remove functionality
            tag.querySelector('i').addEventListener('click', () => {
                if (confirm('Remove this condition?')) {
                    tag.remove();
                    this.showNotification('Condition removed', 'info');
                }
            });
            
            container.appendChild(tag);
            this.showNotification('Condition added successfully!', 'success');
        }
    }

    setupDiseaseTagRemoval() {
        const diseaseTags = document.querySelectorAll('.disease-tag i');
        
        diseaseTags.forEach(removeBtn => {
            removeBtn.addEventListener('click', () => {
                const tag = removeBtn.closest('.disease-tag');
                if (tag && confirm('Remove this condition?')) {
                    tag.remove();
                    this.showNotification('Condition removed', 'info');
                }
            });
        });
    }

    // Enhanced Help System
    setupHelp() {
        this.setupHelpSearch();
        this.setupFAQ();
    }

    initializeHelp() {
        console.log('Help section initialized');
    }

    setupHelpSearch() {
        const helpSearchInput = document.getElementById('helpSearch');
        const helpCategories = document.querySelectorAll('.help-category');
        const faqItems = document.querySelectorAll('.faq-item');

        if (helpSearchInput) {
            helpSearchInput.addEventListener('input', function() {
                const searchTerm = this.value.toLowerCase();
                
                // Filter help categories
                helpCategories.forEach(category => {
                    const title = category.querySelector('h4').textContent.toLowerCase();
                    const description = category.querySelector('p').textContent.toLowerCase();
                    
                    if (title.includes(searchTerm) || description.includes(searchTerm)) {
                        category.style.display = 'block';
                    } else {
                        category.style.display = searchTerm === '' ? 'block' : 'none';
                    }
                });
                
                // Filter FAQ items
                faqItems.forEach(item => {
                    const question = item.querySelector('.faq-question span').textContent.toLowerCase();
                    const answer = item.querySelector('.faq-answer p').textContent.toLowerCase();
                    
                    if (question.includes(searchTerm) || answer.includes(searchTerm)) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = searchTerm === '' ? 'block' : 'none';
                    }
                });
            });
        }
    }

    setupFAQ() {
        const faqQuestions = document.querySelectorAll('.faq-question');
        
        faqQuestions.forEach(question => {
            question.addEventListener('click', function() {
                const faqItem = this.closest('.faq-item');
                const answer = faqItem.querySelector('.faq-answer');
                const icon = this.querySelector('i');
                
                // Toggle this FAQ
                faqItem.classList.toggle('active');
                
                if (faqItem.classList.contains('active')) {
                    answer.style.display = 'block';
                    if (icon) {
                        icon.classList.remove('fa-chevron-down');
                        icon.classList.add('fa-chevron-up');
                    }
                } else {
                    answer.style.display = 'none';
                    if (icon) {
                        icon.classList.remove('fa-chevron-up');
                        icon.classList.add('fa-chevron-down');
                    }
                }
            });
        });
    }

    // Mobile Menu System
    setupMobileMenu() {
        // Add mobile menu toggle button to top bar
        const topBar = document.querySelector('.top-bar');
        const sidebar = document.querySelector('.sidebar');
        
        if (topBar && window.innerWidth <= 768) {
            const mobileMenuBtn = document.createElement('button');
            mobileMenuBtn.className = 'mobile-menu-toggle';
            mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
            mobileMenuBtn.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                this.toggleSidebarOverlay();
            });
            
            topBar.insertBefore(mobileMenuBtn, topBar.firstChild);
        }

        // Close sidebar when clicking outside
        const sidebarOverlay = document.createElement('div');
        sidebarOverlay.className = 'sidebar-overlay';
        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });
        document.body.appendChild(sidebarOverlay);
    }

    toggleSidebarOverlay() {
        const overlay = document.querySelector('.sidebar-overlay');
        if (overlay) {
            overlay.classList.toggle('active');
        }
    }

    // Notification System
    setupNotifications() {
        // Notification system is ready
    }

    // 🚀 FLAWLESS Advanced Features
    async setupAdvancedFeatures() {
        await this.setupTouchGestures();
        await this.setupPerformanceOptimizations();
        await this.setupDataPersistence();
        await this.setupServiceWorker();
        await this.setupAnalytics();
    }

    async setupTouchGestures() {
        // Swipe gestures for mobile navigation
        document.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!this.touchStartX || !this.touchStartY) return;

            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;

            const diffX = this.touchStartX - touchEndX;
            const diffY = this.touchStartY - touchEndY;

            // Only handle horizontal swipes
            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
                if (diffX > 0) {
                    // Swipe left - next section
                    this.handleSwipeNavigation('next');
                } else {
                    // Swipe right - previous section
                    this.handleSwipeNavigation('prev');
                }
            }

            this.touchStartX = null;
            this.touchStartY = null;
        }, { passive: true });
    }

    handleSwipeNavigation(direction) {
        const sections = ['Dashboard', 'Calendar', 'Profile', 'Help'];
        const currentIndex = sections.indexOf(this.currentSection);
        
        let newIndex;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % sections.length;
        } else {
            newIndex = (currentIndex - 1 + sections.length) % sections.length;
        }
        
        const targetSection = sections[newIndex];
        const navItem = document.querySelector(`[aria-label="Navigate to ${targetSection}"]`);
        if (navItem) {
            navItem.click();
        }
    }

    async setupPerformanceOptimizations() {
        // Intersection Observer for lazy loading
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.lazyLoadContent(entry.target);
                    }
                });
            }, { threshold: 0.1 });

            this.observers.push(observer);
        }

        // Preload critical resources
        this.preloadResources();
    }

    async setupDataPersistence() {
        // Load cached data
        const cachedData = localStorage.getItem('patient-portal-cache');
        if (cachedData) {
            try {
                const data = JSON.parse(cachedData);
                Object.entries(data).forEach(([key, value]) => {
                    this.cache.set(key, value);
                });
                console.log('📦 Loaded cached data');
            } catch (error) {
                console.warn('Failed to load cached data:', error);
            }
        }

        // Auto-save important data
        setInterval(() => {
            this.saveDataToCache();
        }, 30000); // Save every 30 seconds
    }

    async setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('🔄 Service Worker registered:', registration);
            } catch (error) {
                console.log('Service Worker registration failed:', error);
            }
        }
    }

    async setupAnalytics() {
        // Track user interactions
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, .nav-link, .calendar-day')) {
                this.trackEvent('click', {
                    element: e.target.className,
                    section: this.currentSection
                });
            }
        });
    }

    trackEvent(eventName, data) {
        console.log(`📊 Event: ${eventName}`, data);
        
        // Send to analytics service in production
        if (typeof gtag !== 'undefined') {
            gtag('event', eventName, data);
        }
    }

    saveDataToCache() {
        const cacheData = {};
        this.cache.forEach((value, key) => {
            cacheData[key] = value;
        });
        
        try {
            localStorage.setItem('patient-portal-cache', JSON.stringify(cacheData));
            console.log('💾 Data saved to cache');
        } catch (error) {
            console.warn('Failed to save data to cache:', error);
        }
    }

    preloadResources() {
        // Preload images
        const images = [
            '/images/doctor-placeholder.jpg',
            '/images/calendar-icon.svg'
        ];

        images.forEach(src => {
            const img = new Image();
            img.src = src;
        });
    }

    lazyLoadContent(element) {
        // Implement lazy loading for heavy content
        if (element.dataset.src) {
            element.src = element.dataset.src;
            element.removeAttribute('data-src');
        }
    }

    // 🎯 FLAWLESS Notification System
    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const colors = {
            success: '#10b981',
            error: '#ef4444', 
            warning: '#f59e0b',
            info: '#3b82f6'
        };

        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        notification.innerHTML = `
            <span class="notification-icon">${icons[type]}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" aria-label="Close notification">×</button>
        `;
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10000;
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            max-width: 350px;
            display: flex;
            align-items: center;
            gap: 12px;
            transform: translateX(100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });
        
        // Close button functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.closeNotification(notification);
        });
        
        // Auto-remove after duration
        const timer = setTimeout(() => {
            this.closeNotification(notification);
        }, duration);
        
        // Pause timer on hover
        notification.addEventListener('mouseenter', () => clearTimeout(timer));
        notification.addEventListener('mouseleave', () => {
            setTimeout(() => this.closeNotification(notification), 1000);
        });

        // Announce to screen readers
        this.announceToScreenReader(`${type}: ${message}`);
    }

    closeNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// 🚀 FLAWLESS Initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 DOM loaded - Initializing FLAWLESS Patient Portal');
    
    try {
        // Initialize with loading screen
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        // Create global instance
        window.patientPortalUI = new PatientPortalUI();
        
        // Handle browser back/forward
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.section) {
                window.patientPortalUI.navigateToSection(event.state.section);
            }
        });
        
        // Handle URL section parameter on load
        const urlParams = new URLSearchParams(window.location.search);
        const section = urlParams.get('section');
        if (section) {
            const sectionName = section.charAt(0).toUpperCase() + section.slice(1);
            setTimeout(() => {
                window.patientPortalUI.navigateToSection(sectionName);
            }, 500);
        }
        
        // Hide loading screen
        setTimeout(() => {
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }, 1000);
        
        console.log('✅ FLAWLESS Patient Portal initialized successfully!');
        
    } catch (error) {
        console.error('❌ Failed to initialize Patient Portal:', error);
        
        // Fallback error message
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; font-family: Inter, sans-serif;">
                <h1 style="color: #e74c3c; margin-bottom: 20px;">⚠️ Loading Error</h1>
                <p style="color: #666; margin-bottom: 20px;">Failed to load the patient portal. Please refresh the page.</p>
                <button onclick="window.location.reload()" style="background: #4A90E2; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">Refresh Page</button>
            </div>
        `;
    }
});

// 🎨 Add Enhanced Styles and Animations
const enhancedStyles = document.createElement('style');
enhancedStyles.textContent = `
    /* FLAWLESS Keyboard Navigation Styles */
    .keyboard-navigation *:focus {
        outline: 3px solid #4A90E2 !important;
        outline-offset: 2px !important;
        border-radius: 4px !important;
    }
    
    /* FLAWLESS Notification Styles */
    .notification-icon {
        font-weight: bold;
        font-size: 16px;
    }
    
    .notification-message {
        flex: 1;
        line-height: 1.4;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: currentColor;
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        opacity: 0.7;
        transition: opacity 0.2s ease;
    }
    
    .notification-close:hover {
        opacity: 1;
        background: rgba(255, 255, 255, 0.1);
    }
    
    /* FLAWLESS Loading States */
    .content-loading {
        opacity: 0.6;
        pointer-events: none;
        filter: blur(1px);
    }
    
    /* FLAWLESS Smooth Scrolling */
    html {
        scroll-behavior: smooth;
    }
    
    /* FLAWLESS Focus Ring */
    :focus-visible {
        outline: 3px solid #4A90E2;
        outline-offset: 2px;
        border-radius: 4px;
    }
    
    /* FLAWLESS Selection */
    ::selection {
        background: #4A90E2;
        color: white;
    }
    
    /* FLAWLESS High Performance */
    * {
        will-change: auto;
    }
    
    .calendar-day,
    .nav-link,
    .btn-primary,
    .btn-outline,
    .action-btn,
    .help-category,
    .appointment-card {
        will-change: transform;
    }
    
    /* FLAWLESS Reduced Motion */
    @media (prefers-reduced-motion: reduce) {
        .micro-bounce,
        .page-transition,
        .loading-spinner {
            animation: none !important;
        }
        
        * {
            transition-duration: 0.01ms !important;
        }
    }
`;

document.head.appendChild(enhancedStyles);

// 🎯 FLAWLESS Performance Monitoring
if ('performance' in window) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const perfData = performance.getEntriesByType('navigation')[0];
            console.log('⚡ Page Performance:', {
                loadTime: Math.round(perfData.loadEventEnd - perfData.fetchStart),
                domReady: Math.round(perfData.domContentLoadedEventEnd - perfData.fetchStart),
                firstPaint: Math.round(performance.getEntriesByType('paint')[0]?.startTime || 0)
            });
        }, 1000);
    });
}

// 🔥 FLAWLESS Error Boundary
window.addEventListener('error', (event) => {
    console.error('🚨 Global Error:', event.error);
    
    if (window.patientPortalUI) {
        window.patientPortalUI.showNotification('An unexpected error occurred', 'error');
    }
    
    // Track error for analytics
    if (typeof gtag !== 'undefined') {
        gtag('event', 'exception', {
            description: event.error?.message || 'Unknown error',
            fatal: false
        });
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled Promise Rejection:', event.reason);
    
    if (window.patientPortalUI) {
        window.patientPortalUI.showNotification('A system error occurred', 'error');
    }
});

console.log('🚀 FLAWLESS Patient Portal JavaScript loaded successfully!'); 