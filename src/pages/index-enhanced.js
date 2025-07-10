// ===================================
// LingapLink Landing Page Enhanced
// Modern JavaScript Implementation
// ===================================

// Application Configuration
const CONFIG = {
  SEARCH_DEBOUNCE_DELAY: 300,
  NOTIFICATION_DURATION: 5000,
  GEOLOCATION_TIMEOUT: 10000,
  GEOLOCATION_MAX_AGE: 600000,
  API_ENDPOINTS: {
    search: '/api/search',
    geocoding: '/api/geocoding',
    facilities: '/api/facilities'
  },
  ROUTES: {
    patientPortal: '/public/patientPortal.html',
    patientSignUp: '/public/patientSign-up.html',
    patientSignIn: '/public/patientSign-in.html',
    businessRegistration: '/public/businessRegistration.html',
    businessSignIn: '/public/businessSignIn.html'
  }
};

// Application State Management
class AppState {
  constructor() {
    this.isSearching = false;
    this.isLocationDetecting = false;
    this.notifications = new Map();
    this.eventListeners = new Map();
    this.observerInstances = new Set();
  }

  // Set search state
  setSearching(isSearching) {
    this.isSearching = isSearching;
    this.updateSearchUI();
  }

  // Set location detection state
  setLocationDetecting(isDetecting) {
    this.isLocationDetecting = isDetecting;
    this.updateLocationUI();
  }

  // Update search UI based on state
  updateSearchUI() {
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
      searchButton.disabled = this.isSearching;
      searchButton.classList.toggle('btn-loading', this.isSearching);
      searchButton.textContent = this.isSearching ? 'Searching...' : 'Search';
    }
  }

  // Update location UI based on state
  updateLocationUI() {
    const locationBtn = document.querySelector('.location-detect-btn');
    if (locationBtn) {
      locationBtn.disabled = this.isLocationDetecting;
      locationBtn.classList.toggle('btn-loading', this.isLocationDetecting);
      const icon = locationBtn.querySelector('i');
      if (icon) {
        icon.className = this.isLocationDetecting ? 'fas fa-spinner fa-spin' : 'fas fa-crosshairs';
      }
    }
  }

  // Cleanup method for memory management
  cleanup() {
    this.notifications.clear();
    this.eventListeners.forEach((listener, element) => {
      element.removeEventListener(listener.type, listener.handler);
    });
    this.eventListeners.clear();
    this.observerInstances.forEach(observer => observer.disconnect());
    this.observerInstances.clear();
  }
}

// Utility Functions
class Utils {
  // Debounce function to limit rapid function calls
  static debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Throttle function for performance-critical events
  static throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func.apply(this, args);
      }
    };
  }

  // Sanitize user input to prevent XSS
  static sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Validate email format
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generate unique ID for elements
  static generateId() {
    return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Format error messages for user display
  static formatErrorMessage(error) {
    if (typeof error === 'string') return error;
    if (error.message) return error.message;
    return 'An unexpected error occurred. Please try again.';
  }

  // Check if element is in viewport
  static isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= window.innerHeight &&
      rect.right <= window.innerWidth
    );
  }
}

// Enhanced Notification System
class NotificationManager {
  constructor() {
    this.container = this.ensureContainer();
    this.notifications = new Map();
    this.maxNotifications = 5;
  }

  ensureContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      container.setAttribute('aria-live', 'polite');
      container.setAttribute('aria-atomic', 'false');
      document.body.appendChild(container);
    }
    return container;
  }

  show(message, type = 'info', options = {}) {
    const id = Utils.generateId();
    const duration = options.duration || CONFIG.NOTIFICATION_DURATION;
    const persistent = options.persistent || false;

    // Limit number of notifications
    if (this.notifications.size >= this.maxNotifications) {
      const oldestId = this.notifications.keys().next().value;
      this.remove(oldestId);
    }

    const notification = this.createNotification(id, message, type, options);
    this.container.appendChild(notification);
    this.notifications.set(id, { element: notification, timeout: null });

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('notification-enter');
    });

    // Auto-remove if not persistent
    if (!persistent) {
      const timeout = setTimeout(() => this.remove(id), duration);
      this.notifications.get(id).timeout = timeout;
    }

    // Announce to screen readers
    this.announceToScreenReader(message);

    return id;
  }

  createNotification(id, message, type, options) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.id = id;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');

    const iconMap = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    };

    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">
          <i class="${iconMap[type] || iconMap.info}" aria-hidden="true"></i>
        </div>
        <div class="notification-message">${Utils.sanitizeInput(message)}</div>
        <button class="notification-close" aria-label="Close notification">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>
      ${!options.persistent ? '<div class="notification-progress"><div class="notification-progress-bar"></div></div>' : ''}
    `;

    // Add close functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => this.remove(id));

    // Add keyboard support
    closeBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.remove(id);
      }
    });

    return notification;
  }

  remove(id) {
    const notificationData = this.notifications.get(id);
    if (!notificationData) return;

    const { element, timeout } = notificationData;
    
    // Clear timeout
    if (timeout) clearTimeout(timeout);

    // Animate out
    element.classList.add('notification-exit');
    element.addEventListener('animationend', () => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }, { once: true });

    this.notifications.delete(id);
  }

  clear() {
    this.notifications.forEach((_, id) => this.remove(id));
  }

  announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    setTimeout(() => {
      if (announcement.parentNode) {
        announcement.parentNode.removeChild(announcement);
      }
    }, 1000);
  }
}

// Enhanced Search Functionality
class SearchManager {
  constructor(appState, notificationManager) {
    this.appState = appState;
    this.notificationManager = notificationManager;
    this.searchHistory = this.loadSearchHistory();
    this.debouncedSearch = Utils.debounce(this.performSearch.bind(this), CONFIG.SEARCH_DEBOUNCE_DELAY);
  }

  init() {
    this.bindEvents();
    this.setupAutocomplete();
  }

  bindEvents() {
    const searchButton = document.querySelector('.search-button');
    const searchForm = document.querySelector('.search-bar');
    const searchInput = document.querySelector('#facility-search');
    const locationInput = document.querySelector('#location-search');

    if (searchForm) {
      searchForm.addEventListener('submit', this.handleSearchSubmit.bind(this));
    }

    if (searchButton) {
      searchButton.addEventListener('click', this.handleSearchClick.bind(this));
    }

    if (searchInput) {
      searchInput.addEventListener('input', this.handleSearchInput.bind(this));
      searchInput.addEventListener('keydown', this.handleSearchKeydown.bind(this));
    }

    if (locationInput) {
      locationInput.addEventListener('input', this.handleLocationInput.bind(this));
      locationInput.addEventListener('keydown', this.handleLocationKeydown.bind(this));
    }
  }

  handleSearchSubmit(e) {
    e.preventDefault();
    this.performSearch();
  }

  handleSearchClick(e) {
    e.preventDefault();
    this.performSearch();
  }

  handleSearchInput(e) {
    const query = e.target.value.trim();
    if (query.length >= 2) {
      this.debouncedSearch();
    }
  }

  handleSearchKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.performSearch();
    }
  }

  handleLocationInput(e) {
    // Implement location suggestions if needed
    const location = e.target.value.trim();
    if (location.length >= 2) {
      this.suggestLocations(location);
    }
  }

  handleLocationKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      this.performSearch();
    }
  }

  async performSearch() {
    if (this.appState.isSearching) return;

    const searchInput = document.querySelector('#facility-search');
    const locationInput = document.querySelector('#location-search');
    
    const searchTerm = searchInput?.value.trim() || '';
    const location = locationInput?.value.trim() || '';

    // Validate input
    if (!searchTerm && !location) {
      this.notificationManager.show('Please enter a search term or location', 'warning');
      searchInput?.focus();
      return;
    }

    // Sanitize inputs
    const sanitizedSearch = Utils.sanitizeInput(searchTerm);
    const sanitizedLocation = Utils.sanitizeInput(location);

    try {
      this.appState.setSearching(true);
      
      // Save to search history
      if (sanitizedSearch) {
        this.addToSearchHistory(sanitizedSearch);
      }

      // Simulate API call (replace with actual implementation)
      const results = await this.searchFacilities(sanitizedSearch, sanitizedLocation);
      
      if (results.length > 0) {
        this.notificationManager.show(
          `Found ${results.length} healthcare facilities matching your search`, 
          'success'
        );
        this.redirectToResults({ search: sanitizedSearch, location: sanitizedLocation });
      } else {
        this.notificationManager.show(
          'No facilities found matching your search criteria', 
          'info'
        );
      }

    } catch (error) {
      console.error('Search error:', error);
      this.notificationManager.show(
        'Search failed. Please check your connection and try again.', 
        'error'
      );
    } finally {
      this.appState.setSearching(false);
    }
  }

  async searchFacilities(searchTerm, location) {
    // Simulate API call - replace with actual implementation
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock data
        const mockResults = [
          { id: 1, name: 'Metro General Hospital', location: 'Makati City' },
          { id: 2, name: 'Sunshine Medical Clinic', location: 'Quezon City' },
          { id: 3, name: 'Heart Care Center', location: 'BGC' }
        ];
        resolve(mockResults);
      }, 1000);
    });
  }

  setupAutocomplete() {
    // Implement autocomplete functionality if needed
    const searchInput = document.querySelector('#facility-search');
    if (searchInput) {
      // Add autocomplete logic here
    }
  }

  suggestLocations(query) {
    // Implement location suggestions if needed
  }

  addToSearchHistory(term) {
    if (!this.searchHistory.includes(term)) {
      this.searchHistory.unshift(term);
      this.searchHistory = this.searchHistory.slice(0, 10); // Keep only last 10
      this.saveSearchHistory();
    }
  }

  loadSearchHistory() {
    try {
      const history = localStorage.getItem('lingaplink_search_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('Failed to load search history:', error);
      return [];
    }
  }

  saveSearchHistory() {
    try {
      localStorage.setItem('lingaplink_search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      console.warn('Failed to save search history:', error);
    }
  }

  redirectToResults(params) {
    const url = new URL(CONFIG.ROUTES.patientPortal, window.location.origin);
    if (params.search) url.searchParams.set('search', params.search);
    if (params.location) url.searchParams.set('location', params.location);
    
    setTimeout(() => {
      window.location.href = url.toString();
    }, 1500);
  }
}

// Enhanced Location Manager
class LocationManager {
  constructor(appState, notificationManager) {
    this.appState = appState;
    this.notificationManager = notificationManager;
    this.watchId = null;
  }

  init() {
    this.bindEvents();
    this.checkGeolocationSupport();
  }

  bindEvents() {
    const locationBtn = document.querySelector('.location-detect-btn');
    const enableLocationBtn = document.querySelector('.enable-location');

    if (locationBtn) {
      locationBtn.addEventListener('click', this.detectLocation.bind(this));
    }

    if (enableLocationBtn) {
      enableLocationBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.detectLocation();
      });
    }
  }

  checkGeolocationSupport() {
    if (!navigator.geolocation) {
      const locationBtn = document.querySelector('.location-detect-btn');
      if (locationBtn) {
        locationBtn.disabled = true;
        locationBtn.title = 'Geolocation not supported';
      }
      console.warn('Geolocation is not supported by this browser');
    }
  }

  async detectLocation() {
    if (this.appState.isLocationDetecting) return;

    if (!navigator.geolocation) {
      this.notificationManager.show(
        'Geolocation is not supported by this browser', 
        'error'
      );
      return;
    }

    try {
      this.appState.setLocationDetecting(true);
      const position = await this.getCurrentPosition();
      const location = await this.reverseGeocode(position.coords);
      
      this.updateLocationInput(location);
      this.notificationManager.show('Location detected successfully!', 'success');
      
    } catch (error) {
      this.handleLocationError(error);
    } finally {
      this.appState.setLocationDetecting(false);
    }
  }

  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      const options = {
        enableHighAccuracy: true,
        timeout: CONFIG.GEOLOCATION_TIMEOUT,
        maximumAge: CONFIG.GEOLOCATION_MAX_AGE
      };

      navigator.geolocation.getCurrentPosition(resolve, reject, options);
    });
  }

  async reverseGeocode(coords) {
    try {
      // Simulate reverse geocoding - replace with actual service
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve('Makati City, Metro Manila');
        }, 500);
      });
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`;
    }
  }

  updateLocationInput(location) {
    const locationInput = document.querySelector('#location-search');
    if (locationInput) {
      locationInput.value = location;
      locationInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  handleLocationError(error) {
    let message = 'Unable to detect location';
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = 'Location access denied. Please enable location services.';
        break;
      case error.POSITION_UNAVAILABLE:
        message = 'Location information is unavailable.';
        break;
      case error.TIMEOUT:
        message = 'Location request timed out. Please try again.';
        break;
      default:
        message = 'An error occurred while detecting location.';
    }

    this.notificationManager.show(message, 'error');
    console.error('Geolocation error:', error);
  }

  stopWatching() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }
}

// Enhanced Booking Manager
class BookingManager {
  constructor(notificationManager) {
    this.notificationManager = notificationManager;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    const bookingButtons = document.querySelectorAll('.book-appointment');
    bookingButtons.forEach(button => {
      button.addEventListener('click', this.handleBookingClick.bind(this));
    });
  }

  async handleBookingClick(e) {
    e.preventDefault();
    
    const button = e.currentTarget;
    const facilityCard = button.closest('.facility-card');
    const facilityName = facilityCard?.querySelector('h3')?.textContent || 'Healthcare Facility';
    
    if (button.disabled) return;

    try {
      this.setButtonLoading(button, true);
      
      // Simulate booking process
      await this.processBooking(facilityName);
      
      this.notificationManager.show(
        `Redirecting to book appointment with ${facilityName}...`, 
        'info'
      );
      
      setTimeout(() => {
        window.location.href = CONFIG.ROUTES.patientSignUp;
      }, 1500);

    } catch (error) {
      console.error('Booking error:', error);
      this.notificationManager.show(
        'Failed to process booking. Please try again.', 
        'error'
      );
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  async processBooking(facilityName) {
    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

  setButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    button.classList.toggle('btn-loading', isLoading);
    
    if (isLoading) {
      button.dataset.originalText = button.textContent;
      button.textContent = 'Processing...';
    } else {
      button.textContent = button.dataset.originalText || 'Book an appointment';
    }
  }
}

// Enhanced Business Partnership Manager
class BusinessManager {
  constructor(notificationManager) {
    this.notificationManager = notificationManager;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Registration buttons
    const registerButtons = document.querySelectorAll('.cta-primary-btn, .featured a[href*="businessRegistration"]');
    registerButtons.forEach(button => {
      button.addEventListener('click', this.handleRegistrationClick.bind(this));
    });

    // Sign-in buttons
    const signinButtons = document.querySelectorAll('.cta-secondary-btn');
    signinButtons.forEach(button => {
      button.addEventListener('click', this.handleSigninClick.bind(this));
    });
  }

  async handleRegistrationClick(e) {
    e.preventDefault();
    
    const button = e.currentTarget;
    if (button.disabled) return;

    try {
      this.setButtonLoading(button, true);
      
      this.notificationManager.show(
        'Redirecting to business registration portal...', 
        'info'
      );
      
      setTimeout(() => {
        window.location.href = CONFIG.ROUTES.businessRegistration;
      }, 1500);

    } catch (error) {
      console.error('Registration redirect error:', error);
      this.notificationManager.show('Failed to redirect. Please try again.', 'error');
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  async handleSigninClick(e) {
    e.preventDefault();
    
    const button = e.currentTarget;
    if (button.disabled) return;

    try {
      this.setButtonLoading(button, true);
      
      this.notificationManager.show(
        'Redirecting to business portal...', 
        'info'
      );
      
      setTimeout(() => {
        window.location.href = CONFIG.ROUTES.businessSignIn;
      }, 1500);

    } catch (error) {
      console.error('Sign-in redirect error:', error);
      this.notificationManager.show('Failed to redirect. Please try again.', 'error');
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  setButtonLoading(button, isLoading) {
    button.disabled = isLoading;
    button.classList.toggle('btn-loading', isLoading);
    
    if (isLoading) {
      button.dataset.originalHtml = button.innerHTML;
      button.innerHTML = '<i class="fas fa-spinner fa-spin" aria-hidden="true"></i> Processing...';
    } else {
      button.innerHTML = button.dataset.originalHtml || button.innerHTML;
    }
  }
}

// Enhanced Animation Manager
class AnimationManager {
  constructor(appState) {
    this.appState = appState;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  init() {
    if (this.prefersReducedMotion) {
      console.log('Reduced motion preference detected, disabling animations');
      return;
    }

    this.setupScrollAnimations();
    this.setupHoverEffects();
    this.setupLoadingAnimations();
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
        }
      });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll(
      '.facility-card, .section-header, .hero-content, .cta-content'
    );
    
    animateElements.forEach(el => {
      observer.observe(el);
    });

    this.appState.observerInstances.add(observer);
  }

  setupHoverEffects() {
    const facilityCards = document.querySelectorAll('.facility-card');
    
    facilityCards.forEach(card => {
      const handleMouseEnter = Utils.throttle(() => {
        if (!this.prefersReducedMotion) {
          card.style.transform = 'translateY(-5px)';
          card.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
        }
      }, 16);

      const handleMouseLeave = Utils.throttle(() => {
        if (!this.prefersReducedMotion) {
          card.style.transform = 'translateY(0)';
          card.style.boxShadow = '';
        }
      }, 16);

      card.addEventListener('mouseenter', handleMouseEnter);
      card.addEventListener('mouseleave', handleMouseLeave);

      // Store for cleanup
      this.appState.eventListeners.set(card, [
        { type: 'mouseenter', handler: handleMouseEnter },
        { type: 'mouseleave', handler: handleMouseLeave }
      ]);
    });
  }

  setupLoadingAnimations() {
    // Add loading animation styles dynamically if needed
    if (!document.getElementById('loading-styles')) {
      const style = document.createElement('style');
      style.id = 'loading-styles';
      style.textContent = `
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        .notification-enter {
          animation: slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .notification-exit {
          animation: slideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Enhanced Accessibility Manager
class AccessibilityManager {
  constructor(appState) {
    this.appState = appState;
    this.focusableElementsSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  }

  init() {
    this.setupKeyboardNavigation();
    this.setupFocusManagement();
    this.setupAriaLiveRegions();
    this.setupSkipLinks();
    this.announcePageLoad();
  }

  setupKeyboardNavigation() {
    // Enhanced keyboard support for interactive elements
    const interactiveElements = document.querySelectorAll(
      'button, .book-appointment, .search-button, .location-detect-btn'
    );

    interactiveElements.forEach(element => {
      const handleKeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          element.click();
        }
      };

      element.addEventListener('keydown', handleKeydown);
      this.appState.eventListeners.set(element, [
        { type: 'keydown', handler: handleKeydown }
      ]);
    });
  }

  setupFocusManagement() {
    // Detect keyboard navigation
    const handleKeydown = (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMousedown = () => {
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('mousedown', handleMousedown);

    this.appState.eventListeners.set(document, [
      { type: 'keydown', handler: handleKeydown },
      { type: 'mousedown', handler: handleMousedown }
    ]);
  }

  setupAriaLiveRegions() {
    // Ensure live regions exist
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
    }
  }

  setupSkipLinks() {
    // Enhanced skip link functionality
    const skipLink = document.querySelector('.skip-link');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector('#main-content');
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  announcePageLoad() {
    // Announce page load to screen readers
    setTimeout(() => {
      this.announceToScreenReader(
        'LingapLink healthcare platform loaded. Use Tab to navigate through the page.'
      );
    }, 1000);
  }

  announceToScreenReader(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  // Trap focus within a container (useful for modals)
  trapFocus(container) {
    const focusableElements = container.querySelectorAll(this.focusableElementsSelector);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeydown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeydown);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleKeydown);
  }
}

// Main Application Class
class LingapLinkApp {
  constructor() {
    this.appState = new AppState();
    this.notificationManager = new NotificationManager();
    this.searchManager = new SearchManager(this.appState, this.notificationManager);
    this.locationManager = new LocationManager(this.appState, this.notificationManager);
    this.bookingManager = new BookingManager(this.notificationManager);
    this.businessManager = new BusinessManager(this.notificationManager);
    this.animationManager = new AnimationManager(this.appState);
    this.accessibilityManager = new AccessibilityManager(this.appState);
  }

  async init() {
    try {
      console.log('Initializing LingapLink Enhanced Application...');

      // Initialize all managers
      this.searchManager.init();
      this.locationManager.init();
      this.bookingManager.init();
      this.businessManager.init();
      this.animationManager.init();
      this.accessibilityManager.init();

      // Setup error handling
      this.setupGlobalErrorHandling();

      // Setup page visibility handling
      this.setupVisibilityHandling();

      console.log('LingapLink Enhanced Application initialized successfully');

    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.notificationManager.show(
        'Application failed to initialize. Please refresh the page.', 
        'error',
        { persistent: true }
      );
    }
  }

  setupGlobalErrorHandling() {
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.error);
      this.notificationManager.show(
        'An unexpected error occurred. Please refresh the page if problems persist.', 
        'error'
      );
    });

    window.addEventListener('unhandledrejection', (e) => {
      console.error('Unhandled promise rejection:', e.reason);
      this.notificationManager.show(
        'A network error occurred. Please check your connection.', 
        'error'
      );
    });
  }

  setupVisibilityHandling() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Page is hidden - cleanup unnecessary processes
        this.locationManager.stopWatching();
      } else {
        // Page is visible - resume normal operation
        console.log('Page visible - resuming operation');
      }
    });
  }

  // Cleanup method for when the page is unloaded
  cleanup() {
    this.appState.cleanup();
    this.locationManager.stopWatching();
    this.notificationManager.clear();
    console.log('Application cleanup completed');
  }
}

// Initialize Application
let app;

document.addEventListener('DOMContentLoaded', async () => {
  app = new LingapLinkApp();
  await app.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  app?.cleanup();
});

// Export for testing or external use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LingapLinkApp, Utils, CONFIG };
} 