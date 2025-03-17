// /js/modules/helpers/QAManager.js
Logger.file("QAManager");

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
		Logger.log(`Notice added with code ${code}: ${message}`);
	}

	static removeNotice(code) {
		if (QAManager.notices[code]) {
			delete QAManager.notices[code];
			Logger.log(`Notice removed with code ${code}`);
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
		Logger.log("All notices cleared.");
	}
	static getRandomPhrase() {
		return QAManager.noticePhrases[Math.floor(Math.random() * QAManager.noticePhrases.length)];
	}


	static showQAModalNotification() {
		let noticeItems = "";

		// Load external CSS file
		if (!DOMHelper.getEl("#pcx-modal-style")) {
			const link = DOMHelper.createDOM("link", {id: "pcx-modal-style", rel: "stylesheet", href: chrome.runtime.getURL("css/modal.css")});
			document.head.appendChild(link);
		}
		if (!DOMHelper.getEl("#pcx-qa-modal-container")) {
			const modalContainer = DOMHelper.createDOM("div", {id: "pcx-qa-modal-container"});
			  const modal = DOMHelper.createDOM("div", {id: "pcx-qa-modal"});
				const modalTitle = DOMHelper.createDOM("div", {
					innerHTML: "<span>Prince Lab Manager</span>" + QAManager.getRandomPhrase(),
					id: "pcx-qa-modal-heading"
				})
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

			const modalMessage = DOMHelper.createDOM("div", {innerHTML: noticeItems, id: "noticeContainer"});
			const buttonContainer = DOMHelper.createDOM("div", {id: "pcx-qa-modal-buttons"});
			modal.appendChild(modalMessage);
			modal.appendChild(buttonContainer);

			const okButton = DOMHelper.createDOM("button", {
				textContent: "Close to fix errors",
				id: "pcx-qa-modal-close",
				onclick: ()=>{
					document.body.removeChild(modalContainer);
					Logger.log("Modal dismissed");
				}
			})
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
				}
			);
			document.querySelectorAll('.noticeCancel').forEach(
				(btn)=>{
					btn.addEventListener('click',()=>{document.body.removeChild(modalContainer)})
				}
			);
			
		}
	}
	
	static setStablityNotice(parentElement,stabilityDate,existingAcs = false) {
		Logger.log("setStablityNotice: ",parentElement,stabilityDate,existingAcs);
		if(stabilityDate == "") {return;}
		let stabilityAge = Math.floor(
			(new Date() - new Date(stabilityDate)) / (1000 * 60 * 60 * 24)
		);

		let stabilityText	= "";
		let stabilityPhase	= "";
		if(stabilityAge < 0){
			stabilityText	= `Future?`;
			stabilityPhase	= "phaseFour";
		}else if(stabilityAge >= 180){
			stabilityText	= `Expired`;
			stabilityPhase	= "phaseFour";
		}else if(stabilityAge > 88){
			stabilityText	= `${stabilityAge} Days Old`;
			stabilityPhase	= "phaseThree";
		}else if(stabilityAge > 57){
			stabilityText	= `${stabilityAge} Days Old`;
			stabilityPhase	= "phaseTwo";
		}else{
			stabilityText	= `${stabilityAge} Days Old`;
			stabilityPhase	= "phaseOne";
		}

		if(IATSERV.linkId == "2011" && IATSERV.type == "acs" && stabilityAge <= 90 && stabilityAge >= 60){
			DOMHelper.getEl(IATSERV.selectors.PreformingLab,true).value = 1013; // Principle's ID
			DOMHelper.getEl(IATSERV.selectors.PreformingLab,true).dispatchEvent(new Event('change'));
		}

		if(!DOMHelper.getEl('#stabilityNotice')) {
			const stabilityNotice = DOMHelper.createDOM("div", {
				innerHTML: `<span class="QAManagerSubHeading">Sample Stability</span><span id="stabilityNoticeAge"></span>`,
				id: "stabilityNotice"
			})
			DOMHelper.getEl(parentElement).appendChild(stabilityNotice);
		}
		DOMHelper.getEl('#stabilityNoticeAge').textContent = stabilityText;
		DOMHelper.getEl('#stabilityNotice',true).classList = stabilityPhase + (existingAcs?" stabilityNoticeExistingACS":"");
	}
}