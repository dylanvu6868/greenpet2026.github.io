/**
 * DOM Helpers
 * Utility functions for DOM manipulation
 */

const DOM = {
    /**
     * Get element by ID
     * @param {string} id - Element ID
     * @returns {HTMLElement|null}
     */
    byId(id) {
        return document.getElementById(id);
    },

    /**
     * Query selector (single element)
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element (optional)
     * @returns {HTMLElement|null}
     */
    qs(selector, parent = document) {
        return parent.querySelector(selector);
    },

    /**
     * Query selector all
     * @param {string} selector - CSS selector
     * @param {HTMLElement} parent - Parent element (optional)
     * @returns {NodeList}
     */
    qsa(selector, parent = document) {
        return parent.querySelectorAll(selector);
    },

    /**
     * Create element
     * @param {string} tag - HTML tag name
     * @param {Object} attributes - Element attributes
     * @param {string|HTMLElement|Array} children - Child content
     * @returns {HTMLElement}
     */
    create(tag, attributes = {}, children = null) {
        const element = document.createElement(tag);

        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else if (key.startsWith('on')) {
                const eventName = key.substring(2).toLowerCase();
                element.addEventListener(eventName, value);
            } else {
                element.setAttribute(key, value);
            }
        });

        // Add children
        if (children) {
            this.append(element, children);
        }

        return element;
    },

    /**
     * Append children to element
     * @param {HTMLElement} parent - Parent element
     * @param {string|HTMLElement|Array} children - Children to append
     */
    append(parent, children) {
        if (Array.isArray(children)) {
            children.forEach(child => this.append(parent, child));
        } else if (typeof children === 'string') {
            parent.appendChild(document.createTextNode(children));
        } else if (children instanceof HTMLElement) {
            parent.appendChild(children);
        }
    },

    /**
     * Remove all children from element
     * @param {HTMLElement} element - Element to clear
     */
    empty(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    },

    /**
     * Set HTML content
     * @param {HTMLElement} element - Target element
     * @param {string} html - HTML string
     */
    html(element, html) {
        element.innerHTML = html;
    },

    /**
     * Set text content
     * @param {HTMLElement} element - Target element
     * @param {string} text - Text string
     */
    text(element, text) {
        element.textContent = text;
    },

    /**
     * Add class to element
     * @param {HTMLElement} element - Target element
     * @param {string|Array} className - Class name(s)
     */
    addClass(element, className) {
        if (Array.isArray(className)) {
            element.classList.add(...className);
        } else {
            element.classList.add(className);
        }
    },

    /**
     * Remove class from element
     * @param {HTMLElement} element - Target element
     * @param {string|Array} className - Class name(s)
     */
    removeClass(element, className) {
        if (Array.isArray(className)) {
            element.classList.remove(...className);
        } else {
            element.classList.remove(className);
        }
    },

    /**
     * Toggle class on element
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name
     * @param {boolean} force - Force add/remove (optional)
     */
    toggleClass(element, className, force) {
        return element.classList.toggle(className, force);
    },

    /**
     * Check if element has class
     * @param {HTMLElement} element - Target element
     * @param {string} className - Class name
     * @returns {boolean}
     */
    hasClass(element, className) {
        return element.classList.contains(className);
    },

    /**
     * Show element
     * @param {HTMLElement} element - Target element
     */
    show(element) {
        element.style.display = '';
        this.removeClass(element, 'hidden');
    },

    /**
     * Hide element
     * @param {HTMLElement} element - Target element
     */
    hide(element) {
        this.addClass(element, 'hidden');
    },

    /**
     * Toggle element visibility
     * @param {HTMLElement} element - Target element
     */
    toggle(element) {
        this.toggleClass(element, 'hidden');
    },

    /**
     * Get/Set data attribute
     * @param {HTMLElement} element - Target element
     * @param {string} key - Data key
     * @param {string} value - Data value (optional, for setter)
     * @returns {string|undefined}
     */
    data(element, key, value) {
        if (value !== undefined) {
            element.dataset[key] = value;
        }
        return element.dataset[key];
    },

    /**
     * Add event listener
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     * @param {Object|boolean} options - Event options
     */
    on(element, event, handler, options) {
        element.addEventListener(event, handler, options);
    },

    /**
     * Remove event listener
     * @param {HTMLElement} element - Target element
     * @param {string} event - Event name
     * @param {Function} handler - Event handler
     */
    off(element, event, handler) {
        element.removeEventListener(event, handler);
    },

    /**
     * Delegate event listener
     * @param {HTMLElement} parent - Parent element
     * @param {string} event - Event name
     * @param {string} selector - Child selector
     * @param {Function} handler - Event handler
     */
    delegate(parent, event, selector, handler) {
        parent.addEventListener(event, (e) => {
            const target = e.target.closest(selector);
            if (target) {
                handler.call(target, e);
            }
        });
    },

    /**
     * Wait for DOM ready
     * @param {Function} callback - Callback function
     */
    ready(callback) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', callback);
        } else {
            callback();
        }
    },

    /**
     * Scroll to element
     * @param {HTMLElement} element - Target element
     * @param {Object} options - Scroll options
     */
    scrollTo(element, options = { behavior: 'smooth', block: 'start' }) {
        element.scrollIntoView(options);
    },

    /**
     * Get element offset from top
     * @param {HTMLElement} element - Target element
     * @returns {number}
     */
    offsetTop(element) {
        const rect = element.getBoundingClientRect();
        return rect.top + window.pageYOffset;
    },

    /**
     * Check if element is in viewport
     * @param {HTMLElement} element - Target element
     * @returns {boolean}
     */
    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Serialize form data
     * @param {HTMLFormElement} form - Form element
     * @returns {Object}
     */
    serializeForm(form) {
        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            // Handle multiple values (checkboxes, multi-select)
            if (data[key]) {
                if (!Array.isArray(data[key])) {
                    data[key] = [data[key]];
                }
                data[key].push(value);
            } else {
                data[key] = value;
            }
        }

        return data;
    },

    /**
     * Populate form with data
     * @param {HTMLFormElement} form - Form element
     * @param {Object} data - Data object
     */
    populateForm(form, data) {
        Object.entries(data).forEach(([key, value]) => {
            const field = form.elements[key];
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = Boolean(value);
                } else if (field.type === 'radio') {
                    const radio = form.querySelector(`input[name="${key}"][value="${value}"]`);
                    if (radio) radio.checked = true;
                } else {
                    field.value = value;
                }
            }
        });
    },

    /**
     * Debounce function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function}
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Throttle function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Limit time in ms
     * @returns {Function}
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Freeze to prevent modifications
Object.freeze(DOM);
