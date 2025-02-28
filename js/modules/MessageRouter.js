// /js/modules/MessageRouter.js
Logger.log("/js/modules/MessageRouter.js");
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.MessageRouter = factory();
	}
}(this, function () {
"use strict";
class MessageRouter {
	// Map actions to arrays of handler functions.
	static handlers = new Map();

	static {
		// Bind the listener once.
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			MessageRouter.handleMessage(message, sender, sendResponse);
			// Return true to indicate that the response may be sent asynchronously.
			return true;
		});
	}

	/**
	 * Registers a handler for a specific message action.
	 * @param {string} action - The message action to listen for.
	 * @param {function} callback - The function to call when a message with this action is received.
	 */
	static registerHandler(action, callback) {
		if (!MessageRouter.handlers.has(action)) {
			MessageRouter.handlers.set(action, []);
		}
		MessageRouter.handlers.get(action).push(callback);
		Logger.log(`MessageRouter: Registered handler for action "${action}"`);
	}

	/**
	 * Unregisters a previously registered handler.
	 * @param {string} action - The message action.
	 * @param {function} callback - The function to remove.
	 */
	static unregisterHandler(action, callback) {
		if (MessageRouter.handlers.has(action)) {
			const arr = MessageRouter.handlers.get(action);
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
	static handleMessage(message, sender, sendResponse) {
		if (!message || !message.action) {
			Logger.warn("MessageRouter: Received message with no action", { message });
			return;
		}
		const action = message.action;
		const callbacks = MessageRouter.handlers.get(action);
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
	static sendMessage(message) {
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
  return MessageRouter;
}));
