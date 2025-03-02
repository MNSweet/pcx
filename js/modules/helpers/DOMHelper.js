// /js/modules/helpers/DOMHelper.js
Logger.log("DOMHelper Loaded","INIT");

class DOMHelper {
	// Private cache for DOM elements
	_elementCache = new Map();

	events = {
		Space	: {bubbles: true, cancelable: true,	key: ' '},
		Delete	: {bubbles: true, cancelable: true,	shiftKey: false, keyCode: 8,	code: "Backspace",	key: "Backspace"},
		End		: {bubbles: true, cancelable: true,	shiftKey: false, keyCode: 35,	code: "END",		key: "END"},
		Tab		: {bubbles: true, cancelable: true,	shiftKey: false, keyCode: 9,	code: "Tab",		key: "Tab"},
		Enter	: {bubbles: true, cancelable: false,shiftKey: false, keyCode: 13,	code: "Enter",		key: "Enter"},
	};

	/**
	 * Finds a single DOM element matching the given selector.
	 * @param {string} selector - The CSS selector.
	 * @returns {Element|null} - The first matching element or null if not found.
	 */
	findEl(selector) {
		try {
			const el = document.querySelector(selector);
			Logger.log(`DOMHelper.findEl("${selector}") succeeded`, { element: el });
			return el;
		} catch (error) {
			Logger.error(`DOMHelper.findEl: Error querying selector "${selector}"`, { error });
			return null;
		}
	}

	/**
	 * Finds all DOM elements matching the given selector.
	 * @param {string} selector - The CSS selector.
	 * @returns {NodeListOf<Element>} - The list of matching elements.
	 */
	findEls(selector) {
		try {
			const els = document.querySelectorAll(selector);
			Logger.log(`DOMHelper.findEls("${selector}") succeeded`, { elements: els });
			return els;
		} catch (error) {
			Logger.error(`DOMHelper.findEls: Error querying selector "${selector}"`, { error });
			return [];
		}
	}

	/**
	 * Returns a cached element if available; otherwise queries the DOM, caches, and returns it.
	 * @param {string} selector - The CSS selector.
	 * @param {boolean} [requery=false] - If true, bypass the cache and query again.
	 * @returns {Element|null} - The found element or null if not found.
	 */
	getEl(selector, requery = false) {
		if (!requery && this._elementCache.has(selector)) {
			Logger.log(`DOMHelper.getEl("${selector}") retrieved from cache`);
			return this._elementCache.get(selector);
		}
		const el = this.findEl(selector);
		this._elementCache.set(selector, el);
		return el;
	}

	/**
	 * Returns cached elements if available; otherwise queries the DOM, caches, and returns them.
	 * @param {string} selector - The CSS selector.
	 * @param {boolean} [requery=false] - If true, bypass the cache and query again.
	 * @returns {NodeListOf<Element>} - The found elements.
	 */
	getEls(selector, requery = false) {
		if (!requery && this._elementCache.has(selector)) {
			Logger.log(`DOMHelper.getEls("${selector}") retrieved from cache`);
			return this._elementCache.get(selector);
		}
		const els = this.findEls(selector);
		this._elementCache.set(selector, els);
		return els;
	}

	/**
	 * Clears the entire cache or a specific selector from the cache.
	 * @param {string} [selector] - Optional CSS selector to clear from cache.
	 */
	clearCache(selector) {
		if (selector) {
			this._elementCache.delete(selector);
			Logger.log(`DOMHelper.clearCache: Cleared cache for selector "${selector}"`);
		} else {
			this._elementCache.clear();
			Logger.log(`DOMHelper.clearCache: Cleared entire cache`);
		}
	}

	/**
	 * Creates a new DOM element of the specified type and applies the given properties.
	 * @param {string} domType - The type of element to create (e.g., 'div', 'span').
	 * @param {Object} properties - An object of properties to assign to the element.
	 * @returns {Element|null} - The newly created element, or null if creation fails.
	 */
	createDOM(domType, properties = {}) {
		try {
			const element = document.createElement(domType);
			Object.assign(element, properties);
			Logger.log(`DOMHelper.createDOM: Created "${domType}"`, { properties });
			return element;
		} catch (error) {
			Logger.error(`DOMHelper.createDOM: Error creating element "${domType}"`, { error, properties });
			return null;
		}
	}

	/**
	 * Simulates a keyboard event on the provided element.
	 * @param {Element} element - The target element.
	 * @param {Object} opts - Options for the keyboard event (e.g., key, keyCode).
	 * @param {string} [type='keydown'] - The type of event to simulate.
	 * @returns {boolean} - True if the event was dispatched; false otherwise.
	 */
	simulateUserKey(element, opts, type = 'keydown') {
		if (!element || typeof opts !== 'object') {
			Logger.warn(`DOMHelper.simulateUserKey: Invalid element or options`, { element, opts });
			return false;
		}
		const defaults = { bubbles: true, cancelable: true, key: "", shiftKey: false, keyCode: 0 };
		const options = { ...defaults, ...opts };
		try {
			const event = new KeyboardEvent(type, options);
			element.dispatchEvent(event);
			Logger.log(`DOMHelper.simulateUserKey: Simulated "${options.key}" on element "${element.id || element.tagName}"`, { options });
			return true;
		} catch (error) {
			Logger.error(`DOMHelper.simulateUserKey: Error dispatching event on element "${element.id || element.tagName}"`, { error, options });
			return false;
		}
	}

	/**
	 * Copies text to the clipboard.
	 * @param {string} text - The text to copy.
	 * @returns {Promise<void>}
	 */
	async copyToClipboard(text) {
		try {
			await navigator.clipboard.writeText(text);
			Logger.log(`DOMHelper.copyToClipboard: Copied text successfully`, { text });
		} catch (error) {
			Logger.error(`DOMHelper.copyToClipboard: Failed to copy text`, { error, text });
		}
	}

	/**
	 * Reads text from the clipboard.
	 * @returns {Promise<string|null>} - The text from the clipboard or null on error.
	 */
	async readFromClipboard() {
		try {
			const text = await navigator.clipboard.readText();
			Logger.log(`DOMHelper.readFromClipboard: Read text successfully`, { text });
			return text;
		} catch (error) {
			Logger.error(`DOMHelper.readFromClipboard: Failed to read clipboard`, { error });
			return null;
		}
	}

	/**
	 * Retrieves URL parameters as a plain object.
	 * @returns {Object} - An object mapping query parameter keys to values.
	 */
	getUrlParams() {
		const params = {};
		try {
			const urlParams = new URLSearchParams(window.location.search);
			for (const [key, value] of urlParams.entries()) {
				params[key] = value;
			}
			Logger.log(`DOMHelper.getUrlParams: Retrieved parameters`, { params });
		} catch (error) {
			Logger.error(`DOMHelper.getUrlParams: Error parsing URL parameters`, { error });
		}
		return params;
	}

	/**
	 * Splits the current pathname into segments, excluding empty segments.
	 * @returns {string[]} - An array of non-empty path segments.
	 */
	getUrlDirectory() {
		try {
			const directory = window.location.pathname.split('/').filter(segment => segment);
			Logger.log(`DOMHelper.getUrlDirectory: Retrieved directory segments`, { directory });
			return directory;
		} catch (error) {
			Logger.error(`DOMHelper.getUrlDirectory: Error splitting pathname`, { error });
			return [];
		}
	}

	/**
	 * Generates a hash code from the given string.
	 * @param {string} string - The input string.
	 * @returns {number} - The resulting hash code.
	 */
	hashCode(string) {
		let hash = 0;
		if (!string || string.length === 0) return hash;
		try {
			for (let i = 0; i < string.length; i++) {
				const chr = string.charCodeAt(i);
				hash = ((hash << 5) - hash) + chr;
				hash |= 0; // Convert to 32bit integer
			}
			Logger.log(`DOMHelper.hashCode: Generated hash`, { string, hash });
		} catch (error) {
			Logger.error(`DOMHelper.hashCode: Error generating hash for "${string}"`, { error });
		}
		return hash;
	}
}

window.DOMHelper = DOMHelper;