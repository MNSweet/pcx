// /js/modules/helpers/DOMHelper.js
Logger.log("DOMHelper Loaded","INIT");

class DOMHelper {
	// Private cache for DOM elements
	static _elementCache = new Map();

	static events = {
		Space	: {bubbles: true, cancelable: true,	key: ' '},
		Delete	: {bubbles: true, cancelable: true,	shiftKey: false, keyCode: 8,	code: "BACKSPACE",	key: "BACKSPACE"},
		End		: {bubbles: true, cancelable: true,	shiftKey: false, keyCode: 35,	code: "END",		key: "END"},
		Tab		: {bubbles: true, cancelable: true,	shiftKey: false, keyCode: 9,	code: "TAB",		key: "TAB"},
		Enter	: {bubbles: true, cancelable: false,shiftKey: false, keyCode: 13,	code: "ENTER",		key: "ENTER"},
	};

	/**
	 * Finds a single DOM element matching the given selector.
	 * @param {string} selector - The CSS selector.
	 * @returns {Element|null} - The first matching element or null if not found.
	 */
	static findEl(selector) {
		try {
			const el = document.querySelector(selector);
			Logger.log(`findEl located "${selector}"`,"Scan", { element: el });
			return el;
		} catch (error) {
			Logger.error(`findEl: Error querying selector "${selector}"`,"Scan", { error });
			return null;
		}
	}

	/**
	 * Finds all DOM elements matching the given selector.
	 * @param {string} selector - The CSS selector.
	 * @returns {NodeListOf<Element>} - The list of matching elements.
	 */
	static findEls(selector) {
		try {
			const els = document.querySelectorAll(selector);
			Logger.log(`findEls located "${selector.length}" elements`,"Scan", { elements: els });
			return els;
		} catch (error) {
			Logger.error(`findEls: Error querying selector "${JSON.stringify(selector)}"`,"Scan", { error });
			return [];
		}
	}

	/**
	 * Returns a cached element if available; otherwise queries the DOM, caches, and returns it.
	 * @param {string} selector - The CSS selector.
	 * @param {boolean} [requery=false] - If true, bypass the cache and query again.
	 * @returns {Element|null} - The found element or null if not found.
	 */
	static getEl(selector, requery = false) {
		if (!requery && DOMHelper._elementCache.has(selector)) {
			Logger.log(`getEl retrieved "${selector}" from cache`,"Scan");
			return DOMHelper._elementCache.get(selector);
		}
		const el = DOMHelper.findEl(selector);
		DOMHelper._elementCache.set(selector, el);
		return el;
	}

	/**
	 * Returns cached elements if available; otherwise queries the DOM, caches, and returns them.
	 * @param {string} selector - The CSS selector.
	 * @param {boolean} [requery=false] - If true, bypass the cache and query again.
	 * @returns {NodeListOf<Element>} - The found elements.
	 */
	static getEls(selector, requery = false) {
		if (!requery && DOMHelper._elementCache.has(selector)) {
			Logger.log(`getEls retrieved "${selector.length}" elements from cache`,"Scan");
			return DOMHelper._elementCache.get(selector);
		}
		const els = DOMHelper.findEls(selector);
		DOMHelper._elementCache.set(selector, els);
		return els;
	}

	/**
	 * Clears the entire cache or a specific selector from the cache.
	 * @param {string} [selector] - Optional CSS selector to clear from cache.
	 */
	static clearCache(selector) {
		if (selector) {
			DOMHelper._elementCache.delete(selector);
			Logger.log(`clearCache: Cleared cache for selector "${JSON.stringify(selector)}"`,"Scan");
		} else {
			DOMHelper._elementCache.clear();
			Logger.log(`clearCache: Cleared entire cache`,"Scan");
		}
	}

	/**
	 * Creates a new DOM element of the specified type and applies the given properties.
	 * @param {string} domType - The type of element to create (e.g., 'div', 'span').
	 * @param {Object} properties - An object of properties to assign to the element.
	 * @returns {Element|null} - The newly created element, or null if creation fails.
	 */
	static createDOM(domType, properties = {}) {
		try {
			const element = document.createElement(domType);
			DOMHelper.applyAttributes(element, properties);
			Logger.log(`createDOM: Created "${domType}"`, "Modify", { properties });
			return element;
		} catch (error) {
			Logger.error(`createDOM: Error creating element "${domType}"`, "Modify", { error, properties });
			return null;
		}
	}
	static applyAttributes(element, attributes) {
		for (const key in attributes) {
			if (attributes.hasOwnProperty(key)) {
				if (typeof attributes[key] === 'object' && attributes[key] !== null) {
					// Recursive application for nested objects (like 'style')
					DOMHelper.applyAttributes(element[key], attributes[key]);
				} else {
					// Direct attribute assignment
					element[key] = attributes[key];
				}
			}
		}
	}

	/**
	 * Simulates a keyboard event on the provided element.
	 * @param {Element} element - The target element.
	 * @param {Object} opts - Options for the keyboard event (e.g., key, keyCode).
	 * @param {string} [type='keydown'] - The type of event to simulate.
	 * @returns {boolean} - True if the event was dispatched; false otherwise.
	 */
	static simulateUserKey(element, opts, type = 'keydown') {
		if (!element || typeof opts !== 'object') {
			Logger.warn(`simulateUserKey: Invalid element or options`,"Interact", { element, opts });
			return false;
		}
		const defaults = { bubbles: true, cancelable: true, key: "", shiftKey: false, keyCode: 0 };
		const options = { ...defaults, ...opts };
		try {
			const event = new KeyboardEvent(type, options);
			element.dispatchEvent(event);
			Logger.log(`simulateUserKey: Simulated "${options.key}" on element "${element.id || element.tagName}"`,"Interact", { options });
			return true;
		} catch (error) {
			Logger.error(`simulateUserKey: Error dispatching event on element "${element.id || element.tagName}"`,"Interact", { error, options });
			return false;
		}
	}

	/**
	 * Copies text to the clipboard.
	 * @param {string} text - The text to copy.
	 * @returns {Promise<void>}
	 */
	static async copyToClipboard(text) {
		try {
			await navigator.clipboard.writeText(text);
			Logger.log(`copyToClipboard: Copied text successfully`,"Interact", { text });
		} catch (error) {
			Logger.error(`copyToClipboard: Failed to copy text`,"Interact", { error, text });
		}
	}

	/**
	 * Reads text from the clipboard.
	 * @returns {Promise<string|null>} - The text from the clipboard or null on error.
	 */
	static async readFromClipboard() {
		try {
			const text = await navigator.clipboard.readText();
			Logger.log(`readFromClipboard: Read text successfully`,"Interact", { text });
			return text;
		} catch (error) {
			Logger.error(`readFromClipboard: Failed to read clipboard`,"Interact", { error });
			return null;
		}
	}

	/**
	 * Retrieves URL parameters as a plain object.
	 * @returns {Object} - An object mapping query parameter keys to values.
	 */
	static getUrlParams() {
		const params = {};
		try {
			const urlParams = new URLSearchParams(window.location.search);
			for (const [key, value] of urlParams.entries()) {
				params[key] = value;
			}
			Logger.log(`getUrlParams: Retrieved parameters`,"URL", { params });
		} catch (error) {
			Logger.error(`getUrlParams: Error parsing URL parameters`,"URL", { error });
		}
		return params;
	}

	/**
	 * Splits the current pathname into segments, excluding empty segments.
	 * @returns {string[]} - An array of non-empty path segments.
	 */
	static getUrlDirectory() {
		try {
			const directory = window.location.pathname.split('/').filter(segment => segment);
			Logger.log(`getUrlDirectory: Retrieved directory segments`,"URL", { directory });
			return directory;
		} catch (error) {
			Logger.error(`getUrlDirectory: Error splitting pathname`,"URL", { error });
			return [];
		}
	}

	/**
	 * Generates a hash code from the given string.
	 * @param {string} string - The input string.
	 * @returns {number} - The resulting hash code.
	 */
	static hashCode(string) {
		let hash = 0;
		if (!string || string.length === 0) return hash;
		try {
			for (let i = 0; i < string.length; i++) {
				const chr = string.charCodeAt(i);
				hash = ((hash << 5) - hash) + chr;
				hash |= 0; // Convert to 32bit integer
			}
			Logger.log(`hashCode: Generated hash`,"ID", { string, hash });
		} catch (error) {
			Logger.error(`hashCode: Error generating hash for "${string}"`,"ID", { error });
		}
		return hash;
	}

	/**
	 * Generates a hash code from the given string.
	 * @param {Array} elements - Array of input selectors.
	 * @param {string} iframe - If applicable, the iframe selector.
	 */
	static disableTabIndex(elements,iframe="") {
		elements.forEach((selector) => {
			if(iframe!="") {
				Logger.log(`Removing tabindex for ${elements.length} inputs from iframe ${iframe}`,"Modify", elements);
				DOMHelper.getEl(iframe).contentWindow.document.querySelector(selector).setAttribute("tabindex","-1");
			} else {
				Logger.log(`Removing tabindex for ${elements.length} inputs`,"Modify", elements);
				DOMHelper.getEl(selector).setAttribute("tabindex","-1");
			}
		});
	}
}

window.DOMHelper = DOMHelper;