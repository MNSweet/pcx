// /js/modules/helpers/AsyncHelpers.js

/**
 * Waits for a DOM element matching the selector to appear.
 * @param {string} selector - The CSS selector.
 * @returns {Promise<Element>} Resolves with the element once it is found.
 */
export function waitForElm(selector) {
	return new Promise(resolve => {
		const el = document.querySelector(selector);
		if (el) {
			return resolve(el);
		}
		const observer = new MutationObserver((mutations, obs) => {
			const el = document.querySelector(selector);
			if (el) {
				obs.disconnect();
				resolve(el);
			}
		});
		observer.observe(document.body, { childList: true, subtree: true });
	});
}

/**
 * Waits for an element inside an iframe to appear.
 * @param {string} frameSelector - The CSS selector for the iframe.
 * @param {string} selector - The CSS selector for the element inside the iframe.
 * @returns {Promise<Element>} Resolves with the element once found.
 */
export function waitForIframeElm(frameSelector, selector) {
	return new Promise(resolve => {
		const frame = document.querySelector(frameSelector);
		if (frame && frame.contentWindow && frame.contentWindow.document) {
			const el = frame.contentWindow.document.querySelector(selector);
			if (el) {
				return resolve(el);
			}
			const observer = new MutationObserver((mutations, obs) => {
				const el = frame.contentWindow.document.querySelector(selector);
				if (el) {
					obs.disconnect();
	
