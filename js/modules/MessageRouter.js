// /js/modules/MessageRouter.js
Logger.log("MessageRouter Loaded", "INIT");

class MessageRouter {
	static port = null;
	static handlers = new Map();

	/**
	 * Initializes the persistent port (if not already open).
	 */
	static init() {
		if (!MessageRouter.port) {
			MessageRouter.port = chrome.runtime.connect({ name: "persistentChannel" });
			MessageRouter.port.onMessage.addListener((msg) => {
				Logger.log("MessageRouter: Received persistent message", msg.action, { msg });
				MessageRouter.handleMessage(msg);
			});
		}
	}

	/**
	 * Registers a handler for a specific message action.
	 * @param {string} action - The message action to listen for.
	 * @param {function} callback - The function to call when a message with this action is received.
	 */
	static registerHandler(action, callback) {
		try {
			if (!MessageRouter.handlers.has(action)) {
				MessageRouter.handlers.set(action, []);
			}
			MessageRouter.handlers.get(action).push(callback);
			Logger.log(`MessageRouter: Registered handler for action "${action}"`);
		} catch (err) {
			Logger.error(`MessageRouter: Error registering handler for action "${action}"`, { error: err });
		}
	}

	/**
	 * Unregisters a previously registered handler.
	 * @param {string} action - The message action.
	 * @param {function} callback - The function to remove.
	 */
	static unregisterHandler(action, callback) {
		try {
			if (MessageRouter.handlers.has(action)) {
				const arr = MessageRouter.handlers.get(action);
				const index = arr.indexOf(callback);
				if (index !== -1) {
					arr.splice(index, 1);
					Logger.log(`MessageRouter: Unregistered handler for action "${action}"`);
				}
			}
		} catch (err) {
			Logger.error(`MessageRouter: Error unregistering handler for action "${action}"`, { error: err });
		}
	}

	/**
	 * Routes incoming messages to registered handlers.
	 * @param {Object} message - The incoming message.
	 */
	static handleMessage(message) {
		if (!message || !message.action) {
			Logger.warn("MessageRouter: Received message with no action", { message });
			return;
		}
		const action = message.action;
		const callbacks = MessageRouter.handlers.get(action);
		if (callbacks && callbacks.length > 0) {
			Logger.log(`MessageRouter: Handling action "${action}"`, { message });
			callbacks.forEach((callback) => {
				try {
					callback(message);
				} catch (error) {
					Logger.error(`MessageRouter: Error in handler for action "${action}"`, { error });
				}
			});
		} else {
			Logger.warn(`MessageRouter: No handler registered for action "${action}"`);
		}
	}

	/**
	 * Sends a message over the persistent channel.
	 * @param {Object} message - The message to send.
	 */
	static sendMessage(message) {
		MessageRouter.init();
		try {
			MessageRouter.port.postMessage(message);
			Logger.log("MessageRouter: Sent persistent message", message.action, { message });
		} catch (err) {
			Logger.error("MessageRouter.sendMessage: Error sending persistent message", { error: err });
		}
	}
}

MessageRouter.init();
