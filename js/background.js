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
			chrome.tabs.sendMessage(sender.tab.id, { "action": "returnSite", "site": site });
		}).catch((error) => {
			chrome.tabs.sendMessage(sender.tab.id, { "action": "error", "note": "returnSite failed", "error": error });
		});
		return true;
	}

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
}

const tabWhitelists = {};
const tabTargets = {};

chrome.runtime.onMessage.addListener((message, sender) => {
	if (message.action === "openWindow") {
		handleOpenWindow(message.target, message.url, message.whitelist);
	}
});

function handleOpenWindow(target, url, whitelist) {
	if (tabTargets[target]) {
		chrome.tabs.get(tabTargets[target], (tab) => {
			if (chrome.runtime.lastError || !tab) {
				createNewTab(target, url, whitelist);
			} else if (tab.active) {
				chrome.tabs.reload(tab.id); // Refresh if already in focus
			} else {
				chrome.tabs.update(tabTargets[target], { active: true }); // Switch focus
			}
		});
	} else {
		createNewTab(target, url, whitelist);
	}
}

function createNewTab(target, url, whitelist) {
	chrome.tabs.create({ url }, (tab) => {
		tabTargets[target] = tab.id;
		tabWhitelists[tab.id] = whitelist;
	});
}

chrome.webNavigation.onCommitted.addListener((details) => {
	const whitelist = tabWhitelists[details.tabId];
	if (!whitelist) return;
	const isAllowed = whitelist.some(keyword => details.url.includes(keyword));
	if (!isAllowed) {
		delete tabWhitelists[details.tabId];
		const targetName = Object.keys(tabTargets).find(key => tabTargets[key] === details.tabId);
		if (targetName) delete tabTargets[targetName];
	}
}, { url: [{ schemes: ["http", "https"] }] });

chrome.tabs.onRemoved.addListener((tabId) => {
	delete tabWhitelists[tabId];
	const targetName = Object.keys(tabTargets).find(key => tabTargets[key] === tabId);
	if (targetName) delete tabTargets[targetName];
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(console.error);

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'initPatientTransfer') {
		ServiceWorker.initPatientTransfer(request);
	}
	if (request.action === 'clearPTData') {
		ServiceWorker.clearPTData();
	}
	if (request.action === 'setNotification') {
		ServiceWorker.setNotification(request, sendResponse);
	}
	if (request.action === 'clearReminder') {
		ServiceWorker.clearReminder(request, sendResponse);
	}
	if (request.action === "getSite") {
		ServiceWorker.getSite(request, sender);
	}
});

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

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    console.log(
      `Storage key `,key,` in namespace `,namespace,` changed.`,
      `Old value was `,oldValue,` new value is:`,newValue
    );
  }
});