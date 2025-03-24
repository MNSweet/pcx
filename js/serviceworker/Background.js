// js/Background.js
import SWLogger from './SWLogger.js';
import SWMessageRouter from './SWMessageRouter.js';
SWLogger.log("Background service worker loaded");

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
	static updateCountdownNotice = null;

	// --- Background Initialization & Data Backup ---
	static initBackground() {
		chrome.storage.local.get("dataStore", (result) => {
			if (result.dataStore) {
				TabTracker.dataStore = result.dataStore;
				console.log("Data loaded from storage:", TabTracker.dataStore);
			}
		});
		// Backup data every minute.
		setInterval(() => {
			ServiceWorker.backupDataToStorage();
		}, 60000);
	}

	static backupDataToStorage() {
		chrome.storage.local.set({ dataStore: TabTracker.dataStore }, () => {
			console.log("Backup complete.");
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

	// --- Patient Transfer ---
	static initPatientTransfer(request) {
		const matchUrls = Object.values(ServiceWorker.options.domains).map(
			(domain) => `*://${domain}/*`
		);
		ServiceWorker.timer = 30;

		chrome.tabs.query({ url: matchUrls }, (tabs) => {
			tabs.forEach((tab) => {
				SWMessageRouter.broadcastToTabs('SITES',{
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

	SWMessageRouter.registerHandler("openWindow", (message, sender, sendResponse) => {
		ServiceWorker.handleOpenWindow(message.target, message.url, message.whitelist);
		sendResponse({ action:"openWindowResponse", status: "window open request processed" });
	});

	SWMessageRouter.registerHandler("initPatientTransfer", (message, sender, sendResponse) => {
		ServiceWorker.initPatientTransfer(message);
		sendResponse({ action:"initPatientTransferResponse", status: "patient transfer initiated" });
	});

	SWMessageRouter.registerHandler("clearPTData", (message, sender, sendResponse) => {
		ServiceWorker.clearPTData();
		sendResponse({ action:"clearPTDataResponse", status: "patient data cleared" });
	});

	SWMessageRouter.registerHandler("setNotification", (message, sender, sendResponse) => {
		ServiceWorker.setNotification(message, sendResponse);
		sendResponse({ action:"setNotificationResponse", status: "Acknowledged" });
	});

	SWMessageRouter.registerHandler("clearReminder", (message, sender, sendResponse) => {
		ServiceWorker.clearReminder(message, sendResponse);
		sendResponse({ action:"clearReminderResponse", status: "Acknowledged" });
	});

	SWMessageRouter.registerHandler("getSite", (message, sender, sendResponse) => {
		sendResponse({ action:"getPageDataResponse", site: ServiceWorker.getCurrentSite(message, sender) });
	});

	SWMessageRouter.registerHandler("sidePanelReady",(message, sender, sendResponse) => {
		TabTracker.sidePanelState = true;
		sendResponse({ action:"sidePanelReadyResponse", status: "Acknowledged" });
	});

	SWMessageRouter.registerHandler("sidePanelClosed",(message, sender, sendResponse) => {
		TabTracker.sidePanelState = false;
		sendResponse({ action:"sidePanelClosedResponse", status: "Acknowledged" });
	});

	SWMessageRouter.registerHandler("storePageData",(message, sender, sendResponse) => {
		TabTracker.storeTabData(sender.tab.id, message.data);
		if (TabTracker.sidePanelState) {
			SWMessageRouter.broadcastToTabs("SP", { action: "getPageDataResponse", data: message.data });
		}
		sendResponse({ action:"storePageDataResponse", status: "Acknowledged" });
	});

	SWMessageRouter.registerHandler("getPageData",(message, sender, sendResponse) => {
		// Got your Request
		sendResponse({ action:"getPageDataResponse", status: "Acknowledged"});
		
		// Here is what I have
		TabTracker.getActiveTabData().then((activeData) => {
			SWMessageRouter.broadcastToTabs("SP", { action: "updatePageData", data: activeData });
		});

		// Hey Page, do you have anything want to add? Let me know on "storePageData", Thanks
		SWMessageRouter.broadcastToActive({ action: "getPageContent"});
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

/**
 *
 * Tab Tracking Class
 * 
 */
class TabTracker {
	// trackedTabs.set(ID, { url: URL, inScope: BOOL, contents: {PageDataManagementObject} });
	static trackedTabs = new Map();
	static tabWhitelists = {};
	static tabTargets = {};
	static sidePanelState = false;

	static init() {
		chrome.tabs.onCreated.addListener(TabTracker.processTab);
		chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => TabTracker.processTab(tab));
		chrome.tabs.onActivated.addListener(({ tabId }) => chrome.tabs.get(tabId, TabTracker.processTab));
		chrome.tabs.onRemoved.addListener(TabTracker.handleTabRemoved);
		chrome.webNavigation.onCommitted.addListener(TabTracker.handleOnCommitted);
	}

	static async processTab(tab) {
		if(TabTracker.sidePanelState) {
			//SWMessageRouter.broadcastToTabs("SP", { action: "showLoading" });
			await TabTracker.getActiveTabData().then((activeData) => {
				SWMessageRouter.broadcastToTabs("SP", { action: "updatePageData", data: activeData });
			});
		}
		const inScope = Object.values(ServiceWorker.options.domains).some(domain => tab.url.startsWith(domain));
		const trackedTab = TabTracker.trackedTabs.get(tab.id);
		TabTracker.trackedTabs.set(tab.id, { url: tab.url, inScope: inScope, contents: (trackedTab?trackedTab.contents:{}) });
		TabTracker.handleTabIconUpdate(inScope);

	}

	// Event Handlers
	static handleTabIconUpdate(inScope) {
		chrome.action.setIcon({
			path: {
				"16": inScope ? "../../icons/alt-icon-16.png" : "../../icons/default-icon-16.png",
				"48": inScope ? "../../icons/alt-icon-48.png" : "../../icons/default-icon-48.png",
				"128": inScope ? "../../icons/alt-icon-128.png" : "../../icons/default-icon-128.png"
			}
		});
	}

	static handleTabRemoved(tabId, removeInfo) {
		if (TabTracker.trackedTabs.has(tabId)) {
			TabTracker.trackedTabs.delete(tabId);
			if (ServiceWorker.options.debug) {
				console.log(`Tab removed: ID ${tabId}`);
			}
		}
		delete TabTracker.tabWhitelists[tabId];
		const targetName = Object.keys(TabTracker.tabTargets).find(
			key => TabTracker.tabTargets[key] === tabId
		);
		if (targetName) delete TabTracker.tabTargets[targetName];

	}

	static handleOnCommitted(activeInfo) {
		// Key Binding Logic for New Tab Creation
		// Whitelist: Array of url %strings% that if found should allow for the tab's target value to remain
		//   otherwise if the string is not found the tab should be stripped of it's target allowing
		//   for a new one to be created.
		const whitelist = TabTracker.tabWhitelists[activeInfo.tabId];
		if (!whitelist) {
			return;
		}
		const isAllowed = whitelist.some(keyword => activeInfo.url.includes(keyword));
		if (!isAllowed) {
			delete TabTracker.tabWhitelists[activeInfo.tabId];
			const targetName = Object.keys(TabTracker.tabTargets).find(
				key => TabTracker.tabTargets[key] === activeInfo.tabId
			);
			if (targetName) {
				delete TabTracker.tabTargets[targetName];
			}
		}
	}

	// Page Data
	static storeTabData(tabId, pageState) {
		try{
			const tabData = TabTracker.trackedTabs.get(tabId);
			TabTracker.trackedTabs.set(tabId, { "url": tabData.url, "inScope": tabData.inScope, "contents": pageState });
		}catch(e){
			console.log("storeTabData:ERROR",e);
		}
	}

	static getTabData(tabId) {
		return TabTracker.trackedTabs.get(tabId) || null;
	}

	static getActiveTabData() {
		return new Promise((resolve) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const tabId = tabs[0].id;
				console.log("getActiveTabData:getTabData",TabTracker.getTabData(tabId));
				resolve(TabTracker.getTabData(tabId)||{});
			})
		})
	}
}

// Initialize the tracker.
TabTracker.init();

