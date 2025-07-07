/**
 * Debug Manager - Handles debug features based on environment
 * Automatically hides debug panels and utilities in production
 */

import environment from './environment.js';
import logger from './logger.js';

class DebugManager {
    constructor() {
        this.isProduction = environment.isProduction();
        this.isDevelopment = environment.isDevelopment();
        this.debugPanels = new Map();
        this.initializationStatus = 'pending';
        
        // Initialize on DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    /**
     * Initialize debug manager
     */
    initialize() {
        try {
            this.initializationStatus = 'initializing';
            
            this.handleDebugPanels();
            this.handleDebugButtons();
            this.setupGlobalDebugUtils();
            
            if (this.isProduction) {
                this.hideProductionDebugCode();
                logger.info('Debug Manager: Production mode - all debug elements hidden');
            } else {
                logger.dev('Debug Manager: Development mode - debug features available');
            }
            
            this.initializationStatus = 'completed';
            logger.info('Debug Manager initialized successfully');
        } catch (error) {
            this.initializationStatus = 'failed';
            logger.error('Debug Manager initialization failed:', error);
        }
    }

    /**
     * Register a debug panel
     * @param {string} id - Panel ID
     * @param {HTMLElement} element - Panel element
     */
    registerDebugPanel(id, element) {
        if (!element) return;
        
        this.debugPanels.set(id, element);
        
        if (this.isProduction) {
            this.hideElement(element);
            logger.info(`Debug panel "${id}" hidden in production`);
        } else {
            this.addDebugWarning(element);
            logger.dev(`Debug panel "${id}" registered for development`);
        }
    }

    /**
     * Hide debug panels in production
     */
    handleDebugPanels() {
        // Find all debug panels
        const debugPanelSelectors = [
            '#debugPanel',
            '.debug-panel',
            '[data-debug]',
            '.debug-info',
            '.debug-container'
        ];

        let hiddenCount = 0;
        debugPanelSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (this.isProduction) {
                    this.hideElement(element);
                    hiddenCount++;
                } else {
                    // In development, ensure it's visible but add warning
                    this.addDebugWarning(element);
                }
            });
        });

        if (this.isProduction && hiddenCount > 0) {
            logger.info(`Debug Manager: Hidden ${hiddenCount} debug elements in production`);
        }
    }

    /**
     * Hide debug buttons in production
     */
    handleDebugButtons() {
        const debugButtonSelectors = [
            '.debug-show-btn',
            '.debug-close-btn',
            '[data-debug-trigger]',
            'button[onclick*="debug"]',
            'button[onclick*="Debug"]'
        ];

        let hiddenButtonCount = 0;
        debugButtonSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (this.isProduction) {
                    this.hideElement(element);
                    hiddenButtonCount++;
                } else {
                    this.addDebugWarning(element);
                }
            });
        });

        if (this.isProduction && hiddenButtonCount > 0) {
            logger.info(`Debug Manager: Hidden ${hiddenButtonCount} debug buttons in production`);
        }
    }

    /**
     * Hide an element completely
     * @param {HTMLElement} element 
     */
    hideElement(element) {
        if (!element) return;
        
        element.style.display = 'none';
        element.style.visibility = 'hidden';
        element.setAttribute('data-production-hidden', 'true');
        element.setAttribute('aria-hidden', 'true');
        
        // Also remove from DOM in production to prevent tampering
        if (this.isProduction) {
            // Instead of removing immediately, hide it completely
            element.remove();
        }
    }

    /**
     * Add warning to debug elements in development
     * @param {HTMLElement} element 
     */
    addDebugWarning(element) {
        if (!element || this.isProduction) return;
        
        element.setAttribute('title', '⚠️ DEBUG: This element is hidden in production');
        element.style.border = '2px dashed orange';
        element.style.position = 'relative';
        
        // Add visual warning
        const warning = document.createElement('div');
        warning.innerHTML = '⚠️ DEBUG';
        warning.style.cssText = `
            position: absolute;
            top: -10px;
            right: -10px;
            background: orange;
            color: white;
            padding: 2px 6px;
            font-size: 10px;
            border-radius: 3px;
            z-index: 10000;
            pointer-events: none;
        `;
        element.style.position = 'relative';
        element.appendChild(warning);
    }

    /**
     * Setup global debug utilities (only in development)
     */
    setupGlobalDebugUtils() {
        if (this.isProduction) {
            // Remove any existing debug utilities
            if (typeof window !== 'undefined') {
                delete window.authDebug;
                delete window.debugUtils;
                delete window.__DEBUG__;
                delete window.firestoreLogger;
                delete window.signInLogger;
                delete window.signUpLogger;
            }
            return;
        }

        // Development-only debug utilities
        if (typeof window !== 'undefined') {
            window.__DEBUG__ = {
                environment: environment.getInfo(),
                logger: logger,
                debugManager: this,
                
                // Utility functions for debugging
                showHiddenElements: () => {
                    const hiddenElements = document.querySelectorAll('[data-production-hidden="true"]');
                    hiddenElements.forEach(el => {
                        el.style.display = '';
                        el.style.visibility = '';
                    });
                    logger.dev('Showed hidden debug elements:', hiddenElements.length);
                },
                
                listDebugElements: () => {
                    const debugElements = document.querySelectorAll('.debug-panel, .debug-show-btn, [data-debug]');
                    logger.table(Array.from(debugElements).map(el => ({
                        tag: el.tagName,
                        id: el.id,
                        class: el.className,
                        hidden: el.style.display === 'none'
                    })));
                },
                
                getEnvironmentInfo: () => {
                    logger.table(environment.getInfo());
                },

                // Security check utilities
                checkForExposedDebug: () => {
                    const debugElements = document.querySelectorAll('.debug-panel, .debug-show-btn, [data-debug]');
                    const visibleDebugElements = Array.from(debugElements).filter(el => 
                        el.style.display !== 'none' && 
                        el.style.visibility !== 'hidden' &&
                        !el.hasAttribute('data-production-hidden')
                    );
                    
                    if (visibleDebugElements.length > 0) {
                        logger.warn('⚠️ SECURITY WARNING: Debug elements visible in production!', visibleDebugElements);
                        return false;
                    }
                    
                    logger.info('✅ Security check passed: No debug elements exposed');
                    return true;
                }
            };
            
            logger.dev('Debug utilities available at window.__DEBUG__');
        }
    }

    /**
     * Remove all debug-related code in production
     */
    hideProductionDebugCode() {
        // Remove debug comments from HTML
        this.removeDebugComments();
        
        // Clean up debug CSS classes
        this.removeDebugClasses();
        
        // Disable debug event listeners
        this.disableDebugEvents();
        
        // Remove debug-related global variables
        this.cleanupGlobalDebugVars();
    }

    /**
     * Remove debug comments from DOM
     */
    removeDebugComments() {
        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_COMMENT,
            null,
            false
        );

        const commentsToRemove = [];
        let node;
        
        while (node = walker.nextNode()) {
            const comment = node.textContent.toLowerCase();
            if (comment.includes('debug') || 
                comment.includes('remove in production') ||
                comment.includes('dev only')) {
                commentsToRemove.push(node);
            }
        }

        commentsToRemove.forEach(comment => comment.remove());
        
        if (commentsToRemove.length > 0) {
            logger.info(`Debug Manager: Removed ${commentsToRemove.length} debug comments from DOM`);
        }
    }

    /**
     * Remove debug CSS classes
     */
    removeDebugClasses() {
        const debugClasses = ['debug-border', 'debug-highlight', 'debug-info'];
        const allElements = document.querySelectorAll('*');
        
        let cleanedCount = 0;
        allElements.forEach(element => {
            debugClasses.forEach(debugClass => {
                if (element.classList.contains(debugClass)) {
                    element.classList.remove(debugClass);
                    cleanedCount++;
                }
            });
        });

        if (cleanedCount > 0) {
            logger.info(`Debug Manager: Cleaned ${cleanedCount} debug CSS classes`);
        }
    }

    /**
     * Disable debug event listeners
     */
    disableDebugEvents() {
        // Remove debug-related event listeners
        const debugButtons = document.querySelectorAll('[onclick*="debug"], [onclick*="Debug"]');
        debugButtons.forEach(button => {
            button.removeAttribute('onclick');
        });
    }

    /**
     * Clean up global debug variables
     */
    cleanupGlobalDebugVars() {
        if (typeof window !== 'undefined') {
            const debugVars = ['authDebug', 'debugUtils', '__DEBUG__'];
            debugVars.forEach(varName => {
                if (window[varName]) {
                    delete window[varName];
                }
            });
        }
    }

    /**
     * Get debug status
     */
    getStatus() {
        return {
            environment: environment.getEnvironment(),
            isProduction: this.isProduction,
            isDevelopment: this.isDevelopment,
            debugPanelsCount: this.debugPanels.size,
            hiddenElementsCount: document.querySelectorAll('[data-production-hidden="true"]').length,
            initializationStatus: this.initializationStatus
        };
    }

    /**
     * Perform security audit for debug exposure
     */
    performSecurityAudit() {
        const audit = {
            timestamp: new Date().toISOString(),
            environment: environment.getEnvironment(),
            issues: []
        };

        // Check for visible debug elements
        const visibleDebugElements = document.querySelectorAll('.debug-panel:not([data-production-hidden]), .debug-show-btn:not([data-production-hidden]), [data-debug]:not([data-production-hidden])');
        if (visibleDebugElements.length > 0 && this.isProduction) {
            audit.issues.push({
                type: 'DEBUG_ELEMENTS_VISIBLE',
                severity: 'HIGH',
                count: visibleDebugElements.length,
                elements: Array.from(visibleDebugElements).map(el => ({
                    id: el.id,
                    class: el.className,
                    tag: el.tagName
                }))
            });
        }

        // Check for global debug variables
        const globalDebugVars = ['authDebug', 'debugUtils', '__DEBUG__'];
        const exposedVars = globalDebugVars.filter(varName => typeof window[varName] !== 'undefined');
        if (exposedVars.length > 0 && this.isProduction) {
            audit.issues.push({
                type: 'GLOBAL_DEBUG_VARS_EXPOSED',
                severity: 'MEDIUM',
                variables: exposedVars
            });
        }

        audit.passed = audit.issues.length === 0;
        
        if (this.isProduction) {
            if (audit.passed) {
                logger.info('✅ Debug security audit passed');
            } else {
                logger.warn('⚠️ Debug security audit failed:', audit.issues);
            }
        }

        return audit;
    }
}

// Initialize debug manager
const debugManager = new DebugManager();

// Perform initial security audit in production
if (debugManager.isProduction) {
    setTimeout(() => {
        debugManager.performSecurityAudit();
    }, 1000);
}

export default debugManager; 