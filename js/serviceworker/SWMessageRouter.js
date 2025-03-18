// /js/serviceworker/SWMessageRouter.js
import SWLogger from './SWLogger.js';

SWLogger.log("SWMessageRouter Loaded", "INIT");

const allowedDomains = [
	"prince.iatserv.com",
	"reliable.iatserv.com",
	"pnc.dxresults.com"
];

export class SWMessageRouter {
	static handlers = new Map();
	// Map of persistent ports keyed by tab id.
	static portMap = new Map();

	static init() {
		chrome.runtime.onConnect.addListener((port) => {
			if (port.name === "persistentChannel") {
				SWLogger.log("SWMessageRouter: Persistent channel connected", port.sender);
				console.log("SWMR ⎥⊶⎢");
				let tabId;
				let url = "";
				let domain = "";
				let isSidePanel = false;
				if (port.sender && port.sender.tab) {
					// Normal tab.
					tabId = port.sender.tab.id;
					url = port.sender.tab.url || "";
					try {
						const parsedUrl = new URL(url);
						domain = parsedUrl.hostname;
						isSidePanel = url.includes("SidePanel.html");
					} catch (e) {
						SWLogger.warn("SWMessageRouter: Could not parse tab URL", { url, error: e });
					}
				} else {
					// Side panel.
					tabId = "sidePanel";
					url = port.sender && port.sender.url ? port.sender.url : "";
					domain = "sidePanel";
					isSidePanel = true;
				}
				SWMessageRouter.portMap.set(tabId, { port, domain, url, tabId, isSidePanel });

				// Listen for messages on this port.
				port.onMessage.addListener((msg) => {
					console.log("SWMR⎥«⊶",msg.action, msg);
					SWLogger.log("SWMessageRouter: Received message", "", { msg });
					SWMessageRouter.handleMessage(msg, port.sender, (response) => {
						port.postMessage(response);
					});
				});
				port.onDisconnect.addListener(() => {
					if (port.sender && port.sender.tab) {
						const tabId = port.sender.tab.id;
						SWLogger.log("SWMessageRouter: Port disconnected", { tabId });
						SWMessageRouter.portMap.delete(tabId);
					}
				});
			}
		});
	}

	static registerHandler(action, callback) {
		try {
			if (!SWMessageRouter.handlers.has(action)) {
				SWMessageRouter.handlers.set(action, []);
			}
			SWMessageRouter.handlers.get(action).push(callback);
			SWLogger.log(`SWMessageRouter: Registered handler for action "${action}"`, action);
			console.log("SWMR⎥ℹ⎢",action);
		} catch (err) {
			SWLogger.error(`SWMessageRouter: Error registering handler for action "${action}"`, action, { error: err });
		}
	}

	static unregisterHandler(action, callback) {
		try {
			if (SWMessageRouter.handlers.has(action)) {
				const arr = SWMessageRouter.handlers.get(action);
				const index = arr.indexOf(callback);
				if (index !== -1) {
					arr.splice(index, 1);
					SWLogger.log(`SWMessageRouter: Unregistered handler for action "${action}"`, action);
				}
			}
		} catch (err) {
			SWLogger.error(`SWMessageRouter: Error unregistering handler for action "${action}"`, action, { error: err });
		}
	}

	static handleMessage(message, sender, sendResponse) {
		console.log("SWMR⎥«", message.action, sender);
		if (!message || !message.action) {
			console.log("SWMR⎥!⎢ No message and/or action", message);
			SWLogger.warn("SWMessageRouter: Received message with no action", { message }, "NullAction");
			return;
		}
		const action = message.action;
		const callbacks = SWMessageRouter.handlers.get(action);
		if (callbacks && callbacks.length > 0) {
			SWLogger.log(`SWMessageRouter: Handling action "${action}"`, action, { message, sender });
			callbacks.forEach((cb) => {
				try {
					cb(message, sender, sendResponse);
				} catch (error) {
					SWLogger.error(`SWMessageRouter: Error in handler for action "${action}"`, action, { error });
				}
			});
		} else {
			SWLogger.warn(`SWMessageRouter: No handler registered for action "${action}"`, action);
		}
	}

	/**
	 * Helper function to broadcast a message to all connected ports.
	 * (For demonstration, not necessarily used in a request/response cycle.)
	 */
	static broadcastToTabs(filter = "ALL", message) {
		console.log("SWMessageRouter: Broadcasting message", filter, { message });
			console.log(SWMessageRouter.portMap);
		SWLogger.log("SWMessageRouter: Broadcasting message", filter, { message });
		SWMessageRouter.portMap.forEach((data, tabId) => {
			const { port, domain, isSidePanel } = data;
			let send = false;
			switch (filter.toUpperCase()) {
				case "ALL":
					send = true;
					break;
				case "SITES":
					send = !isSidePanel;
					break;
				case "SP":
					send = isSidePanel;
					break;
				case "PL":
					send = domain === "prince.iatserv.com";
					break;
				case "RR":
					send = domain === "reliable.iatserv.com";
					break;
				case "PD":
					send = domain === "pnc.dxresults.com";
					break;
				default:
					send = true;
			}
			if (send) {
				try {
					port.postMessage(message);
				} catch (err) {
					SWLogger.error(`SWMessageRouter.broadcastToTabs: Error sending message for ${filter.toUpperCase()}`, { error: err });
				}
			}
		});
	}

	/**
	 * For completeness, a helper to send a message to the active tab.
	 */
	static broadcastToActive(message) {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs && tabs[0]) {
				const activeTabId = tabs[0].id;
				const data = SWMessageRouter.portMap.get(activeTabId);
				if (data && data.port) {
					try {
						data.port.postMessage(message);
					} catch (err) {
						SWLogger.error("SWMessageRouter.broadcastToActive: Error sending message", { error: err });
					}
				} else {
					SWLogger.warn("SWMessageRouter.broadcastToActive: No port for active tab", { activeTabId });
				}
			}
		});
	}
}

SWMessageRouter.init();
export default SWMessageRouter;