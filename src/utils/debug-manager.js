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
        this.handleDebugPanels();
        this.handleDebugButtons();
        this.setupGlobalDebugUtils();
        
        if (this.isProduction) {
            this.hideProductionDebugCode();
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

        debugPanelSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (this.isProduction) {
                    this.hideElement(element);
                } else {
                    // In development, ensure it's visible but add warning
                    this.addDebugWarning(element);
                }
            });
        });
    }

    /**
     * Hide debug buttons in production
     */
    handleDebugButtons() {
        const debugButtonSelectors = [
            '.debug-show-btn',
            '.debug-close-btn',
            '[data-debug-trigger]',
            'button[onclick*="debug"]'
        ];

        debugButtonSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (this.isProduction) {
                    this.hideElement(element);
                } else {
                    this.addDebugWarning(element);
                }
            });
        });
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
        
        // Also remove from DOM in production to prevent tampering
        if (this.isProduction) {
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
    }

    /**
     * Remove debug CSS classes
     */
    removeDebugClasses() {
        const debugClasses = ['debug-border', 'debug-highlight', 'debug-info'];
        
        debugClasses.forEach(className => {
            const elements = document.querySelectorAll(`.${className}`);
            elements.forEach(element => {
                element.classList.remove(className);
            });
        });
    }

    /**
     * Disable debug event listeners
     */
    disableDebugEvents() {
        // Remove onclick handlers that contain debug functionality
        const elementsWithDebugHandlers = document.querySelectorAll('[onclick*="debug"], [onclick*="Debug"]');
        
        elementsWithDebugHandlers.forEach(element => {
            element.removeAttribute('onclick');
            element.style.pointerEvents = 'none';
        });
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
            hiddenElementsCount: document.querySelectorAll('[data-production-hidden="true"]').length
        };
    }
}

// Create singleton instance
const debugManager = new DebugManager();

export default debugManager; 