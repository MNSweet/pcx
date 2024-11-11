// Define the PCX class in content.js
class PCX {

/**
 * 
 * Local Storage Operations
 * 
 */
	static events = {
		Space	: {bubbles: true, cancelable: true,	key: ' '},
		End		: {bubbles: true, cancelable: true,	shiftKey: false, keyCode: 35,	code: "END",	key: "END"},
		Tab		: {bubbles: true, cancelable: true,	shiftKey: false, keyCode: 9,	code: "Tab",	key: "Tab"},
		Enter	: {bubbles: true, cancelable: false,shiftKey: false, keyCode: 13,	code: "Enter",	key: "Enter"},

	};
	// Page Element points to avoid multiple queries
	static pageElementsCache = {};
	
	/**
	 * setLocalStorage 
	 * @param STRING		key		A unique idenifer for the storage to pull from later
	 * @param STRING(IFY)	value	Storaged as a string however the contents can be anything
	 *
	 * Used to add data to the storage
	 */
	static setLocalStorage(key, value) {
		chrome.storage.local.set({ [key]: value }, () => {
			PCX.log(`Stored ${key}: ${value}`);
		});
	}

	/**
	 * getLocalStorage 
	 * @param	STRING		key		A unique idenifer for the storage to pull from later
	 * @param	FUNCTION	value	A function to manipulate the returned value
	 * 
	 * @return 	FUNCTION			output of callback
	 *
	 * Used to recall data from the storage
	 */
	static getLocalStorage(key, callback) {
		chrome.storage.local.get([key], (result) => {
			PCX.log(`Fetched ${key}: ${result[key]}`);
			return callback(result[key]);
		});
	}


	/**
	 * clearLocalStorage 
	 * 
	 * Core functionality that purges all storage. Use With Caution!
	 */
	static clearLocalStorage() {
		chrome.storage.local.clear(() => {
			PCX.log("Local storage cleared");
		});
	}


	/**
	 * removeLocalStorage 
	 * @param STRING	key		A unique idenifer for the storage to pull from later
	 *
	 * Used to purge a specific key/value pair from the storage
	 */
	static removeLocalStorage(key) {
		chrome.storage.local.remove([key], () => {
			PCX.log(`Removed key: ${key}`);
		});
	}


/**
 * 
 * UI Interaction
 * 
 */

	/**
	 * getEl
	 * @param  STRING			selector	DOM Selector string
	 * @param  BOOL				requery		Ignore Cache and PCX.findEl()
	 * @return NODE|BOOL					Found: NODE | Missing: FALSE
	 *
	 * Wraps PCX.findEl() in a cache
	 * 
	 */
	static getEl(selector,requery=false) {
		if(!requery && PCX.pageElementsCache[selector]) {
			PCX.log(`PCX.getEl(${selector}) Cached`);
			return PCX.pageElementsCache[selector];
		} else {
			PCX.log(`PCX.getEl(${selector}) Requested`);
			return PCX.pageElementsCache[selector] = PCX.findEl(selector);
		}
	}

	/**
	 * findEl
	 * @param  STRING 		selector	DOM Selector string
	 * @return NODE|BOOL				Found: NODE | Missing: FALSE
	 *
	 * Call a fresh version of the selector
	 */
	static findEl(selector) {
		PCX.log(`PCX.findEl(${selector})`);
		return document.querySelector(selector);
	}

	static simulateUserKey(element, opts) {
		PCX.log(`PCX.simulateUserKey(${element})`);
		if (element && typeof opts == 'object') {
			let defaults = {bubbles: true, cancelable : false, key : "",shiftKey : false, keyCode: 0};
			let options = [defaults,opts].reduce((result, item) => {
				if (typeof item === 'object' && item !== null) {
					result.push(Object.assign({}, ...result.filter(x => typeof x === 'object' && x !== null), item));
				} else {
					result.push(item);
				}
				return result;
			}, []);

			let simKey = new KeyboardEvent('keydown', {bubbles: options.bubbles, cancelable: options.cancelable, key: options.key, shiftKey: options.shiftKey, keyCode: options.keyCode});
			element.dispatchEvent(simKey);
			PCX.log(`Simulated Key Press '${options.key}' on element: ${element.id}`);
		} else {
			PCX.log(`Element not found: ${element.id}`);
		}
	}

	static simulateUserInputValue(element, opts) {
		PCX.log(`PCX.simulateUserInputValue(${element})`);
		if (element && typeof opts == 'object') {
			let defaults = {bubbles: true, cancelable : false, key : "",shiftKey : false, keyCode: 0};
			let options = [defaults,opts].reduce((result, item) => {
				if (typeof item === 'object' && item !== null) {
					result.push(Object.assign({}, ...result.filter(x => typeof x === 'object' && x !== null), item));
				} else {
					result.push(item);
				}
				return result;
			}, []);

			let simKey = new KeyboardEvent('keydown', {bubbles: options.bubbles, cancelable: options.cancelable, key: options.key, shiftKey: options.shiftKey, keyCode: options.keyCode});
			element.dispatchEvent(simKey);
			PCX.log(`Simulated Key Press '${options.key}' on element: ${element.id}`);
		} else {
			PCX.log(`Element not found: ${element.id}`);
		}
	}

	static simulateUserEvent(selector, eventName, arg=false) {
		let element = PCX.findEl(selector);
		if (element) {
			PCX.log(element);
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
						PCX.log(`Value is not defined`);
					}else{
						PCX.simulateUserInputValue(element, arg)
					}
					break;
				case "key":
					if(!arg) {
						PCX.log(`Key is not defined`);
					}else{
						PCX.simulateUserKey(element, arg)
					}
					break;
				default:
					let simEvent = new Event(eventName, { bubbles: true });
					element.dispatchEvent(simEvent);
					break;
			}
			PCX.log(`PCX.simulateUserEvent(${selector},${eventName}) Simulated`);
		} else {
			PCX.log(`PCX.simulateUserEvent(${selector}) Element not found`);
		}
	}


/**
 * 
 * Clipboard Operations
 * 
 */

	static copyToClipboard(text) {
		navigator.clipboard.writeText(text).then(
			() => PCX.log(`PCX.copyToClipboard(${text}) Success`),
			(err) => PCX.log(`PCX.copyToClipboard(${text}) Failed: ${err}`)
		);
	}

	static async readFromClipboard() {
		try {
			let text = await navigator.clipboard.readText();
			PCX.log(`PCX.readFromClipboard() Success: ${text}`)
			return text;
		} catch (err) {
			PCX.log(`PCX.readFromClipboard() Failed: ${err}`)
		}
	}


/**
 * 
 * Chrome Notifications
 * 
 */

	static ChromeNotification(title, message, id, remindTime = 0) {
		chrome.runtime.sendMessage({
			action: "setNotification",
			title: title,
			message: message,
			notifId: id,
			remindTime: remindTime
		}, (response) => {
			PCX.log("Chrome notification response: " + response.status);
		});
	}

	static clearChromeNotificationReminder(id) {
		chrome.runtime.sendMessage({
			action: "clearReminder",
			notifId: id
		}, (response) => {
			PCX.log("Cleared reminder for Chrome notification ID: " + id);
		});
	}

/**
 * 
 * Basic Notification Template
 * 
 */
	
	static showGUIModalNotification(title, message, id, remindTime = 0) {
		// Load external CSS file
		if (!PCX.findEl("#pcx-modal-style")) {
			const link = document.createElement("link");
			link.id = "pcx-modal-style";
			link.rel = "stylesheet";
			link.href = chrome.runtime.getURL("css/modal.css");
			document.head.appendChild(link);
		}

		if (!PCX.findEl("#pcx-modal-container")) {
			const modalContainer = document.createElement("div");
			modalContainer.id = "pcx-modal-container";

			const modal = document.createElement("div");
			modal.id = "pcx-modal";

			const modalTitle = document.createElement("h2");
			modalTitle.textContent = title;
			modal.appendChild(modalTitle);

			const modalMessage = document.createElement("p");
			modalMessage.innerHTML = message;
			modal.appendChild(modalMessage);

			const buttonContainer = document.createElement("div");
			buttonContainer.id = "pcx-modal-buttons";
			modal.appendChild(buttonContainer);

			const okButton = document.createElement("button");
			okButton.textContent = "OK";
			okButton.onclick = () => {
				document.body.removeChild(modalContainer);
				PCX.log("Modal dismissed");
			};
			buttonContainer.appendChild(okButton);

			if (remindTime > 0) {
				const remindButton = document.createElement("button");
				remindButton.textContent = `Don't remind me for ${remindTime} hours`;
				remindButton.onclick = () => {
					PCX.setLocalStorage("pcxid_" + id, Date.now() + remindTime * 3600000);
					document.body.removeChild(modalContainer);
					PCX.log(`User selected to not be reminded for ${remindTime} hours`);
				};
				buttonContainer.appendChild(remindButton);
			}

			modalContainer.appendChild(modal);
			document.body.appendChild(modalContainer);
		}
	}



/**
 * 
 * State and Navigation
 * 
 */
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

	static checkSystemType(type,overrider = false) {

	}


/**
 * 
 * Tools
 * 
 */

	/**
	 * mergeOptsIntoDefaults
	 * @param  OBJ	defaults	Preset Values
	 * @param  OBJ	opts		Overrides
	 * @return OBJ				Merged Object
	 *
	 * PCX.mergeOptsIntoDefaults(defaults,opts);
	 */
	static mergeOptsIntoDefaults(defaults,opts) {
		return [defaults,opts].reduce((result, item) => {
			if (typeof item === 'object' && item !== null) {
				result.push(Object.assign({}, ...result.filter(x => typeof x === 'object' && x !== null), item));
			} else {
				result.push(item);
			}
			return result;
		}, []);
	}

	static log(message) {
	if (PCX.getUrlParams()['debug']) {
		console.log(message);
	}
}
	
}

// Expose PCX to the window
window.PCX = PCX;

/********************************************
*
* Import Patient Data from Local Temp Cache.
*
* Banner Controller
*
*********************************************/

function initializeBanner(patientData, timeLeft = 90, callback) {
	const banner = document.createElement('div');
	banner.id = 'patientDataBanner';
	banner.style.cssText = 'position:fixed; top:0; width:100%; background-color:yellow; z-index:1000; padding:10px; display:flex; justify-content:space-between;';

	// Left side: Patient details
	const patientInfo = document.createElement('span');
	patientInfo.id 			= "patientInfo";
	patientInfo.textContent = `Patient: ${patientData.LastName}, ${patientData.FirstName} | ${patientData.Category}`;
	banner.appendChild(patientInfo);

	// Right side: Countdown timer
	const timer = document.createElement('span');
	timer.id 			= "patientDataTimer";
	timer.textContent	= "-:--";
	const countdown = setInterval(() => {
		const minutes = Math.floor(timeLeft / 60);
		const seconds = timeLeft % 60;
		timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
		timeLeft--;

		if (timeLeft < 0) {
			clearInterval(countdown);
			chrome.storage.local.set({ patientData: {} }, () => {
				PCX.log('Patient data cleared after timeout');
				banner.remove();
			});
		}
	}, 1000);

	banner.appendChild(timer);
	document.body.appendChild(banner);
	if (callback) {callback();}
}

function updateBanner(timeLeft) {
	const timer = document.querySelector('#patientDataBanner span:nth-child(2)');
	if (timer) {
		const minutes = Math.floor(timeLeft / 60);
		const seconds = timeLeft % 60;
		timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
	}
}


/********************************************
*
* Wait for DOM Elements to exist before
* taking an action
* 
* DOM Observer
*
* Usage:
* waitForElm(selector).then(()=>{})
* waitForIframeElm(selector).then(()=>{})
*
*********************************************/
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
function waitForIframeElm(frame,selector) {
	return new Promise(resolve => {
		if (document.querySelector(frame).contentWindow.document.querySelector(selector)) {
			return resolve(document.querySelector(frame).contentWindow.document.querySelector(selector));
		}

		const observer = new MutationObserver(mutations => {
			if (document.querySelector(frame).contentWindow.document.querySelector(selector)) {
				observer.disconnect();
				resolve(document.querySelector(frame).contentWindow.document.querySelector(selector));
			}
		});

		// If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
		observer.observe(document.body, {
			childList: true,
			subtree: true
		});
	});
}
function delay(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

