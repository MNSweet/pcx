// /js/modules/helpers/AsyncHelpers.js
Logger.file("AsyncHelpers");

/**
 * Waits for a DOM element matching the selector to appear.
 * @param {string} selector - The CSS selector.
 * @returns {Promise<Element>} Resolves with the element once it is found.
 */
function waitForElm(selector) {
	return new Promise(resolve => {
		try {
			const el = document.querySelector(selector);
			if (el) {
				return resolve(el);
			}
			DOMObserver.observe(document.body, { childList: true, subtree: true }, (mutations) => {
				const el = document.querySelector(selector);
				if (el) {
					resolve(el);
					DOMObserver.removeObserver(document.body, { childList: true, subtree: true }); // Disconnect after resolve
				}
			});
		} catch (error) {
			console.error("Failed to observe node:", error);
		}
	});
}

/**
 * Waits for an element inside an iframe to appear.
 * @param {string} frameSelector - The CSS selector for the iframe.
 * @param {string} selector - The CSS selector for the element inside the iframe.
 * @returns {Promise<Element>} Resolves with the element once found.
 */
function waitForIframeElm(frame, selector) {
	return new Promise(resolve => {
		try {
			const frameDoc = document.querySelector(frame)?.contentWindow.document;
			if (frameDoc && frameDoc.querySelector(selector)) {
				return resolve(frameDoc.querySelector(selector));
			}
			// If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
			DOMObserver.observe(document.body, { childList: true, subtree: true }, (mutations) => {
				if (frameDoc.querySelector(selector)) {
					resolve(frameDoc.querySelector(selector));
					DOMObserver.removeObserver(document.body, { childList: true, subtree: true }); // Disconnect after resolve
				}
			});
		} catch (error) {
			console.error("Failed to observe iframe node:", error);
		}
	});
}

/**
 * Waits X amount of time.
 * @param {int} millseconds 
 * @returns {Promise<Element>} Resolves with the element once found.
 */
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
	
