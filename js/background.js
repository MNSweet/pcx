class ServiceWorker {
	// --- Configuration Options ---
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
	static dataStore = {};  // In-memory page state storage
	static updateCountdownNotice = null;
	static tabWhitelists = {};
	static tabTargets = {};

	// --- Logging ---
	static log(message) {
		if (ServiceWorker.options.debug) {
			console.log(message);
		}
	}

	// --- Background Initialization & Data Backup ---
	static initBackground() {
		chrome.storage.local.get("dataStore", (result) => {
			if (result.dataStore) {
				ServiceWorker.dataStore = result.dataStore;
				console.log("Data loaded from storage:", ServiceWorker.dataStore);
			}
		});
		// Backup data every minute.
		setInterval(() => {
			ServiceWorker.backupDataToStorage();
		}, 60000);
	}

	static backupDataToStorage() {
		chrome.storage.local.set({ dataStore: ServiceWorker.dataStore }, () => {
			console.log("Backup complete.");
		});
	}

	// --- Tab Data Storage ---
	static storeTabData(tabId, pageState) {
		ServiceWorker.dataStore[tabId] = pageState;
		console.log(`Data stored for tab ${tabId}:`, pageState);
	}

	static getTabData(tabId) {
		return ServiceWorker.dataStore[tabId] || null;
	}

	static removeTabData(tabId) {
		delete ServiceWorker.dataStore[tabId];
		ServiceWorker.backupDataToStorage();
		console.log(`Data removed for tab ${tabId}`);
	}

	// --- Side Panel Functions ---
	static enableSidePanel(tabId = null) {
		let options = {
			enabled: true,
			path: "sidePanel.html"
		};
		if (tabId) {
			options.tabId = tabId;
		}
		chrome.sidePanel.setOptions(options).then(() => {
			chrome.runtime.sendMessage({ action: "sidePanelOpened" });
		});
	}

	// --- Site Detection ---
	static async getCurrentSite() {
		return new Promise((resolve, reject) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const url = tabs[0]?.url;
				if (url.includes(ServiceWorker.options.domains.pl)) resolve("PL");
				else if (url.includes(ServiceWorker.options.domains.rr)) resolve("RR");
				else if (url.includes(ServiceWorker.options.domains.pd)) resolve("PD");
				else reject("Site not recognized.");
			});
		});
	}

	static async getSite(request, sender) {
		ServiceWorker.getCurrentSite()
			.then((site) => {
				chrome.tabs.sendMessage(
					sender.tab.id,
					{ action: "returnSite", site: site },
					() => {
						if (chrome.runtime.lastError) {
							console.error("SendMessage Error:", chrome.runtime.lastError);
						}
						console.log("Message sent: returnSite", site);
					}
				);
			})
			.catch((error) => {
				chrome.tabs.sendMessage(
					sender.tab.id,
					{ action: "error", note: "returnSite failed", error: error },
					() => {
						if (chrome.runtime.lastError) {
							console.error("SendMessage Error:", chrome.runtime.lastError);
						}
						console.error("Error sending returnSite failed:", error);
					}
				);
			});
		return true;
	}

	// --- Tab Update & Extension Icon ---
	static async handleTabUpdate(tabId, tabUrl) {
		if (
			!tabUrl ||
			(!tabUrl.startsWith(ServiceWorker.options.domains.pl) &&
				!tabUrl.startsWith(ServiceWorker.options.domains.rr) &&
				!tabUrl.startsWith(ServiceWorker.options.domains.pd))
		) {
			ServiceWorker.changeExtensionIcon(false);
			await chrome.sidePanel.setOptions({ tabId, enabled: false });
		} else {
			ServiceWorker.changeExtensionIcon(true);
			ServiceWorker.enableSidePanel(tabId);
		}
	}

	static changeExtensionIcon(change = false) {
		chrome.action.setIcon({
			path: {
				"16": change ? "../icons/alt-icon-16.png" : "../icons/default-icon-16.png",
				"48": change ? "../icons/alt-icon-48.png" : "../icons/default-icon-48.png",
				"128": change ? "../icons/alt-icon-128.png" : "../icons/default-icon-128.png"
			}
		});
	}

	// --- Patient Transfer ---
	static initPatientTransfer(request) {
		const matchUrls = Object.values(ServiceWorker.options.domains).map(
			(domain) => `*://${domain}/*`
		);
		ServiceWorker.timer = 30;

		chrome.tabs.query({ url: matchUrls }, (tabs) => {
			tabs.forEach((tab) => {
				chrome.tabs.sendMessage(tab.id, {
					action: "noticeDisplay",
					patientData: request.patientData,
					timer: ServiceWorker.timer
				});
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
				tabs.forEach((tab) => {
					chrome.tabs.sendMessage(tab.id, {
						action: "noticePing",
						patientData: request.patientData,
						timer: ServiceWorker.timer
					});
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

	// --- Notifications ---
	static setNotification(request, sendResponse) {
		const { notifId, remindTime, title, message } = request;
		chrome.notifications.create(notifId, {
			type: "basic",
			iconUrl: "icon.png",
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

	// --- Key Binding Logic ---
	static handleOpenWindow(target, url, whitelist) {
		console.log("handleOpenWindow: target=", target, "url=", url, "whitelist=", whitelist);
		if (ServiceWorker.tabTargets[target]) {
			chrome.tabs.get(ServiceWorker.tabTargets[target], (tab) => {
				if (chrome.runtime.lastError || !tab) {
					console.error("Error getting tab or tab doesn't exist:", chrome.runtime.lastError);
					ServiceWorker.createNewTab(target, url, whitelist);
				} else if (tab.active) {
					console.log("Reloading active tab:", tab.id);
					chrome.tabs.reload(tab.id, () => {
						if (chrome.runtime.lastError)
							console.error("Reload Error:", chrome.runtime.lastError);
					});
				} else {
					console.log("Switching to existing tab:", tab.id);
					chrome.tabs.update(ServiceWorker.tabTargets[target], { active: true }, () => {
						if (chrome.runtime.lastError)
							console.error("Update Error:", chrome.runtime.lastError);
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
			if (chrome.runtime.lastError)
				console.error("Create Tab Error:", chrome.runtime.lastError);
			ServiceWorker.tabTargets[target] = tab.id;
			ServiceWorker.tabWhitelists[tab.id] = whitelist;
			console.log("New tab created with id:", tab.id);
		});
	}
}

/** 
 * 
 * MessageRouter
 * 
 */

messageRouter.registerHandler("openWindow", (message, sender, sendResponse) => {
	ServiceWorker.handleOpenWindow(message.target, message.url, message.whitelist);
	sendResponse({ status: "window open request processed" });
});

messageRouter.registerHandler("initPatientTransfer", (message, sender, sendResponse) => {
	ServiceWorker.initPatientTransfer(message);
	sendResponse({ status: "patient transfer initiated" });
});

messageRouter.registerHandler("clearPTData", (message, sender, sendResponse) => {
	ServiceWorker.clearPTData();
	sendResponse({ status: "patient data cleared" });
});

messageRouter.registerHandler("setNotification", (message, sender, sendResponse) => {
	ServiceWorker.setNotification(message, sendResponse);
});

messageRouter.registerHandler("clearReminder", (message, sender, sendResponse) => {
	ServiceWorker.clearReminder(message, sendResponse);
});

messageRouter.registerHandler("getSite", (message, sender, sendResponse) => {
	ServiceWorker.getSite(message, sender);
});

/** 
 * 
 * Web Navigation Listeners
 * 
 */

	// --- onCommitted Listener ---
	// Fired when a navigation is committed. At least part of the new document
	// has been received from the server and the browser has decided to switch
	// to the new document.
	chrome.webNavigation.onCommitted.addListener((details) => {
		const whitelist = ServiceWorker.tabWhitelists[details.tabId];
		if (!whitelist) return;
		const isAllowed = whitelist.some(keyword => details.url.includes(keyword));
		if (!isAllowed) {
			delete ServiceWorker.tabWhitelists[details.tabId];
			const targetName = Object.keys(ServiceWorker.tabTargets).find(
				key => ServiceWorker.tabTargets[key] === details.tabId
			);
			if (targetName) delete ServiceWorker.tabTargets[targetName];
		}
	}, { url: [{ schemes: ["http", "https"] }] });

	// --- onRemoved Listener ---
	// A tab is deleted from the window
	chrome.tabs.onRemoved.addListener((tabId) => {
		ServiceWorker.removeTabData(tabId);
		delete ServiceWorker.tabWhitelists[tabId];
		const targetName = Object.keys(ServiceWorker.tabTargets).find(
			key => ServiceWorker.tabTargets[key] === tabId
		);
		if (targetName) delete ServiceWorker.tabTargets[targetName];
	});

/** 
 * 
 * Side Panel Behavior and Tab Update Listeners
 * 
 */
	chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

	chrome.tabs.onActivated.addListener((info) => {
		chrome.tabs.get(info.tabId, (tab) => {
			ServiceWorker.handleTabUpdate(tab.id, tab.url);
		});
	});

	chrome.tabs.onUpdated.addListener((tabId, change, tab) => {
		if (change.url) {
			ServiceWorker.handleTabUpdate(tabId, change.url);
		}
	});

/** 
 * 
 * onInstalled Listener
 * 
 * Initial activation, Refresh, De-/Re-activation
 * 
 */
	chrome.runtime.onInstalled.addListener(async () => {
		ServiceWorker.initBackground();
		
		await new Promise((resolve) => {
			chrome.storage.local.remove(["pcx_permissions"], () => {
				resolve();
			});
		});

		try {
			const response = await fetch(chrome.runtime.getURL("js/data/permissions.json"));
			const permissions = await response.json();
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
				if (!result) {
					chrome.storage.local.set({ ["pcx_permissions"]: "{}" }, () => {
						resolve();
					});
				} else {
					resolve();
				}
			});
		});
	});

/** 
 * 
 * Storage onChanged Listener
 * 
 */
	chrome.storage.onChanged.addListener((changes, namespace) => {
		for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
			console.log(
				`Storage key `,key,` in namespace `,namespace,` changed.`,
				`Old value was `,oldValue,` new value is:`,newValue
			);
		}
	});
