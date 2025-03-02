// /js/serviceworker/SWMessageRouter.js
import SWLogger from './SWLogger.js';
SWLogger.log("/js/modules/SWMessageRouter.js");


export class SWMessageRouter {
	// Map actions to arrays of handler functions.
	static handlers = new Map();

	// Static initialization block for setting up the onMessage listener.
	static {
		try {
			chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
				try {
					SWMessageRouter.handleMessage(message, sender, sendResponse);
				} catch (err) {
					SWLogger.error("SWMessageRouter: Error handling message", { error: err, message, sender });
				}
				// Return true to indicate that the response may be sent asynchronously.
				return true;
			});
		} catch (err) {
			SWLogger.error("SWMessageRouter: Failed to initialize message listener", { error: err });
		}
	}

	/**
	 * Registers a handler for a specific message action.
	 * @param {string} action - The message action to listen for.
	 * @param {function} callback - The function to call when a message with this action is received.
	 */
	static registerHandler(action, callback) {
		try {
			if (!SWMessageRouter.handlers.has(action)) {
				SWMessageRouter.handlers.set(action, []);
			}
			SWMessageRouter.handlers.get(action).push(callback);
			SWLogger.log(`SWMessageRouter: Registered handler for action "${action}"`);
		} catch (err) {
			SWLogger.error(`SWMessageRouter: Error registering handler for action "${action}"`, { error: err });
		}
	}

	/**
	 * Unregisters a previously registered handler.
	 * @param {string} action - The message action.
	 * @param {function} callback - The function to remove.
	 */
	static unregisterHandler(action, callback) {
		try {
			if (SWMessageRouter.handlers.has(action)) {
				const arr = SWMessageRouter.handlers.get(action);
				const index = arr.indexOf(callback);
				if (index !== -1) {
					arr.splice(index, 1);
					SWLogger.log(`SWMessageRouter: Unregistered handler for action "${action}"`);
				}
			}
		} catch (err) {
			SWLogger.error(`SWMessageRouter: Error unregistering handler for action "${action}"`, { error: err });
		}
	}

	/**
	 * Dispatches incoming messages to the registered handlers.
	 * @param {Object} message - The incoming message.
	 * @param {Object} sender - Information about the sender.
	 * @param {function} sendResponse - Function to send a response.
	 */
	static handleMessage(message, sender, sendResponse) {
		if (!message || !message.action) {
			SWLogger.warn("SWMessageRouter: Received message with no action", { message });
			return;
		}
		const action = message.action;
		const callbacks = SWMessageRouter.handlers.get(action);
		if (callbacks && callbacks.length > 0) {
			SWLogger.log(`SWMessageRouter: Handling action "${action}"`, { message, sender });
			// Invoke all handlers for this action.
			callbacks.forEach((cb) => {
				try {
					cb(message, sender, sendResponse);
				} catch (error) {
					SWLogger.error(`SWMessageRouter: Error in handler for action "${action}"`, { error });
				}
			});
		} else {
			SWLogger.warn(`SWMessageRouter: No handler registered for action "${action}"`);
		}
	}

	/**
	 * A convenience method to send a message.
	 * @param {Object} message - The message to send.
	 * @returns {Promise} Resolves with the response or rejects with an error.
	 */
	static sendMessage(message) {
		return new Promise((resolve, reject) => {
			try {
				chrome.runtime.sendMessage(message, (response) => {
					if (chrome.runtime.lastError) {
						SWLogger.error("SWMessageRouter.sendMessage: Error sending message", { error: chrome.runtime.lastError });
						return reject(chrome.runtime.lastError);
					}
					resolve(response);
				});
			} catch (err) {
				SWLogger.error("SWMessageRouter.sendMessage: Exception caught when sending message", { error: err });
				reject(err);
			}
		});
	}
}
export default SWMessageRouter;

