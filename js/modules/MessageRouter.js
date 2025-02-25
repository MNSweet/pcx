// /js/modules/MessageRouter.js
import { Logger } from "./helpers/Logger.js";

class MessageRouter {
	constructor() {
		// Map actions to arrays of handler functions.
		this.handlers = new Map();
		// Bind the listener once.
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			this.handleMessage(message, sender, sendResponse);
			// Return true to indicate that the response may be sent asynchronously.
			return true;
		});
	}

	/**
	 * Registers a handler for a specific message action.
	 * @param {string} action - The message action to listen for.
	 * @param {function} callback - The function to call when a message with this action is received.
	 */
	registerHandler(action, callback) {
		if (!this.handlers.has(action)) {
			this.handlers.set(action, []);
		}
		this.handlers.get(action).push(callback);
		Logger.log(`MessageRouter: Registered handler for action "${action}"`);
	}

	/**
	 * Unregisters a previously registered handler.
	 * @param {string} action - The message action.
	 * @param {function} callback - The function to remove.
	 */
	unregisterHandler(action, callback) {
		if (this.handlers.has(action)) {
			const arr = this.handlers.get(action);
			const index = arr.indexOf(callback);
			if (index !== -1) {
				arr.splice(index, 1);
				Logger.log(`MessageRouter: Unregistered handler for action "${action}"`);
			}
		}
	}

	/**
	 * Dispatches incoming messages to the registered handlers.
	 * @param {Object} message - The incoming message.
	 * @param {Object} sender - Information about the sender.
	 * @param {function} sendResponse - Function to send a response.
	 */
	handleMessage(message, sender, sendResponse) {
		if (!message || !message.action) {
			Logger.warn("MessageRouter: Received message with no action", { message });
			return;
		}
		const action = message.action;
		const callbacks = this.handlers.get(action);
		if (callbacks && callbacks.length > 0) {
			Logger.log(`MessageRouter: Handling action "${action}"`, { message, sender });
			// Invoke all handlers for this action.
			callbacks.forEach((cb) => {
				try {
					cb(message, sender, sendResponse);
				} catch (error) {
					Logger.error(`MessageRouter: Error in handler for action "${action}"`, { error });
				}
			});
		} else {
			Logger.warn(`MessageRouter: No handler registered for action "${action}"`);
		}
	}

	/**
	 * A convenience method to send a message.
	 * @param {Object} message - The message to send.
	 * @returns {Promise} Resolves with the response or rejects with an error.
	 */
	sendMessage(message) {
		return new Promise((resolve, reject) => {
			chrome.runtime.sendMessage(message, (response) => {
				if (chrome.runtime.lastError) {
					Logger.error("MessageRouter.sendMessage: Error sending message", { error: chrome.runtime.lastError });
					return reject(chrome.runtime.lastError);
				}
				resolve(response);
			});
		});
	}
}

export const messageRouter = new MessageRouter();
