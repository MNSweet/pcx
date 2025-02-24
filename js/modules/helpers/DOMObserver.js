// /js/modules/helpers/DOMObserver.js
class DOMObserver {
	static observers = new Map(); // Stores observer instances keyed by a unique ID
	static idCounter = 0;        // Unique identifier generator

	/**
	 * Starts observing the given node with the provided options and callback.
	 * @param {Node} node - The DOM node to observe.
	 * @param {Object} options - The MutationObserver options.
	 * @param {Function} callback - The function to call when mutations occur.
	 * @returns {number|null} - A unique observer ID, or null if the node is invalid.
	 */
	static observe(node, options, callback) {
		if (!(node instanceof Node)) {
			console.error("DOMObserver.observe: Invalid node provided for observation");
			return null;
		}
		const id = ++this.idCounter;
		try {
			const observer = new MutationObserver((mutations) => {
				callback(mutations);
			});
			observer.observe(node, options);
			this.observers.set(id, { observer, node, options, callback });
			return id;
		} catch (error) {
			console.error("DOMObserver.observe: Failed to observe node:", error);
			return null;
		}
	}

	/**
	 * Removes the observer associated with the given observer ID.
	 * @param {number} observerId - The unique ID returned by observe().
	 */
	static removeObserver(observerId) {
		if (this.observers.has(observerId)) {
			const { observer } = this.observers.get(observerId);
			observer.disconnect();
			this.observers.delete(observerId);
		}
	}

	/**
	 * Disconnects and removes all observers.
	 */
	static disconnectAll() {
		this.observers.forEach(({ observer }) => observer.disconnect());
		this.observers.clear();
	}
}

window.DOMObserver = DOMObserver;
