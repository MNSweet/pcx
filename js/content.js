// Define the PCX_CMSInteraction class in content.js
class PCX_CMSInteraction {
	// 1. Local Storage Operations
	static setLocalStorage(key, value) {
		chrome.storage.local.set({ [key]: value }, () => {
			pcxDebug(`Stored ${key}: ${value}`);
		});
	}

	static getLocalStorage(key, callback) {
		chrome.storage.local.get([key], (result) => {
			pcxDebug(`Fetched ${key}: ${result[key]}`);
			callback(result[key]);
		});
	}

	static clearLocalStorage() {
		chrome.storage.local.clear(() => {
			pcxDebug("Local storage cleared");
		});
	}

	static removeLocalStorage(key) {
		chrome.storage.local.remove([key], () => {
			pcxDebug(`Removed key: ${key}`);
		});
	}

	// 2. UI Interaction
	static locateElement(selector) {
		pcxDebug(`Locating element: ${selector}`);
		return document.querySelector(selector);
	}

	static simulateUserKey(element, key) {
		if (element) {
			const eventKeyEnter = new KeyboardEvent('keydown', { key: key, bubbles: true });
			element.dispatchEvent(eventKeyEnter);
			pcxDebug(`Simulated Key Press '${key}' on element: ${element.id}`);
		} else {
			pcxDebug(`Element not found: ${element.id}`);
		}
	}

	static simulateUserInputValue(element, valueObj) {
		if (element && typeof valueObj == 'object') {
			const eventKeyEnter = new KeyboardEvent('keydown', { key: key, bubbles: true });
			element.dispatchEvent(eventKeyEnter);
			pcxDebug(`Simulated Key Press '${key}' on element: ${element.id}`);
		} else {
			pcxDebug(`Element not found: ${element.id}`);
		}
	}

	static simulateUserEvent(selector, eventName, arg=false) {
		let element = PCX_CMSInteraction.locateElement(selector);
		if (element) {
			pcxDebug(element);
			switch (eventName){
				case "focus":
					element.focus();
					// Ensure text selection or cursor is positioned
					if (element.setSelectionRange) {
						element.setSelectionRange(element.value.length, element.value.length); // Place cursor at the end
					} else {
						element.select(); // Select all text if preferred
					}
					break;
				case "value": //{value:'STRING',simInput:'BOOLEAN'} Value: Text to insert, simInput: Add KeyUp&Down
					if(!arg || typeof arg != 'object') {
						pcxDebug(`Value is not defined`);
					}else{
						PCX_CMSInteraction.simulateUserInputValue(element, arg)
					}
					break;
				case "key":
					if(!arg) {
						pcxDebug(`Key is not defined`);
					}else{
						PCX_CMSInteraction.simulateUserKey(element, arg)
					}
					break;
				default:
					let simEvent = new Event(eventName, { bubbles: true });
					element.dispatchEvent(simEvent);
					break;
			}
			pcxDebug(`Simulated event '${eventName}' on element: ${selector}`);
		} else {
			pcxDebug(`Element not found: ${selector}`);
		}
	}

	// 3. Clipboard Operations
	static copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(
			() => pcxDebug("Text copied to clipboard"),
			(err) => pcxDebug("Failed to copy text: " + err)
		);
	}

	static async readFromClipboard() {
		try {
			let text = await navigator.clipboard.readText();
			pcxDebug("Text read from clipboard: " + text);
			return text;
		} catch (err) {
			pcxDebug("Failed to read clipboard contents: " + err);
		}
	}

	// 4. Chrome Notifications (renamed)
	static ChromeNotification(title, message, id, remindTime = 0) {
		chrome.runtime.sendMessage({
			action: "setNotification",
			title: title,
			message: message,
			notifId: id,
			remindTime: remindTime
		}, (response) => {
			pcxDebug("Chrome notification response: " + response.status);
		});
	}

	static clearChromeNotificationReminder(id) {
		chrome.runtime.sendMessage({
			action: "clearReminder",
			notifId: id
		}, (response) => {
			pcxDebug("Cleared reminder for Chrome notification ID: " + id);
		});
	}

	static showGUIModalNotification(title, message, id, remindTime = 0) {
		// Load external CSS file
		if (!document.getElementById("pcx-modal-style")) {
			const link = document.createElement("link");
			link.id = "pcx-modal-style";
			link.rel = "stylesheet";
			link.href = chrome.runtime.getURL("css/modal.css");
			document.head.appendChild(link);
		}

		if (!document.getElementById("pcx-modal-container")) {
			const modalContainer = document.createElement("div");
			modalContainer.id = "pcx-modal-container";

			const modal = document.createElement("div");
			modal.id = "pcx-modal";

			const modalTitle = document.createElement("h2");
			modalTitle.textContent = title;
			modal.appendChild(modalTitle);

			const modalMessage = document.createElement("p");
			modalMessage.textContent = message;
			modal.appendChild(modalMessage);

			const buttonContainer = document.createElement("div");
			buttonContainer.id = "pcx-modal-buttons";
			modal.appendChild(buttonContainer);

			const okButton = document.createElement("button");
			okButton.textContent = "OK";
			okButton.onclick = () => {
				document.body.removeChild(modalContainer);
				pcxDebug("Modal dismissed");
			};
			buttonContainer.appendChild(okButton);

			if (remindTime > 0) {
				const remindButton = document.createElement("button");
				remindButton.textContent = `Don't remind me for ${remindTime} hours`;
				remindButton.onclick = () => {
					PCX_CMSInteraction.setLocalStorage("pcxid_" + id, Date.now() + remindTime * 3600000);
					document.body.removeChild(modalContainer);
					pcxDebug(`User selected to not be reminded for ${remindTime} hours`);
				};
				buttonContainer.appendChild(remindButton);
			}

			modalContainer.appendChild(modal);
			document.body.appendChild(modalContainer);
		}
	}


	static getUrlParams() {
		const params = {};
		const queryString = window.location.search;

		if (queryString) {
			const urlParams = new URLSearchParams(queryString);
			urlParams.forEach((value, key) => {
				params[key] = value;
			});
		}

		return params;
	}
}

// Expose PCX_CMSInteraction to the window
window.PCX_CMSInteraction = PCX_CMSInteraction;

// Debugging function
const DEBUG = true;
function pcxDebug(message) {
	if (DEBUG) {
		console.log(message);
	}
}



/********************************************
*
* Import Patient Data from Local Temp Cache.
*
* Banner Controller
*
*********************************************/

function initializeBanner(patientData, timeLeft = 90) {
	const banner = document.createElement('div');
	banner.id = 'patientDataBanner';
	banner.style.cssText = 'position:fixed; top:0; width:100%; background-color:yellow; z-index:1000; padding:10px; display:flex; justify-content:space-between;';

	// Left side: Patient details
	const patientInfo = document.createElement('span');
	patientInfo.textContent = `Patient: ${patientData.LastName}, ${patientData.FirstName} | ${patientData.Category}`;
	banner.appendChild(patientInfo);

	// Right side: Countdown timer
	const timer = document.createElement('span');
	const countdown = setInterval(() => {
		const minutes = Math.floor(timeLeft / 60);
		const seconds = timeLeft % 60;
		timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
		timeLeft--;

		if (timeLeft < 0) {
			clearInterval(countdown);
			chrome.storage.local.set({ patientData: {} }, () => {
				console.log('Patient data cleared after timeout');
				banner.remove();
			});
		}
	}, 1000);

	banner.appendChild(timer);
	document.body.appendChild(banner);
}

function updateBanner(timeLeft) {
	const timer = document.querySelector('#patientDataBanner span:nth-child(2)');
	if (timer) {
		const minutes = Math.floor(timeLeft / 60);
		const seconds = timeLeft % 60;
		timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}
}

function waitForElm(selector) {
		return new Promise(resolve => {
				if (document.querySelector(selector)) {
						return resolve(document.querySelector(selector));
				}

				const observer = new MutationObserver(mutations => {
						if (document.querySelector(selector)) {
								observer.disconnect();
								resolve(document.querySelector(selector));
						}
				});

				// If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
				observer.observe(document.body, {
						childList: true,
						subtree: true
				});
		});
}