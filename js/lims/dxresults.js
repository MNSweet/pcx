// /js/lims/DXRESULTS.js
Logger.log('DXRESULTS Loaded',"INIT");

class DXRESULTS extends LIMS {
	constructor() {
		super();
		this.lims = "DXRESULTS";
		// Override getExtraParams() to use DOMHelper's getUrlDirectory for DXRESULTS.
		this.extraParams = this.getExtraParams();
		this.location = this.extraParams.directory[1] || "Home";
		// Define a default selector for the notice area.
		this.noticeDisplay = "#noticeDisplay";
	}

	// Override getExtraParams to return the URL directory.
	getExtraParams() {
		return { directory: this.getUrlDirectory() };
	}

	/**
	 * Checks if the provided test category matches the current location.
	 * @param {string} category
	 * @returns {boolean}
	 */
	validTestCatLocation(category) {
		return this.location === category;
	}

	/**
	 * Uses DestinationFormFiller to prefill the order form on a reference lab page.
	 * After prefill, clears the stored patient data.
	 */
	async prefillOrderForm() {
		const destinationId = "pncDXResults"; // Since we're in DXRESULTS.
		const formFiller = new DestinationFormFiller(destinationId);
		await formFiller.fillForm();
		Logger.log("DXRESULTS.prefillOrderForm: Order form prefilled.", { destinationId });
		await DataHandler.set("chrome", "patientData", {});
		if (this.getEl(this.noticeDisplay)) {
			this.getEl(this.noticeDisplay).remove();
		}
	}
}

window.DXRESULTS = DXRESULTS();