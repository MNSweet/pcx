// /js/modules/PCX.js
Logger.log("PCX Loaded","INIT");

class PCX {
	// Static property to track the currently active lab portal.
	static activeLabPortal = "";

	static setLabPortal(lab) {
		PCX.activeLabPortal = lab;
	}

	// Determines the preferred user mode based on the active lab portal.
	static preferredUserMode() {
		if (PCX.activeLabPortal === "PL") {
			return PCX.currentUser() === "Max";
		}
		if (PCX.activeLabPortal === "PD" || PCX.activeLabPortal === "RR") {
			return true;
		}
		return false;
	}

	/**
	 * processEnabled:
	 * Checks if a specific setting (given by category and key) is enabled
	 * and, if so, executes the provided callback.
	 */
	static async processEnabled(category, key, trueCallback, callback) {
		let result = await Settings.check(category, key, callback);
		let metadata = Settings.PERMISSION_STRUCTURE[category]?.[key] || { description: "", priority: 10 };
		Logger.log(`processEnabled: ${category} - ${key} = ${result}. Priority: ${metadata.priority}`);
		return result ? (trueCallback?.() ?? true) : result;
	}

	/**
	 * currentUser:
	 * Retrieves the current user's name from the DOM.
	 */
	static currentUser() {
		const userEl = document.querySelector(".userName");
		if (!userEl) return null;
		return userEl.textContent.replace("Welcome ", "").trim();
	}

	/**
	 * chromeNotification:
	 * Sends a message to create a Chrome notification.
	 */
	static chromeNotification(title, message, id, remindTime = 0) {
		chrome.runtime.sendMessage({
			action: "setNotification",
			title: title,
			message: message,
			notifId: id,
			remindTime: remindTime
		}, (response) => {
			Logger.log("Chrome notification response: " + response.status);
		});
	}

	/**
	 * Optional: You can add a method to clear notifications if needed.
	 */
	static clearChromeNotification(id) {
		chrome.runtime.sendMessage({
			action: "clearReminder",
			notifId: id
		}, (response) => {
			Logger.log("Cleared Chrome notification for ID: " + id);
		});
	}

	static monitorPageData(pageData,observerData={active:false,target:"",addedNode:""}) {

		// Send page data when needed.
		PageDataManager.sendPageData(pageData);

		// Attach a listener to respond when background requests the page content.
		PageDataManager.attachContentListener(pageData);

		/*
		let lastUrl = location.href;
		const whitelist = ["DIV#MainContent_ctl00_ctl00_upPanel"];
		let elementsMutated = []
		let timeout;
		
		// Detect changes via history API
		history.pushState = ((original) =>
			function pushState() {
				let result = original.apply(this, arguments);
				chrome.runtime.sendMessage({ action: "pageUpdated", url: location.href });
				return result;
			})(history.pushState);

		history.replaceState = ((original) =>
			function replaceState() {
				let result = original.apply(this, arguments);
				chrome.runtime.sendMessage({ action: "pageUpdated", url: location.href });
				return result;
			})(history.replaceState);

		// Listen for back/forward button navigation
		window.addEventListener("popstate", () => {
			chrome.runtime.sendMessage({ action: "pageUpdated", url: location.href });
		});

		chrome.runtime.sendMessage({ action: "storePageData", data: data });

		// Listen for changes to the body
		DOMObserver.observe(document.body, { childList: true, subtree: true }, (mutations) => {
			const filteredMutations = mutations.filter((m) => {
				let id = m.target.id ? `#${m.target.id}` : "";
				let classes = m.target.classList.length > 0 ? '.' + [...m.target.classList].join('.') : "";
				m.target.elementKey = `${m.target.tagName}${id}${classes}`;


				if(!elementsMutated.includes(m.target.elementKey)) {elementsMutated.push(m.target.elementKey)}
				
				if(whitelist.includes(m.target.elementKey)){return true;}
				if(m.target.tagName == "BODY"){return true;}
				return false;
			});
			if (location.href !== lastUrl) {
				lastUrl = location.href;
				chrome.runtime.sendMessage({ action: "pageUpdated", url: lastUrl });
				return;
			}
			
			console.log(filteredMutations);
			if (filteredMutations.length > 0) {
				clearTimeout(timeout);
				timeout = setTimeout(() => {
					let elements = {};
					filteredMutations.forEach(m => {
					console.log(m.target.elementKey);
						elements[m.target.elementKey] = m.target;
					});
					let processedData = {
						LinkId: new URL(location.href).searchParams.get("LinkId") || "0",
						title: document.title,
						elements: elements
					};
					console.log(elementsMutated);
					console.log(`Mutation:`,processedData);
					chrome.runtime.sendMessage({ action: "storePageData", data: processedData });
				}, 500);
			}

		});*/
	}
}

// Expose PCX to the global window if needed.
window.PCX = PCX;
