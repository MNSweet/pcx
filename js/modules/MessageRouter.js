// /js/modules/MessageRouter.js
Logger.file("MessageRouter");

class MessageRouter {
	static port = null;
	static handlers = new Map();

	/**
	 * Initializes the persistent port (if not already open).
	 */
	static init() {
		if (!MessageRouter.port) {
			MessageRouter.port = chrome.runtime.connect({ name: "persistentChannel" });
			Logger.messageLog("Persistent port created", Icon.Port);
			MessageRouter.port.onMessage.addListener((msg) => {
				Logger.messageLog("Received message", Icon.Listener, {msg});
				MessageRouter.handleMessage(msg);
			});
		}
	}

	/**
	 * Registers a handler for a specific message action.
	 */
	static registerHandler(action, callback) {
		try {
			if (!MessageRouter.handlers.has(action)) {
				MessageRouter.handlers.set(action, []);
			}
			MessageRouter.handlers.get(action).push(callback);
			Logger.messageLog(`Registered ${action}`, Icon.Info);
		} catch (err) {
			Logger.messageLog(`Error registering handler ${action}`, Icon.Error, { error: err });
		}
	}

	/**
	 * Routes incoming messages to registered handlers.
	 */
	static handleMessage(message) {
		if (!message || !message.action) {
			Logger.messageLog("No message and/or action",Icon.Error, { message });
			return;
		}
		const action = message.action;
		const callbacks = MessageRouter.handlers.get(action);
		if (callbacks && callbacks.length > 0) {
			callbacks.forEach((callback) => {
				try {
					callback(message);
				} catch (error) {
					Logger.messageLog(`Error in handler for ${action}`,Icon.Error, { error });
				}
			});
		} else {
			Logger.messageLog(`No handler registered for action "${action}"`,Icon.Error);
		}
	}

	/**
	 * Sends a message over the persistent port.
	 */
	static sendMessage(message) {
		MessageRouter.init();
		try {
			MessageRouter.port.postMessage(message);
			Logger.messageLog(message.action, Icon.Outgoing, { message });
		} catch (err) {
			Logger.messageLog("Error sending message", Icon.Error, { error: err });
		}
	}
}

MessageRouter.init();