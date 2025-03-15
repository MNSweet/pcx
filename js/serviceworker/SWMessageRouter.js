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
	// Each value is an object: { port, domain, url, tabId, isSidePanel }
	static portMap = new Map();

	static init() {
		chrome.runtime.onConnect.addListener((port) => {
			if (port.name === "persistentChannel") {
				SWLogger.log("SWMessageRouter: Persistent channel connected", port.sender);
				// Ensure we have tab information.
				if (port.sender && port.sender.tab) {
					const tabId = port.sender.tab.id;
					let url = port.sender.tab.url || "";
					let domain = "";
					let isSidePanel = false;
					try {
						const parsedUrl = new URL(url);
						domain = parsedUrl.hostname;
						// If the URL includes "SidePanel.html", mark it as a side panel.
						isSidePanel = url.includes("SidePanel.html");
					} catch (e) {
						SWLogger.warn("SWMessageRouter: Could not parse tab URL", { url, error: e });
					}
					SWMessageRouter.portMap.set(tabId, { port, domain, url, tabId, isSidePanel });
				}
				// Listen for messages on this port.
				port.onMessage.addListener((msg) => {
					SWLogger.log("SWMessageRouter: Received persistent message", msg.action, { msg });
					SWMessageRouter.handleMessage(msg, port.sender, (response) => {
						port.postMessage(response);
					});
				});
				// Clean up when the port disconnects.
				port.onDisconnect.addListener(() => {
					if (port.sender && port.sender.tab) {
						const tabId = port.sender.tab.id;
						SWLogger.log("SWMessageRouter: Persistent channel disconnected", { tabId });
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
		if (!message || !message.action) {
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
	 * Broadcasts a message to tabs filtered by the provided filter.
	 * Filter options:
	 *   "ALL" (default) - all domains and side panels
	 *   "SITES" - all domains only (excludes side panels)
	 *   "SP" - side panels only
	 *   "PL" - only tabs with domain "prince.iatserv.com"
	 *   "RR" - only tabs with domain "reliable.iatserv.com"
	 *   "PD" - only tabs with domain "pnc.dxresults.com"
	 *
	 * @param {string} filter - The filter string.
	 * @param {Object} message - The message to broadcast.
	 */
	static broadcastToTabs(filter = "ALL", message) {
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
			// Only send if within allowed domains.
			if (send) {
				try {
					port.postMessage(message);
				} catch (err) {
					SWLogger.error("SWMessageRouter.broadcastToTabs: Error sending message", { error: err });
				}
			}
		});
	}

	/**
	 * Broadcasts a message to the currently active tab.
	 * Uses chrome.tabs.query to determine the active tab and sends the message to its persistent port.
	 *
	 * @param {Object} message - The message to send.
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
					SWLogger.warn("SWMessageRouter.broadcastToActive: No persistent port found for active tab", { activeTabId });
				}
			}
		});
	}

	/**
	 * Checks all persistent ports and disconnects those whose URL is outside the allowed domains.
	 * This helps ensure that ports for non-tracked domains are removed.
	 */
	static cleanupPorts() {
		SWMessageRouter.portMap.forEach((data, tabId) => {
			const { port, domain, isSidePanel } = data;
			// Allow side panel regardless of domain.
			if (!isSidePanel && !allowedDomains.includes(domain)) {
				try {
					port.disconnect();
					SWLogger.log("SWMessageRouter.cleanupPorts: Disconnecting port for tab", { tabId, domain });
				} catch (err) {
					SWLogger.error("SWMessageRouter.cleanupPorts: Error disconnecting port", { error: err });
				}
				SWMessageRouter.portMap.delete(tabId);
			}
		});
	}

	/**
	 * Convenience method to send an ephemeral message (if needed).
	 * Retained for backward compatibility.
	 * @param {Object} message 
	 * @returns {Promise}
	 */
	static sendMessage(message) {
		return new Promise((resolve, reject) => {
			try {
				chrome.runtime.sendMessage(message, (response) => {
					if (chrome.runtime.lastError) {
						SWLogger.error("SWMessageRouter.sendMessage: Error sending message", { error: chrome.runtime.lastError });
						return reject(chrome.runtime.lastError.message);
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

SWMessageRouter.init();

// Tab Specific Garbage Collection
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.url) {
		try {
			const parsedUrl = new URL(changeInfo.url);
			const domain = parsedUrl.hostname;
			// Check if the updated domain is allowed.
			if (!allowedDomains.includes(domain)) {
				const portData = SWMessageRouter.portMap.get(tabId);
				// Disconnect only if this isn’t a side panel.
				if (portData && !portData.isSidePanel) {
					portData.port.disconnect();
					SWLogger.log("SWMessageRouter: Disconnected port due to domain change", { tabId, domain });
					SWMessageRouter.portMap.delete(tabId);
				}
			}
		} catch (err) {
			SWLogger.error("SWMessageRouter: Error parsing updated URL", { error: err, tabId });
		}
	}
});

// General Garbage Collection for Redundancy
setInterval(() => {
	SWMessageRouter.cleanupPorts();
}, 300000); // 5 minutes

export default SWMessageRouter;
