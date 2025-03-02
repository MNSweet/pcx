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
}

// Expose PCX to the global window if needed.
window.PCX = PCX;
