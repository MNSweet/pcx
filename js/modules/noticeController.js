// noticeController.js
import { DOMHelper } from "./DOMHelper.js";
import { Logger } from "./Logger.js";

export class NoticeController extends DOMHelper {
	_handleId = "patientDataHandle";
	_panelId = "patientDataPanel";
	_prefillBtnId = "prefillOrderBtn";
	_messageId = "prefillMessage";
	_infoId = "patientInfoDisplay";

	constructor(patientData) {
		super();
		this.patientData = patientData;
		this.validUrlPatterns = [
			/[\?&]LinkId=2071/i,
			/\/PGx/i,
			/\/CGx/i,
			/\/ImmunodeficiencyReq\.aspx/i,
			/\/Neurology/i
		];
	}

	isEligibleForPrefill() {
		const currentUrl = window.location.href;
		return this.validUrlPatterns.some(pattern => pattern.test(currentUrl));
	}

	showHandle() {
		let handle = this.getEl(`#${this._handleId}`);
		if (!handle) {
			handle = this.createDOM("div", { id: this._handleId, textContent: "Patient Data" });
			// Instead of inline styles, add the CSS class for styling.
			handle.classList.add("notice-handle");

			const sidePanel = this.getEl("#sidePanelContainer");
			if (sidePanel) {
				sidePanel.appendChild(handle);
			} else {
				document.body.appendChild(handle);
			}
			handle.addEventListener("click", () => this.togglePanel());
		}
		Logger.log("NoticeController.showHandle: Patient data handle displayed.");
	}

	showPanel() {
		let panel = this.getEl(`#${this._panelId}`);
		if (!panel) {
			panel = this.createDOM("div", { id: this._panelId });
			// Assign the pre-defined CSS class for the panel.
			panel.classList.add("notice-panel");

			// Create patient info element.
			const infoDisplay = this.createDOM("div", { id: this._infoId });
			infoDisplay.classList.add("patient-info");
			infoDisplay.textContent = `Patient: ${this.patientData.lastName}, ${this.patientData.firstName} | ${this.patientData.category || ""}`;
			infoDisplay.dataset.hash = this._hash(`${this.patientData.lastName}${this.patientData.firstName}${this.patientData.category}`);
			panel.appendChild(infoDisplay);

			// Create prefill button.
			const prefillBtn = this.createDOM("button", { id: this._prefillBtnId, textContent: "Prefill Order Form" });
			prefillBtn.classList.add("prefill-btn");
			prefillBtn.disabled = !this.isEligibleForPrefill();
			prefillBtn.addEventListener("click", () => {
				if (this.isEligibleForPrefill()) {
					this.prefillOrderForm();
				} else {
					this.showMessage("Please open a Reference Lab order page to continue.");
				}
			});
			panel.appendChild(prefillBtn);

			// Create message area.
			const messageEl = this.createDOM("div", { id: this._messageId });
			messageEl.classList.add("message");
			panel.appendChild(messageEl);

			// Append the panel to the side panel container.
			const sidePanel = this.getEl("#sidePanelContainer");
			if (sidePanel) {
				sidePanel.appendChild(panel);
			} else {
				document.body.appendChild(panel);
			}
		}
		panel.style.transform = "translateX(0)";
		Logger.log("NoticeController.showPanel: Slide-out panel shown.");
	}

	togglePanel() {
		const panel = this.getEl(`#${this._panelId}`);
		if (panel) {
			if (panel.style.transform === "translateX(0)") {
				panel.style.transform = "translateX(100%)";
				Logger.log("NoticeController.togglePanel: Panel hidden.");
			} else {
				panel.style.transform = "translateX(0)";
				Logger.log("NoticeController.togglePanel: Panel shown.");
			}
		} else {
			this.showPanel();
		}
	}

	updatePanel(newPatientData) {
		this.patientData = newPatientData;
		const infoDisplay = this.getEl(`#${this._infoId}`, true);
		if (infoDisplay) {
			infoDisplay.textContent = `Patient: ${this.patientData.lastName}, ${this.patientData.firstName} | ${this.patientData.category || ""}`;
		}
		const prefillBtn = this.getEl(`#${this._prefillBtnId}`, true);
		if (prefillBtn) {
			prefillBtn.disabled = !this.isEligibleForPrefill();
		}
		Logger.log("NoticeController.updatePanel: Panel updated with new patient data.");
	}

	showMessage(message) {
		const messageEl = this.getEl(`#${this._messageId}`, true);
		if (messageEl) {
			messageEl.textContent = message;
		}
		Logger.log("NoticeController.showMessage: Message displayed.", { message });
	}

	clear() {
		const panel = this.getEl(`#${this._panelId}`, true);
		if (panel) {
			panel.remove();
		}
		const handle = this.getEl(`#${this._handleId}`, true);
		if (handle) {
			handle.remove();
		}
		Logger.log("NoticeController.clear: Notice panel and handle cleared.");
	}

	prefillOrderForm() {
		Logger.log("NoticeController.prefillOrderForm: Prefill action triggered.");
		// Example: chrome.runtime.sendMessage({ action: 'prefillOrderForm', patientData: this.patientData });
	}

	_hash(str) {
		let hash = 0;
		if (!str || str.length === 0) return hash;
		for (let i = 0; i < str.length; i++) {
			const chr = str.charCodeAt(i);
			hash = ((hash << 5) - hash) + chr;
			hash |= 0;
		}
		return hash;
	}
}

document.addEventListener("DOMContentLoaded", () => {
	const patientData = {
		firstName: "DemoFirst",
		lastName: "DemoLast",
		category: "Immuno"
	};
	const noticeController = new NoticeController(patientData);
	noticeController.showHandle();
});
