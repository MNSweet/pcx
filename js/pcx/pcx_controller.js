// Define the PCX class in content.js
class PCX {

	static activeLabPortal = "";

	static setLabPortal(lab) {
		PCX.activeLabPortal = lab;
	}
	static preferedUserMode(){
		if(PCX.activeLabPortal == "PL") {
			return PCX.currentUser() == "Max";
		}
		if(PCX.activeLabPortal == "PD" || PCX.activeLabPortal == "RR") {
			return true;
		}
		return false;
	}

/**
 * 
 * Event Handlers 
 * 
 */
	static events = {
		Space	: {bubbles: true, cancelable: true,	key: ' '},
		Delete	: {bubbles: true, cancelable: true,	shiftKey: false, keyCode: 8,	code: "Backspace",	key: "Backspace"},
		End		: {bubbles: true, cancelable: true,	shiftKey: false, keyCode: 35,	code: "END",		key: "END"},
		Tab		: {bubbles: true, cancelable: true,	shiftKey: false, keyCode: 9,	code: "Tab",		key: "Tab"},
		Enter	: {bubbles: true, cancelable: false,shiftKey: false, keyCode: 13,	code: "Enter",		key: "Enter"},

	};


/**
 * 
 * UI Interaction
 * 
 */
	// Page Element points to avoid multiple queries
	static pageElementsCache = {};

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
	 * getEls
	 * @param  STRING			selector	DOM Selector string
	 * @param  BOOL				requery		Ignore Cache and PCX.findEl()
	 * @return NODE|BOOL					Found: NODE | Missing: FALSE
	 *
	 * Wraps PCX.findEls() in a cache
	 * 
	 */
	static getEls(selector,requery=false) {
		if(!requery && PCX.pageElementsCache[selector]) {
			PCX.log(`PCX.getEls(${selector}) Cached`);
			return PCX.pageElementsCache[selector];
		} else {
			PCX.log(`PCX.getEls(${selector}) Requested`);
			return PCX.pageElementsCache[selector] = PCX.findEls(selector);
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

	/**
	 * findEls
	 * @param  STRING 		selector	DOM Selector string
	 * @return NODE|BOOL				Found: NODE | Missing: FALSE
	 *
	 * Call a fresh version of the selectors
	 */
	static findEls(selector) {
		PCX.log(`PCX.findEls(${selector})`);
		return document.querySelectorAll(selector);
	}

	static simulateUserKey(element, opts, type = 'keydown') {
		PCX.log(`PCX.simulateUserKey:`,element, opts);
		if (element && typeof opts == 'object') {
			let defaults = {bubbles: true, cancelable : false, key : "",shiftKey : false, keyCode: 0};
			let options = {...defaults,...opts};
			PCX.log(`PCX.simulateUserKey:`,options);

			let simKey = new KeyboardEvent(type, {bubbles: options.bubbles, cancelable: options.cancelable, key: options.key, shiftKey: options.shiftKey, keyCode: options.keyCode});
			element.dispatchEvent(simKey);
			PCX.log(`Simulated Key Press '${options.key}' on element: ${element.id}`);
			return true;
		} else {
			PCX.log(`Element not found: ${element.id}`);
			return false;
		}
	}

	static simulateUserInputValue(element, opts) {
		PCX.log(`PCX.simulateUserInputValue(${element})`);
		if (element && typeof opts == 'object') {
			let defaults = {bubbles: true, cancelable : false, key : "",shiftKey : false, keyCode: 0};
			let options = {...defaults,...opts};

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
		//if(chrome.runtime.id == undefined) return;
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
		//if(chrome.runtime.id == undefined) return;
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
			//if(chrome.runtime.id == undefined) return;
			const link = PCX.createDOM("link", {id: "pcx-modal-style", rel: "stylesheet", href: chrome.runtime.getURL("css/modal.css")});
			document.head.appendChild(link);
		}

		if (!PCX.findEl("#pcx-modal-container")) {
			const modalContainer	= PCX.createDOM("div",	{ id: "pcx-modal-container"});
			  const modal			= PCX.createDOM("div",	{ id: "pcx-modal"});
				const modalTitle		= PCX.createDOM("h2",	{ textContent: title });
				const modalMessage		= PCX.createDOM("p",	{ innerHTML: message });
				const buttonContainer	= PCX.createDOM("div", 		{ id: "pcx-modal-buttons" });
					const okButton		= PCX.createDOM("button",	{ textContent: "OK", onclick: ()=>{
						document.body.removeChild(modalContainer);
						PCX.log("Modal dismissed");
					}});

			modal.appendChild(modalTitle);
			modal.appendChild(modalMessage);
			modal.appendChild(buttonContainer);

			buttonContainer.appendChild(okButton);

			if (remindTime > 0) {
				const remindButton = PCX.createDOM("button", {textContent: `Don't remind me for ${remindTime} hours`, onclick: ()=>{
					DataHandler.set("chrome","pcxid_" + id, Date.now() + remindTime * 3600000);
					document.body.removeChild(modalContainer);
					PCX.log(`User selected to not be reminded for ${remindTime} hours`);
				}});
				buttonContainer.appendChild(remindButton);
			}

			modalContainer.appendChild(modal);
			document.body.appendChild(modalContainer);
		}
	}

/********************************************
*
* Import Patient Data from Local Temp Cache.
*
* Notice Controller
*
*********************************************/
	static patientTransfer = {
		Notice	: "noticeDisplay",
		Info	: "patientInfo",
		Timer	: "patientDataTimer",
	}
	static initializeNotice(patientData, timeLeft = 90, callback=()=>{return;}) {
		const notice = PCX.createDOM('div', {id: PCX.patientTransfer.Notice});
			notice.style = "position:fixed; top:0; width:100%; background-color:yellow; z-index:1000; padding:10px; display:flex; justify-content:space-between;";

		// Left side: Patient details
		const patientInfo = PCX.createDOM('span', {
			id: 			PCX.patientTransfer.Info,
			textContent: 	`Patient: ${patientData.LastName}, ${patientData.FirstName} | ${patientData.Category}`
		});
			patientInfo.dataset.hash = PCX.hashCode(`${patientData.LastName}${patientData.FirstName}${patientData.Category}`)

		// Right side: Countdown timer
		const timer = PCX.createDOM('span', {id: PCX.patientTransfer.Timer, textContent: "-:--"})

		notice.appendChild(patientInfo);
		notice.appendChild(timer);
		document.body.appendChild(notice);
	}

	static noticeUpdate(patientData, timeLeft = 90, callback=()=>{return;}) {
		if(PCX.getEl(`#${PCX.patientTransfer.Notice}`,true)) {
			const hashCode = PCX.hashCode(`${patientData.LastName}${patientData.FirstName}${patientData.Category}`);
			if (PCX.getEl(`#${PCX.patientTransfer.Info}`,true).dataset.hash == hashCode) {
				return;
			}
			PCX.getEl(`#${PCX.patientTransfer.Info}`).dataset.hash = hashCode;
		
			PCX.getEl(`#${PCX.patientTransfer.Info}`).textContent = `Patient: ${patientData.LastName}, ${patientData.FirstName} | ${patientData.Category}`;

			if (PCX.getEl(`#${PCX.patientTransfer.Timer}`,true)) {
				const minutes = Math.floor(timeLeft / 60);
				const seconds = timeLeft % 60;
				PCX.getEl(`#${PCX.patientTransfer.Timer}`).textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
			}
		}else{
			PCX.initializeNotice(patientData, timeLeft, callback);
		}

		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			//if(chrome.runtime.id == undefined) return;
			if (message.action === 'noticePing') {
				if (timeLeft <= 0) {
					PCX.getEl(`#${PCX.patientTransfer.Notice}`,true).remove();
				}else{
					PCX.getEl(`#${PCX.patientTransfer.Timer}`).textContent = message.timerText;
				}
			}
		});
		if (callback) {callback();}
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
	static getUrlDirectory() {
		return window.location.pathname.split('/');
	}

	static async processEnabled(category, key, trueCallback, callback) {
		let result = await Settings.check(category, key, callback);

		// Fetch permission metadata (fallback to default if undefined)
		let metadata = Settings.PERMISSION_STRUCTURE[category]?.[key] || { description: "", priority: 10 };

		PCX.log(`processEnabled: ${category} - ${key} =`, result, "Priority:", metadata.priority);

		return result ? trueCallback?.() ?? true : result;
	}


/**
 * 
 * Tools
 * 
 */
	/**
	 * currentUser
	 * @return STRING/BOOL
	 */
	static currentUser() {
		if(!PCX.getEl('.userName',true)){return;}
		return PCX.getEl('.userName').textContent.replace('Welcome ','').replace(' ','');
	}

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
		if (PCX.getUrlParams()['debug']==true) {
			console.log(message);
		}
	}

	static hashCode(string) {
	  var hash = 0,
	    i, chr;
	  if (string.length === 0) return hash;
	  for (i = 0; i < string.length; i++) {
	    chr = string.charCodeAt(i);
	    hash = ((hash << 5) - hash) + chr;
	    hash |= 0; // Convert to 32bit integer
	  }
	  return hash;
	}

	static disableTabIndex(elements,iframe="") {
		elements.forEach((selector) => {
			if(iframe!="") {
				PCX.getEl(iframe).contentWindow.document.querySelector(selector).setAttribute("tabindex","-1");
			} else {
				PCX.getEl(selector).setAttribute("tabindex","-1");
			}
		});
	}

	static createDOM(domType, properties={}) {
		return Object.assign(document.createElement(domType), properties);
	}
	
}

// Expose PCX to the window
window.PCX = PCX;


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
