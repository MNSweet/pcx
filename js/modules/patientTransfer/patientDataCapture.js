// /js/modules/patientTransfer/patientDataCapture.js
Logger.file("patientDataCapture");
class PatientDataCapture extends DOMHelper {
	// Mapping from normalized keys to source DOM selectors.
	static fieldMapping = {
		firstName: '#tbFirstName',
		lastName: '#tbLastName',
		middleName: '#tbMiddleName',
		dob: '#tbDOB', 
		gender: '#ddGender',
		race: '#ddRace',
		address1: '#AddressControl1_tbAddress1',
		address2: '#AddressControl1_tbAddress2',
		state: '#AddressControl1_ddState',
		city: '#AddressControl1_tbCity',
		zip: '#AddressControl1_tbZipCode',
		phone: '#AddressControl1_tbPhone',
		email: '#AddressControl1_tbEmail',
		DOC: '#tbCollectionDateTime'
	};

	/**
	 * Capture patient data from the page using the defined mapping.
	 * @returns {Object} A normalized patient data object.
	 */
	capture() {
		const data = {};
		try {
			// Iterate over fieldMapping and capture values.
			for (const [key, selector] of Object.entries(PatientDataCapture.fieldMapping)) {
				const element = this.getEl(selector, true);
				if (element) {
					data[key] = element.value !== undefined ? element.value.trim() : element.textContent.trim();
				} else {
					Logger.warn(
						`PatientDataCapture.capture: Element not found for selector "${selector}" (field: ${key})`
					);
					data[key] = null;
				}
			}

			const addr1 = data.address1 || '';
			const addr2 = data.address2 || '';
			data.address = `${addr1} ${addr2}`.trim();

			// Remove the individual address fields.
			delete data.address1;
			delete data.address2;

			Logger.log('PatientDataCapture.capture: Captured patient data', { data });
			return data;
		} catch (error) {
			Logger.error('PatientDataCapture.capture: Error capturing patient data', { error });
			return null;
		}
	}

	/**
	 * Save captured patient data to chrome.storage.
	 * @param {Object} patientData - The normalized patient data object.
	 */
	save(patientData) {
		try {
			chrome.storage.local.set({ patientData }, () => {
				Logger.log('PatientDataCapture.save: Patient data saved to storage', { patientData });
			});
		} catch (error) {
			Logger.error('PatientDataCapture.save: Failed to save patient data', { error });
		}
	}

	/**
	 * Main entry point: capture the patient data, save it, and send a message to trigger transfer.
	 */
	captureAndSave() {
		const data = this.capture();
		if (data) {
			this.save(data);
			// Notify the background to begin the patient transfer process.
			chrome.runtime.sendMessage({ action: 'initPatientTransfer', patientData: data });
		} else {
			Logger.error('PatientDataCapture.captureAndSave: No data captured; aborting transfer');
		}
	}
}

document.addEventListener('DOMContentLoaded', () => {
	const capturer = new PatientDataCapture();
});
