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
		PCX.log(`Notice added with code ${code}: ${message}`);
	}

	static removeNotice(code) {
		if (QAManager.notices[code]) {
			delete QAManager.notices[code];
			PCX.log(`Notice removed with code ${code}`);
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
		PCX.log("All notices cleared.");
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
				PCX.log("Modal dismissed");
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
		if(stabilityDate == "") {return;}
		let stabilityAge = Math.floor(
			(new Date() - new Date(stabilityDate)) / (1000 * 60 * 60 * 24)
		);

		let stabilityText	= "";
		let stabilityPhase	= "";
		if(stabilityAge >= 180){
			stabilityText	= `Expired`;
			stabilityPhase	= "phaseFour";
		}else if(stabilityAge > 88){
			stabilityText	= `${stabilityAge} Days Old`;
			stabilityPhase	= "phaseThree";
		}else if(stabilityAge > 27){
			stabilityText	= `${stabilityAge} Days Old`;
			stabilityPhase	= "phaseTwo";
		}else{
			stabilityText	= `${stabilityAge} Days Old`;
			stabilityPhase	= "phaseOne";
		}

		if(!PCX.findEl('#stabilityNotice')) {
			const stabilityNotice = document.createElement("div");
				stabilityNotice.innerHTML = `<span class="QAManagerSubHeading">Sample Stability</span><span id="stabilityNoticeAge"></span>`;
				stabilityNotice.id = "stabilityNotice";
			PCX.findEl(parentElement).appendChild(stabilityNotice);
		}
		PCX.findEl('#stabilityNoticeAge').textContent = stabilityText;
		PCX.findEl('#stabilityNotice').classList = stabilityPhase + (existingAcs?" stabilityNoticeExistingACS":"");
	}
}

// Expose QAManager to the window
window.QAManager = QAManager;