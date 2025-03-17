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
			console.log("CXMR ⎥⊶⎢");
			Logger.messageLog("Persistent port created", {});
			MessageRouter.port.onMessage.addListener((msg) => {
				console.log("CXMR⎥«⊶",msg.action, msg);
				Logger.messageLog("Received message", msg.action, msg);
				MessageRouter.handleMessage(msg);
			});
		}
	}

	/**
	 * Registers a handler for a specific message action.
	 */
	static registerHandler(action, callback) {
			console.log("CXMR⎥ℹ⎢",action,callback);
		try {
			if (!MessageRouter.handlers.has(action)) {
				MessageRouter.handlers.set(action, []);
			}
			MessageRouter.handlers.get(action).push(callback);
			Logger.messageLog(action, "Handler registered");
			console.log("CXMR⎥ℹ⎢",action);
		} catch (err) {
			Logger.messageLog(action, "Error registering handler", { error: err });
		}
	}

	/**
	 * Routes incoming messages to registered handlers.
	 */
	static handleMessage(message) {
		console.log("CXMR⎥«", message.action);
		if (!message || !message.action) {
			console.log("CXMR⎥!⎢ No message and/or action", message);
			Logger.warn("CXMR: Received message with no action", { message });
			return;
		}
		const action = message.action;
		const callbacks = MessageRouter.handlers.get(action);
		console.log("CXMR", action, callbacks);
		if (callbacks && callbacks.length > 0) {
			callbacks.forEach((callback) => {
				try {
					Logger.messageLog(action, "Processing message", { message });
					callback(message);
				} catch (error) {
					console.log("CXMR⎥!⎢ Error in handler for action", action, error);
					Logger.error(`CXMR: Error in handler for action "${action}"`, { error });
				}
			});
		} else {
			console.log("CXMR⎥!⎢ No handler registered for action", action);
			Logger.warn(`CXMR: No handler registered for action "${action}"`);
		}
	}

	/**
	 * Sends a message over the persistent port.
	 */
	static sendMessage(message) {
		MessageRouter.init();
		try {
			MessageRouter.port.postMessage(message);
			console.log("CXMR »⎢",message.action, message);
			Logger.messageLog(message.action, "Sent", { message });
		} catch (err) {
			Logger.error("CXMR: Error sending message", { error: err });
		}
	}
}

MessageRouter.init();