// Define the PCX class in content.js
class PCX {

/**
 * 
 * Local Storage Operations
 * 
 */
	
	/**
	 * setLocalStorage 
	 * @param STRING		key		A unique idenifer for the storage to pull from later
	 * @param STRING(IFY)	value	Storaged as a string however the contents can be anything
	 *
	 * Used to add data to the storage
	 */
	static setLocalStorage(key, value) {
		chrome.storage.local.set({ [key]: value }, () => {
			pcxDebug(`Stored ${key}: ${value}`);
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
			pcxDebug(`Fetched ${key}: ${result[key]}`);
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
			pcxDebug("Local storage cleared");
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
			pcxDebug(`Removed key: ${key}`);
		});
	}


/**
 * 
 * UI Interaction
 * 
 */

	/**
	 * findEl
	 * @param  {[type]} selector [description]
	 * @return {[type]}          [description]
	 */
	static findEl(selector) {
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
		let element = PCX.findEl(selector);
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
						PCX.simulateUserInputValue(element, arg)
					}
					break;
				case "key":
					if(!arg) {
						pcxDebug(`Key is not defined`);
					}else{
						PCX.simulateUserKey(element, arg)
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


/**
 * 
 * Clipboard Operations
 * 
 */

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
				pcxDebug("Modal dismissed");
			};
			buttonContainer.appendChild(okButton);

			if (remindTime > 0) {
				const remindButton = document.createElement("button");
				remindButton.textContent = `Don't remind me for ${remindTime} hours`;
				remindButton.onclick = () => {
					PCX.setLocalStorage("pcxid_" + id, Date.now() + remindTime * 3600000);
					document.body.removeChild(modalContainer);
					pcxDebug(`User selected to not be reminded for ${remindTime} hours`);
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
}

// Expose PCX to the window
window.PCX = PCX;



/**
 * QA Warning System
 */
class QAManager {
	static notices = {};  // Shared object for all instances
	static noticePhrases = [
		"Right-o, seems a little fix is needed here!",
		"Oops-a-daisy, looks like something went amiss.",
		"No worries, we’ll have this sorted in a jiffy!",
		"Steady on, just a small correction needed.",
		"Good show so far, just a tweak here, please!",
		"Blimey! Let’s double-check that bit, eh?",
		"Sorry, love, seems we’ve hit a tiny bump!",
		"Don’t fret, just a spot of bother, that’s all!",
		"Well, that’s a tad unusual. Shall we try again?",
		"Oops! Seems like we’ve gone a bit pear-shaped.",
		"All’s well, just a quick change to carry on!",
		"Nearly there! Just a smidgen off, that’s all.",
		"Hold tight! Let’s have a little look here, shall we?",
		"Whoops, bit of a hiccup there. Let's get it sorted!",
		"Cheerio! Just a bit of fine-tuning needed here.",
		"Right-o, a quick adjustment, and we’re golden!",
		"Jolly good, but let’s tweak that, shall we?",
		"Ah, almost had it! Just a wee nudge now.",
		"Mind the gap! Seems we’ve a detail to fix.",
		"Bit of a whoopsie there, nothing to worry about!"
	];

	static addNotice(code, message) {
		QAManager.notices[code] = message;
		pcxDebug(`Notice added with code ${code}: ${message}`);
	}

	static removeNotice(code) {
		if (QAManager.notices[code]) {
			delete QAManager.notices[code];
			pcxDebug(`Notice removed with code ${code}`);
		}
	}

	static hasNotice(code) {
		return code in QAManager.notices;
	}

	static getAllNoticeCodes() {
		return Object.keys(QAManager.notices);
	}

	static getNoticeCount() {
		return Object.keys(QAManager.notices).length;
	}

	static getNoticeMessage(code) {
		return QAManager.notices[code] || null;
	}

	static clearNotices() {
		QAManager.notices = {};
		pcxDebug("All notices cleared.");
	}
	static getRandomPhrase() {
		return QAManager.noticePhrases[Math.floor(Math.random() * QAManager.noticePhrases.length)];
	}


	static showQAModalNotification() {
		let noticeItems = "";

		// Load external CSS file
		if (!PCX.findEl("#pcx-modal-style")) {
			const link = document.createElement("link");
			link.id = "pcx-modal-style";
			link.rel = "stylesheet";
			link.href = chrome.runtime.getURL("css/modal.css");
			document.head.appendChild(link);
		}
		if (!PCX.findEl("#pcx-qa-modal-container")) {
			const modalContainer = document.createElement("div");
			modalContainer.id = "pcx-qa-modal-container";

			const modal = document.createElement("div");
			modal.id = "pcx-qa-modal";

			const modalTitle = document.createElement("div");
			modalTitle.innerHTML = "<span>Prince Lab Manager</span>" + QAManager.getRandomPhrase();
			modalTitle.id = "pcx-qa-modal-heading";
			modal.appendChild(modalTitle);

			for (const key of QAManager.getAllNoticeCodes()) {
				let noticeItem = `<div class="noticeItem" id="noticeItem-${key}">
			<div class="noticeDescription">${QAManager.notices[key]}
			</div>
			<div class="noticeActions">
				<button class="noticeClear" data-key="${key}">It's correct: Clear notice.</button>
				<button class="noticeCancel">Good catch: Let’s fix it</button>
			</div>
		</div>`;
				noticeItems += noticeItem;
			}


			const modalMessage = document.createElement("div");
			modalMessage.innerHTML = noticeItems;
			modalMessage.id = "noticeContainer";
			modal.appendChild(modalMessage);

			const buttonContainer = document.createElement("div");
			buttonContainer.id = "pcx-qa-modal-buttons";
			modal.appendChild(buttonContainer);

			const okButton = document.createElement("button");
			okButton.textContent = "Close to fix errors";
			okButton.id = "pcx-qa-modal-close";
			okButton.onclick = () => {
				document.body.removeChild(modalContainer);
				pcxDebug("Modal dismissed");
			};
			buttonContainer.appendChild(okButton);

			modalContainer.appendChild(modal);
			document.body.appendChild(modalContainer);

			document.querySelectorAll('.noticeClear').forEach(
				(btn)=>{
					btn.addEventListener('click',()=>{
						QAManager.removeNotice(btn.getAttribute("data-key"));
						document.querySelector(`#noticeItem-${btn.getAttribute("data-key")}`).remove();
						if(document.querySelector(`#noticeContainer`).children.length < 1) {
							document.querySelector(`#noticeContainer`).classList = "cleared";
							document.querySelector(`#noticeContainer`).innerHTML = "<div>Cheers</div>";
							document.querySelector(`#pcx-qa-modal-close`).textContent = "Close";
						}
					});
					console.log(btn);
				}
			);
			document.querySelectorAll('.noticeCancel').forEach(
				(btn)=>{
					btn.addEventListener('click',()=>{document.body.removeChild(modalContainer)})
					console.log(btn);
				}
			);
			
		}
	}
}

// Expose QAManager to the window
window.QAManager = QAManager;



// Debugging function
const PCX_DEBUG = false;
function pcxDebug(message) {
	if (PCX_DEBUG) {
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
				console.log('Patient data cleared after timeout');
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
		observer.observe(document.querySelector(frame).contentWindow.document.body, {
			childList: true,
			subtree: true
		});
	});
}