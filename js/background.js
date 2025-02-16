export class ServiceWorker {
	static options = {
		debug: true,
		domains: {
			pl: "https://prince.iatserv.com/",
			rr: "https://reliable.iatserv.com/",
			pd: "https://pnc.dxresults.com/"
		}
	};

	static timer = 0;
	static timerState = false;

	static log(message) {
		if (ServiceWorker.options.debug) {
			console.log(message);
		}
	}

/**
 * 
 * Side Panel
 * 
 */
	static pageData = {}; // Store processed page data per tab
	static MAX_TABS = 10; // Limit to avoid memory overhead
	static lastUpdateTime = {}; // Track last update per tab
	static THROTTLE_TIME = 500; // Minimum time between updates (ms)

	// Store processed page data per tab with timestamp
	static async storePageData(tabId, data) {
		const now = Date.now();

		// Throttle updates to prevent excessive writes
		if (ServiceWorker.lastUpdateTime[tabId] && (now - ServiceWorker.lastUpdateTime[tabId] < ServiceWorker.THROTTLE_TIME)) {
			return;
		}
		ServiceWorker.lastUpdateTime[tabId] = now;

		// Add timestamp and store data
		ServiceWorker.pageData[tabId] = { timestamp: now, data };

		// Limit number of stored tabs to prevent memory overflow
		if (Object.keys(ServiceWorker.pageData).length > ServiceWorker.MAX_TABS) {
			const oldestTab = Object.keys(ServiceWorker.pageData).reduce((oldest, id) =>
				ServiceWorker.pageData[id].timestamp < ServiceWorker.pageData[oldest].timestamp ? id : oldest
			);
			delete ServiceWorker.pageData[oldestTab];
		}

		// Notify sidebar that new data is available
		chrome.runtime.sendMessage({ action: "pageDataUpdated", tabId });
	}

	// Retrieve stored data for a specific tab
	static async getPageData(tabId, sendResponse) {
		sendResponse({ data: ServiceWorker.pageData[tabId]?.data || null });
	}

	static enableSidebar(tabId = null) {
		let options = {
			enabled: true,
			path: "sidebar.html"
		};

		if (tabId) {
			options.tabId = tabId;
		}

		chrome.sidePanel.setOptions(options).then(() => {
			chrome.runtime.sendMessage({ action: "sidePanelOpened" });
		});
	}

	static toggleSidebar() {
		ServiceWorker.enableSidebar();
	}
	static async getSite(request, sender) {
		ServiceWorker.getCurrentSite().then((site) => {
			chrome.tabs.sendMessage(sender.tab.id, { "action": "returnSite", "site": site }, () => {
				if (chrome.runtime.lastError) console.error("SendMessage Error:", chrome.runtime.lastError);
				console.log("Message sent: returnSite", site);
			});
		}).catch((error) => {
			chrome.tabs.sendMessage(sender.tab.id, { "action": "error", "note": "returnSite failed", "error": error }, () => {
				if (chrome.runtime.lastError) console.error("SendMessage Error:", chrome.runtime.lastError);
				console.error("Error sending returnSite failed:", error);
			});
		});
		return true;
	}

/**
 *
 * Site Detection for tool activation
 * 
 */

	static async handleTabUpdate(tabId, tabUrl) {
		if (!tabUrl || 
			(!tabUrl.startsWith(ServiceWorker.options.domains.pl) && 
			!tabUrl.startsWith(ServiceWorker.options.domains.rr) && 
			!tabUrl.startsWith(ServiceWorker.options.domains.pd))) {
			ServiceWorker.changeExtensionIcon(false);
			await chrome.sidePanel.setOptions({ tabId, enabled: false });
		} else {
			ServiceWorker.changeExtensionIcon(true);
			ServiceWorker.enableSidebar(tabId);
		}
	}

	static changeExtensionIcon(change = false) {
		chrome.action.setIcon({ path: {
			"16": change ? "../icons/alt-icon-16.png" : "../icons/default-icon-16.png",
			"48": change ? "../icons/alt-icon-48.png" : "../icons/default-icon-48.png",
			"128": change ? "../icons/alt-icon-128.png" : "../icons/default-icon-128.png"
		}});
	}

	static async getCurrentSite() {
		return new Promise((resolve, reject) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const url = tabs[0]?.url;
				if (url.includes(ServiceWorker.options.domains.pl)) resolve("PL");
				else if (url.includes(ServiceWorker.options.domains.rr)) resolve("RR");
				else if (url.includes(ServiceWorker.options.domains.pd)) resolve("PD");
				reject("Site not recognized.");
			});
		});
	}

/**
 *
 * Patient Transfer from site to site
 * 
 */


	static initPatientTransfer(request) {
		const matchUrls = Object.values(ServiceWorker.options.domains).map(domain => `*://${domain}/*`);
		ServiceWorker.timer = 30;

		chrome.tabs.query({ url: matchUrls }, (tabs) => {
			tabs.forEach(tab => {
				chrome.tabs.sendMessage(tab.id, { action: 'noticeDisplay', patientData: request.patientData, timer: ServiceWorker.timer });
			});
		});
		clearInterval(ServiceWorker.updateCountdownNotice);
		chrome.storage.local.set({ noticeTimerState: true });

		ServiceWorker.updateCountdownNotice = setInterval(() => {
			chrome.storage.local.get(["noticeTimerState"], (state) => {
				ServiceWorker.timerState = state;
			});
			chrome.tabs.query({ url: matchUrls }, (tabs) => {
				ServiceWorker.timer--;
				tabs.forEach(tab => {
					chrome.tabs.sendMessage(tab.id, { action: 'noticePing', patientData: request.patientData, timer: ServiceWorker.timer });
				});
				if (ServiceWorker.timer <= 0 || !ServiceWorker.timerState) {
					clearInterval(ServiceWorker.updateCountdownNotice);
					if (ServiceWorker.timerState) {
						ServiceWorker.timerState = false;
						chrome.storage.local.set({ noticeTimerState: false });
					}
					chrome.storage.local.set({ patientData: {} });
				}
			});
		}, 1000);
	}

	static clearPTData() {
		chrome.storage.local.remove("patientData");
	}

	static setNotification(request, sendResponse) {
		const { notifId, remindTime, title, message } = request;
		chrome.notifications.create(notifId, {
			type: 'basic',
			iconUrl: 'icon.png',
			title: title,
			message: message,
			priority: 2
		});
		sendResponse({ status: "notification set" });
	}

	static clearReminder(request, sendResponse) {
		chrome.notifications.clear(request.notifId);
		sendResponse({ status: "reminder cleared" });
	}

/**
 *
 * Key Binding Logic
 * 
 */

	static tabWhitelists = {};
	static tabTargets = {};

	static handleOpenWindow(target, url, whitelist) {
		console.log("handleOpenWindow: target=", target, "url=", url, "whitelist=", whitelist);
		if (tabTargets[target]) {
			chrome.tabs.get(tabTargets[target], (tab) => {
				if (chrome.runtime.lastError || !tab) {
					console.error("Error getting tab or tab doesn't exist:", chrome.runtime.lastError);
					ServiceWorker.createNewTab(target, url, whitelist);
				} else if (tab.active) {
					console.log("Reloading active tab:", tab.id);
					chrome.tabs.reload(tab.id, () => {
						if (chrome.runtime.lastError) console.error("Reload Error:", chrome.runtime.lastError);
					});
				} else {
					console.log("Switching to existing tab:", tab.id);
					chrome.tabs.update(tabTargets[target], { active: true }, () => {
						if (chrome.runtime.lastError) console.error("Update Error:", chrome.runtime.lastError);
					});
				}
			});
		} else {
			console.log("Creating new tab for target:", target);
			ServiceWorker.createNewTab(target, url, whitelist);
		}
	}

	static createNewTab(target, url, whitelist) {
		console.log("Creating new tab with url:", url);
		chrome.tabs.create({ url }, (tab) => {
			if (chrome.runtime.lastError) console.error("Create Tab Error:", chrome.runtime.lastError);
			tabTargets[target] = tab.id;
			tabWhitelists[tab.id] = whitelist;
			console.log("New tab created with id:", tab.id);
		});
	}
}

/**
 *
 * On Message Listender
 * 
 */

	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log("Received message:", message, "from sender:", sender);
	// Key Bindings
		if (message.action === "openWindow") {
			ServiceWorker.handleOpenWindow(message.target, message.url, message.whitelist);
		}

	// Side Panel
		if (message.action === "storePageData") {
			let tabId = sender.tab.id; // Only available in background.js
			ServiceWorker.storePageData(tabId, message.data);
		}
		if (message.action === "getStoredPageData") {
			ServiceWorker.getPageData(message.tabId, sendResponse);
		}

	// Routing
		if (message.action === 'initPatientTransfer') {
			ServiceWorker.initPatientTransfer(message);
		}
		if (message.action === 'clearPTData') {
			ServiceWorker.clearPTData();
		}
		if (message.action === 'setNotification') {
			ServiceWorker.setNotification(message, sendResponse);
		}
		if (message.action === 'clearReminder') {
			ServiceWorker.clearReminder(message, sendResponse);
		}
		if (message.action === "getSite") {
			ServiceWorker.getSite(message, sender);
		}
		return true;
	});

/**
 *
 * onCommitted Listener
 * 
 * Fired when a navigation is committed. At least part of the new document
 * has been received from the server and the browser has decided to switch
 * to the new document.
 * 
 */


	chrome.webNavigation.onCommitted.addListener((details) => {
	// Key Bindings
		const whitelist = tabWhitelists[details.tabId];
		if (!whitelist) return;
		const isAllowed = whitelist.some(keyword => details.url.includes(keyword));
		if (!isAllowed) {
			delete tabWhitelists[details.tabId];
			const targetName = Object.keys(tabTargets).find(key => tabTargets[key] === details.tabId);
			if (targetName) delete tabTargets[targetName];
		}
	}, { url: [{ schemes: ["http", "https"] }] });

/**
 *
 * onRemoved Listener
 * 
 * A tab is deleted from the window
 * 
 */
	chrome.tabs.onRemoved.addListener((tabId) => {
	// Key Bindings
		delete tabWhitelists[tabId];
		const targetName = Object.keys(tabTargets).find(key => tabTargets[key] === tabId);
		if (targetName) delete tabTargets[targetName];
	});

	// Side Panel
	chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

	chrome.tabs.onActivated.addListener((info) => {
	// Side Panel
		chrome.tabs.get(info.tabId, (tab) => {
			ServiceWorker.handleTabUpdate(tab.id, tab.url);
		});
	});

	chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
	// Side Panel
		if (change.url) {
			ServiceWorker.handleTabUpdate(tabId, change.url);
		}
	});


/**
 *
 * onInstalled
 *
 * Initial activation, Refresh, De-/Re-activation
 * 
 */

	chrome.runtime.onInstalled.addListener(async () => {
		await new Promise((resolve) => {
			chrome.storage.local.remove(["pcx_permissions"], () => {
				resolve();
			});
		}); // Clear cached permissions

		// Fetch fresh permissions.json
		try {
			const response = await fetch(chrome.runtime.getURL("js/data/permissions.json"));
			const permissions = await response.json();

			// Store the fresh permissions in Chrome storage
			await new Promise((resolve) => {
				chrome.storage.local.set({ ["pcx_permissions"]: permissions }, () => {
					resolve();
				});
			});
			console.log("Permission Meta has been refreshed due to extension reload.");
		} catch (error) {
			console.error("Failed to refresh permissions.json", error);
		}
		await new Promise((resolve) => {
				chrome.storage.local.get(["pcx_permissions"], (result) => {
					if(!result) {
						chrome.storage.local.set({["pcx_permissions"]: "{}"},() => {resolve();})
					}
				}
			);
		});
	});

/**
 *
 * Storage onChanged
 * 
 */
	chrome.storage.onChanged.addListener((changes, namespace) => {
		for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
			/*console.log(
				`Storage key `,key,` in namespace `,namespace,` changed.`,
				`Old value was `,oldValue,` new value is:`,newValue
			);*/
		}
	});