// /js/modules/patientTransfer/TransferSidePanelIntegration.js
Logger.log("/js/modules/patientTransfer/TransferSidePanelIntegration.js");

let transferTimer = null;

/**
 * Clears the transfer timer if set.
 */
export function clearTransferTimer() {
	if (transferTimer) {
		clearTimeout(transferTimer);
		transferTimer = null;
	}
}

/**
 * Starts a 3-minute timer to purge patient data from chrome.storage.
 */
function startTransferTimer() {
	clearTransferTimer();
	transferTimer = setTimeout(() => {
		chrome.storage.local.remove("patientData", () => {
			Logger.log("TransferSidePanelIntegration: Patient data purged due to inactivity.");
			// Optionally, update the notice panel to indicate expiry.
			if (window.transferNoticeControllerInstance) {
				window.transferNoticeControllerInstance.showMessage("Patient data expired.");
			}
		});
	}, 180000); // 3 minutes = 180,000ms
}

/**
 * Checks if the current page meets the conditions to allow a transfer.
 * Conditions:
 *  - The URL parameter "LinkId" equals "2071" (update Accession page).
 *  - The performing lab container (div#dvPerformingLabContainer) is visible.
 *  - The lab ID (from a data attribute, e.g., data-labid) is not "1012".
 * @returns {boolean}
 */
function canTransfer() {
	const urlParams = new URLSearchParams(window.location.search);
	const linkId = urlParams.get("LinkId");
	if (linkId !== "2071") {
		Logger.log("TransferSidePanelIntegration: Not an update accession page (LinkId !== 2071).");
		return false;
	}

	const labContainer = document.querySelector("div#dvPerformingLabContainer");
	if (!labContainer || window.getComputedStyle(labContainer).display === "none") {
		Logger.log("TransferSidePanelIntegration: Performing lab container not visible.");
		return false;
	}

	const labId = labContainer.getAttribute("data-labid") || "";
	if (labId === "1012") {
		Logger.log("TransferSidePanelIntegration: Performing lab is Prince Laboratories (1012).");
		return false;
	}

	return true;
}

/**
 * loadPatient() – Loads the full patient data non-intrusively via a hidden iframe.
 * It loads Pupup.aspx, captures the necessary patient fields, saves them to chrome.storage,
 * starts the auto-purge timer, and updates (or creates) the TransferNoticeController.
 */
function loadPatient() {
	const patientIdEl = document.querySelector("input#MainContent_ctl00_tbPatient_tbID");
	const locationIdEl = document.querySelector("input#MainContent_ctl00_tbLocation_tbID");
	if (!(patientIdEl && locationIdEl)) {
		alert("Unable to retrieve PatientId or LocationId from the current page.");
		return;
	}
	const patientId = patientIdEl.value;
	const locationId = locationIdEl.value;
	const url = `https://prince.iatserv.com/Pupup.aspx?LinkId=2022&PatientId=${patientId}&LocationId=${locationId}`;
	Logger.log("TransferSidePanelIntegration.loadPatient: Loading full patient data via hidden iframe", { url });
	
	let iframeContainer = document.getElementById("hiddenPatientDataIframeContainer");
	if (!iframeContainer) {
		iframeContainer = document.createElement("div");
		iframeContainer.id = "hiddenPatientDataIframeContainer";
		iframeContainer.style.display = "none";
		document.body.appendChild(iframeContainer);
	}
	const iframe = document.createElement("iframe");
	iframe.src = url;
	iframe.id = "hiddenPatientDataIframe";
	iframe.style.width = "1px";
	iframe.style.height = "1px";
	iframeContainer.appendChild(iframe);
	
	iframe.addEventListener("load", () => {
		setTimeout(() => {
			try {
				const iframeDoc = iframe.contentWindow.document;
				const patientData = {};
				patientData.firstName = iframeDoc.querySelector("#tbFirstName")?.value || "";
				patientData.lastName = iframeDoc.querySelector("#tbLastName")?.value || "";
				patientData.middleName = iframeDoc.querySelector("#MainContent_ctl00_tbMiddleName")?.value || "";
				patientData.dob = iframeDoc.querySelector("#MainContent_ctl00_tbDOB_tbText")?.value || "";
				patientData.gender = iframeDoc.querySelector("#MainContent_ctl00_ddGender_ddControl option:checked")?.textContent.trim() || "";
				patientData.race = iframeDoc.querySelector("#MainContent_ctl00_ddRace_ddControl option:checked")?.textContent.trim() || "";
				const addr1 = iframeDoc.querySelector("#MainContent_ctl00_AddressControl1_tbAddress1")?.value || "";
				const addr2 = iframeDoc.querySelector("#MainContent_ctl00_AddressControl1_tbAddress2")?.value || "";
				patientData.address = `${addr1} ${addr2}`.trim();
				patientData.state = iframeDoc.querySelector("#MainContent_ctl00_AddressControl1_CountryState_ddState option:checked")?.textContent.trim() || "";
				patientData.city = iframeDoc.querySelector("#MainContent_ctl00_AddressControl1_tbCity")?.value || "";
				patientData.zip = iframeDoc.querySelector("#MainContent_ctl00_AddressControl1_tbZipCode")?.value || "";
				patientData.phone = iframeDoc.querySelector("#MainContent_ctl00_AddressControl1_tbPhone")?.value || "";
				patientData.email = iframeDoc.querySelector("#MainContent_ctl00_AddressControl1_tbEmail")?.value || "";
				
				Logger.log("TransferSidePanelIntegration.loadPatient: Captured full patient data", { patientData });
				chrome.storage.local.set({ patientData }, () => {
					Logger.log("TransferSidePanelIntegration.loadPatient: Full patient data saved to storage.");
					startTransferTimer();
					if (window.transferNoticeControllerInstance) {
						window.transferNoticeControllerInstance.updatePanel(patientData);
					} else {
						window.transferNoticeControllerInstance = new TransferNoticeController(patientData);
						window.transferNoticeControllerInstance.showHandle();
					}
				});
				if (iframeContainer.contains(iframe)) {
					iframeContainer.removeChild(iframe);
				}
			} catch (error) {
				Logger.error("TransferSidePanelIntegration.loadPatient: Error capturing data from iframe", { error });
				if (iframe.parentNode) {
					iframe.parentNode.removeChild(iframe);
				}
			}
		}, 500);
	});
}

/**
 * prefillOrderForm() – Checks if the current page is a valid reference lab order page.
 * If so, uses DestinationFormFiller to populate the form and purges the stored patient data.
 */
function prefillOrderForm() {
	let destinationId = null;
	const currentUrl = window.location.href;
	if (/pnc\.dxresults\.com/i.test(currentUrl)) {
		destinationId = "pncDXResults";
	} else if (/iatserv\.com/i.test(currentUrl)) {
		destinationId = "reliableIATServ";
	}
	if (!destinationId) {
		alert("This page is not eligible for form prefill. Please open a Reference Lab order page.");
		return;
	}
	const formFiller = new DestinationFormFiller(destinationId);
	formFiller.fillForm();
	Logger.log("TransferSidePanelIntegration.prefillOrderForm: Form prefill triggered", { destinationId });
	chrome.storage.local.remove("patientData", () => {
		Logger.log("TransferSidePanelIntegration.prefillOrderForm: Patient data purged after form fill.");
	});
	clearTransferTimer();
}

/**
 * Main Integration:
 * - On DOMContentLoaded, check if transfer conditions are met.
 * - If so, instantiate the TransferNoticeController and display the transfer handle.
 * - Bind explicit buttons (if present) for loading full patient data and prefill action.
 */
document.addEventListener("DOMContentLoaded", () => {
	if (canTransfer()) {
		chrome.storage.local.get("patientData", (result) => {
			const patientData = result.patientData || {};
			window.transferNoticeControllerInstance = new TransferNoticeController(patientData);
			window.transferNoticeControllerInstance.showHandle();
			const handle = document.getElementById("patientDataHandle");
			if (handle) {
				handle.addEventListener("dblclick", loadPatient);
			}
		});
	} else {
		Logger.log("TransferSidePanelIntegration: Transfer conditions not met; transfer UI will not be shown.");
	}
	
	const loadDataBtn = document.getElementById("loadFullPatientDataBtn");
	if (loadDataBtn) {
		loadDataBtn.addEventListener("click", loadPatient);
	} else {
		Logger.warn("TransferSidePanelIntegration: 'Load Full Patient Data' button not found.");
	}
	
	const prefillBtn = document.getElementById("prefillOrderFormBtn");
	if (prefillBtn) {
		prefillBtn.addEventListener("click", prefillOrderForm);
	} else {
		Logger.warn("TransferSidePanelIntegration: 'Prefill Order Form' button not found.");
	}
});
