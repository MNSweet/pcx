console.log("ServiceWorker");
class ServiceWorker {
	static options = {
		'debug':true,
		'domains':{
			pl: "https://prince.iatserv.com/",
			rr: "https://reliable.iatserv.com/",
			pd: "https://pnc.dxresults.com/"
		}
	};

	static timer = 36;
	static timerState = 0;

	static log(message) {
		if (ServiceWorker.options.debug) {
			console.log(message);
		}
	}

	static initPatientTransfer(request) {
		console.log("> initPatientTransfer", request);
		// Get all tabs that match the host permissions (the 3 sites)
		const matchUrls = [
			'*://prince.iatserv.com/*',
			'*://reliable.iatserv.com/*',
			'*://pnc.dxresults.com/*'
		];
		ServiceWorker.timerState = ServiceWorker.timer;

		clearInterval(ServiceWorker.updateCountdownNotice);
		chrome.storage.local.set({ noticeTimerState: ServiceWorker.timerState });

		console.log("Init:", ServiceWorker.timerState);
		ServiceWorker.updateCountdownNotice = setInterval(async ()=>{
			(new Promise(async resolve => {
				chrome.storage.local.get(["noticeTimerState"], ({noticeTimerState}) => {
					ServiceWorker.timerState = noticeTimerState;
					return resolve();
				});
			})).then((resolve)=>{
				ServiceWorker.timerState--;
				if (ServiceWorker.timerState <= 0) {
					clearInterval(ServiceWorker.updateCountdownNotice);
					chrome.storage.local.set({ patientData: {} }, () => {
						ServiceWorker.log('Patient data cleared after timeout');
					});
					chrome.tabs.query({ url: matchUrls }, (tabs) => {
						tabs.forEach(tab => {
							// Send the message to each matching tab to halt the countdown
							console.log('haltPing: ',tab);
							chrome.tabs.sendMessage(tab.id, { action: 'haltPing' });
						});
					});
				}
				chrome.storage.local.set({ noticeTimerState: ServiceWorker.timerState });
			});
		}, 1000);
		chrome.tabs.query({ url: matchUrls }, (tabs) => {
			tabs.forEach(tab => {
				console.log('noticePing: ',tab);
				chrome.tabs.sendMessage(tab.id, { action: 'noticePing'});
			});
		});
	}

	static clearPTData(request) {
		clearInterval(ServiceWorker.updateCountdownNotice);
		ServiceWorker.timer=0;
		chrome.storage.local.set({ patientData: {} }, () => {
			ServiceWorker.log('Patient data cleared after timeout');
		});
	}

	static setNotification(request,sendResponse) {
		const notifId = request.notifId;
		const remindTime = request.remindTime;
		const title = request.title;
		const message = request.message;

		// Check if the reminder for this notification ID is set
		chrome.storage.local.get(["pcxid_" + notifId], (result) => {
			const remindUntil = result["pcxid_" + notifId];
			const currentTime = Date.now();

			if (!remindUntil || currentTime > remindUntil) {
				// Show the Chrome notification
				chrome.notifications.create(notifId, {
					type: 'basic',
					iconUrl: 'icon.png',
					title: title,
					message: message,
					priority: 2
				}, () => {
					ServiceWorker.log(`Chrome notification shown for ${notifId}`);
				});

				// If the user selected a reminder time, save it
				if (remindTime > 0) {
					chrome.storage.local.set({ ["pcxid_" + notifId]: currentTime + remindTime * 3600000 }, () => {
						ServiceWorker.log(`Reminder set for ${notifId}, do not show again for ${remindTime} hours`);
					});
				}
			} else {
				ServiceWorker.log(`Notification for ${notifId} suppressed until reminder expires`);
			}
		});

		sendResponse({ status: "notification handled" });
	}

	static clearReminder(request,sendResponse) {
		const notifId = request.notifId;

		chrome.storage.local.remove("pcxid_" + notifId, () => {
			ServiceWorker.log(`Cleared reminder for ${notifId}`);
		});

		sendResponse({ status: "reminder cleared" });
	}

	static async getCurrentSite(request) {
		return new Promise((resolve, reject) => {
			chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
				const url = tabs[0]?.url;
				if (url.includes(ServiceWorker.options.domains.pl)) {
					resolve("PL");
				} else if (url.includes(ServiceWorker.options.domains.rr)) {
					resolve("RR");
				} else if (url.includes(ServiceWorker.options.domains.pd)) {
					resolve("PD");
				} else {
					reject("Site not recognized.");
				}
			});
		});
	}

	static async getSite(request,sender) {
		ServiceWorker.getCurrentSite().then((site) => {
			console.log("getSite: ",site);
        	chrome.tabs.sendMessage(sender.tab.id, {"action":"returnSite", "site": site});
		}).catch((error) => {
			console.log("getSite: ",site);
        	chrome.tabs.sendMessage(sender.tab.id, {"action":"error", "note": "returnSite failed", "error": error});
		});
		return true; // Indicates the response will be sent asynchronously
	}

	static handleTabUpdate(tabId, tabUrl) {
		if (
			!tabUrl || 
			(
				!tabUrl.startsWith(ServiceWorker.options.domains.pl) 
				&& !tabUrl.startsWith(ServiceWorker.options.domains.rr) 
				&& !tabUrl.startsWith(ServiceWorker.options.domains.pd)
			)
		) {
			//Tab URL does not match
			ServiceWorker.changeExtensionIcon(false);
		} else {
			//Tab URL matches
			ServiceWorker.changeExtensionIcon(true);
		}
	}

	static injectShowBatchAccessionsEdit(tabId, url) {

	console.log("inject");
	console.log("- tabId: ", tabId);
	console.log("- url: ", url);
		let u;
		try {
			u = new URL(url);
		} catch {
			return;
		}
console.log('searchParams',u.searchParams);
		if (u.searchParams.get('LinkId') !== '2074') return;
console.log('found 2074');
		chrome.scripting.executeScript({
			target: { tabId },
			func: () => {
				document.addEventListener('DOMContentLoaded', function() {
					console.log('set function');
					window.ShowBatchAccessionsEdit = batchNumber => {
						const url = '?LinkId=2099&batchNumber=' + batchNumber;
						window.open(url);
					};
				})
			}
		});
	}

	static changeExtensionIcon(change=false) {
		chrome.action.setIcon({ path:{
				"16"	: change ? "../icons/alt-icon-16.png"	: "../icons/default-icon-16.png",
				"48"	: change ? "../icons/alt-icon-48.png"	: "../icons/default-icon-48.png",
				"128"	: change ? "../icons/alt-icon-128.png"	: "../icons/default-icon-128.png"
			}
		});
	}
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	if (request.action === 'initPatientTransfer') {
		ServiceWorker.initPatientTransfer(request);
	}
	if (request.action === 'clearPTData') {
		ServiceWorker.clearPTData(request);
	}
	if (request.action === 'setNotification') {
		ServiceWorker.setNotification(request,sendResponse);
	}
	if (request.action === 'clearReminder') {
		ServiceWorker.clearReminder(request);
	}
	if (request.action === "getSite") {
		ServiceWorker.getSite(request, sender);
	}
});

const tabWhitelists = {}; // Stores whitelist per tab
const tabTargets = {}; // Stores tabId for each named target

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.action === "openWindow") {
        handleOpenWindow(message.target, message.url, message.whitelist);
    }
});

function handleOpenWindow(target, url, whitelist) {
    // Check if the tab is still open
    if (tabTargets[target]) {
        chrome.tabs.get(tabTargets[target], (tab) => {
            if (chrome.runtime.lastError || !tab) {
                // If the tab doesn't exist anymore, open a new one
                createNewTab(target, url, whitelist);
            } else if (tab.id === senderTabId) {
                // If the keybinding is triggered on the assigned tab, refresh it
                chrome.tabs.reload(tab.id);
            } else {
                // Tab exists, bring it to focus
                chrome.tabs.update(tabTargets[target], { active: true });
            }
        });
    } else {
        // No existing tab, open a new one
        createNewTab(target, url, whitelist);
    }
}

function createNewTab(target, url, whitelist) {
    chrome.tabs.create({ url }, (tab) => {
        tabTargets[target] = tab.id; // Store the tab ID for tracking
        tabWhitelists[tab.id] = whitelist;
    });
}

// Listen for web navigation events to enforce whitelists
chrome.webNavigation.onCommitted.addListener((details) => {
	console.log("onCommitted");
	console.log("- details: ", details);
    const whitelist = tabWhitelists[details.tabId];

    if (!whitelist) {
        return; // Skip if no whitelist is set for this tab
    }

    const isAllowed = whitelist.some(keyword => details.url.includes(keyword));

    if (!isAllowed) {
        // Remove tracking since navigation went outside the whitelist
	    delete tabWhitelists[details.tabId];

	    // Remove from `tabTargets` if the tabId was associated with a target
	    const targetName = Object.keys(tabTargets).find(key => tabTargets[key] === details.tabId);
	    if (targetName) {
	        delete tabTargets[targetName];
	    }
    }
}, { url: [{ schemes: ["http", "https"] }] });

// Cleanup when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
	console.log("onRemoved");
    delete tabWhitelists[tabId];

    // Remove from `tabTargets` if the tabId was associated with a target
    const targetName = Object.keys(tabTargets).find(key => tabTargets[key] === tabId);
    if (targetName) {
        delete tabTargets[targetName];
    }
});
	

// Listen for tab activations
chrome.tabs.onActivated.addListener(function (info) {
	console.log("onActivated");
	console.log("- info: ", info);
	chrome.tabs.get(info.tabId, function (tab) {
		console.log("- tab: ", tab);
		ServiceWorker.handleTabUpdate(tab.id, tab.url);
	});
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
	console.log("onUpdated");
	console.log("- change: ", change);
	console.log("- tab: ", tab);
	if (change.url) {
		ServiceWorker.handleTabUpdate(tabId, change.url);
	}
	if (change.status == 'complete' && tab.url) {
		ServiceWorker.injectShowBatchAccessionsEdit(tabId, tab.url);
	}
});