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

	static timer = 0;

	static log(message) {
		if (ServiceWorker.options.debug) {
			console.log(message);
		}
	}

	static initPatientTransfer() {
		// Get all tabs that match the host permissions (the 3 sites)
		const matchUrls = [
			'*://prince.iatserv.com/*',
			'*://reliable.iatserv.com/*',
			'*://pnc.dxresults.com/*'
		];
		ServiceWorker.timer = 30;

		chrome.tabs.query({ url: matchUrls }, (tabs) => {
			tabs.forEach(tab => {
				// Send the message to each matching tab to start the countdown
				chrome.tabs.sendMessage(tab.id, { action: 'noticeDisplay', patientData: request.patientData, timer:ServiceWorker.timer});

			});
		});
		clearInterval(chrome.updateCountdownNotice);
		chrome.updateCountdownNotice = setInterval(()=>{
			chrome.tabs.query({ url: matchUrls }, (tabs) => {
				ServiceWorker.log(ServiceWorker.timer,tabs);
				ServiceWorker.timer--;
				tabs.forEach(tab => {
					// Send the message to each matching tab to start the countdown
					chrome.tabs.sendMessage(tab.id, { action: 'noticePing', patientData: request.patientData, timer:ServiceWorker.timer});
				});
				if (ServiceWorker.timer <= 0) {
					clearInterval(chrome.updateCountdownNotice);
					chrome.storage.local.set({ patientData: {} }, () => {
						ServiceWorker.log('Patient data cleared after timeout');
					});
				}
		})}, 1000);
	}

	static clearPTData() {
		clearInterval(chrome.updateCountdownNotice);
		ServiceWorker.timer=0;
		chrome.storage.local.set({ patientData: {} }, () => {
			ServiceWorker.log('Patient data cleared after timeout');
		});
	}

	static setNotification() {
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

	static clearReminder() {
		const notifId = request.notifId;

		chrome.storage.local.remove("pcxid_" + notifId, () => {
			ServiceWorker.log(`Cleared reminder for ${notifId}`);
		});

		sendResponse({ status: "reminder cleared" });
	}

	static getCurrentSite() {
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

	static getSite() {
		getCurrentSite().then((site) => {
			sendResponse({ site: site });
		}).catch((error) => {
			sendResponse({ error: error });
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
		ServiceWorker.initPatientTransfer();
	}
	if (request.action === 'clearPTData') {
		ServiceWorker.clearPTData();
	}
	if (request.action === 'setNotification') {
		ServiceWorker.setNotification();
	}
	if (request.action === 'clearReminder') {
		ServiceWorker.clearReminder();
	}
	if (message.action === "getSite") {
		ServiceWorker.getSite();
	}
});

// Listen for tab activations
chrome.tabs.onActivated.addListener(function (info) {
	chrome.tabs.get(info.tabId, function (tab) {
		ServiceWorker.handleTabUpdate(tab.id, tab.url);
	});
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
	if (change.url) {
		ServiceWorker.handleTabUpdate(tabId, change.url);
	}
});