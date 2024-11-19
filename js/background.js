const PCX_DEBUG = true; // Toggle this to enable/disable debug logs

function pcxDebug(message) {
	if (PCX_DEBUG) {
		console.log(message);
	}
}
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
 /*
	* 
	* startCountdown
	* 
	*/
	if (request.action === 'startCountdown') {
		// Get all tabs that match the host permissions (the 3 sites)
		const matchUrls = [
			'*://prince.iatserv.com/*',
			'*://reliable.iatserv.com/*',
			'*://pnc.dxresults.com/*'
		];

		let timer = 90;
		let updateCountdownBanner = setInterval(()=>{
			chrome.tabs.query({ url: matchUrls }, (tabs) => {
			tabs.forEach(tab => {
				// Send the message to each matching tab to start the countdown
				chrome.tabs.sendMessage(tab.id, { action: 'startCountdownBanner', patientData: request.patientData, timer:timer});
			});
			timer = timer - 1;
			if(timer <= 5) {clearInterval(updateCountdownBanner);}
		})},1000);
		
	}

	/*
	*
	* setNotification
	* 
	*/
	if (request.action === 'setNotification') {
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
					pcxDebug(`Chrome notification shown for ${notifId}`);
				});

				// If the user selected a reminder time, save it
				if (remindTime > 0) {
					chrome.storage.local.set({ ["pcxid_" + notifId]: currentTime + remindTime * 3600000 }, () => {
						pcxDebug(`Reminder set for ${notifId}, do not show again for ${remindTime} hours`);
					});
				}
			} else {
				pcxDebug(`Notification for ${notifId} suppressed until reminder expires`);
			}
		});

		sendResponse({ status: "notification handled" });
	}

	/*
	* 
	* clearReminder
	* 
	*/
	if (request.action === 'clearReminder') {
		const notifId = request.notifId;

		chrome.storage.local.remove("pcxid_" + notifId, () => {
			pcxDebug(`Cleared reminder for ${notifId}`);
		});

		sendResponse({ status: "reminder cleared" });
	}
});

const extOptions={
	'debug':true,
	'domains':{
		pl: "https://prince.iatserv.com/",
		rr: "https://reliable.iatserv.com/",
		pd: "https://pnc.dxresults.com/"
	}
};

// Function to get the current site
function getCurrentSite() {
	return new Promise((resolve, reject) => {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			const url = tabs[0]?.url;
			if (url.includes(extOptions.domains.pl)) {
				resolve("PL");
			} else if (url.includes(extOptions.domains.rr)) {
				resolve("RR");
			} else if (url.includes(extOptions.domains.pd)) {
				resolve("PD");
			} else {
				reject("Site not recognized.");
			}
		});
	});
}

// Example usage of getCurrentSite function
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "getSite") {
		getCurrentSite().then((site) => {
			sendResponse({ site: site });
		}).catch((error) => {
			sendResponse({ error: error });
		});
		return true; // Indicates the response will be sent asynchronously
	}
});

// Function to handle tab updates
function handleTabUpdate(tabId, tabUrl) {
	if (
		!tabUrl || 
		(
			!tabUrl.startsWith(extOptions.domains.pl) 
			&& !tabUrl.startsWith(extOptions.domains.rr) 
			&& !tabUrl.startsWith(extOptions.domains.pd)
		)
	) {
		//Tab URL does not match
		changeExtensionIcon(false);
	} else {
		//Tab URL matches
		changeExtensionIcon(true);
	}
}

// Listen for tab activations
chrome.tabs.onActivated.addListener(function (info) {
	chrome.tabs.get(info.tabId, function (tab) {
		handleTabUpdate(tab.id, tab.url);
	});
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener(function (tabId, change, tab) {
	if (change.url) {
		handleTabUpdate(tabId, change.url);
	}
});

// Function to change extension icon
function changeExtensionIcon(change=false) {
		var newIconPath = {};

			var newIconPath = {
					"16": change ? "../icons/alt-icon-16.png" : "../icons/default-icon-16.png",
					"48": change ? "../icons/alt-icon-48.png" : "../icons/default-icon-48.png",
					"128": change ? "../icons/alt-icon-128.png" : "../icons/default-icon-128.png"
			};
		// Change the extension icon
		chrome.action.setIcon({ path: newIconPath });
}