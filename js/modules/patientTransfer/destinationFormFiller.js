// destinationFormFiller.js
import { mapPatientDataWithTransform } from "./dataMapping.js";
import { Logger } from "../helpers/Logger.js";
import { DOMHelper } from "../helpers/DOMHelper.js";

export class DestinationFormFiller extends DOMHelper {
	/**
	 * @param {string} destinationId - Key for the destination mapping configuration (e.g., 'reliableIATServ' or 'pncDXResults').
	 */
	constructor(destinationId) {
		super();
		this.destinationId = destinationId;
	}

	/**
	 * Retrieves the patient data stored in chrome.storage.
	 * @returns {Promise<Object|null>} - Resolves with the patient data object or null if none exists.
	 */
	getPatientData() {
		return new Promise((resolve, reject) => {
			try {
				chrome.storage.local.get("patientData", (result) => {
					if (chrome.runtime.lastError) {
						Logger.error("DestinationFormFiller.getPatientData: Error retrieving patient data", {
							error: chrome.runtime.lastError,
						});
						return reject(chrome.runtime.lastError);
					}
					if (result.patientData && Object.keys(result.patientData).length > 0) {
						Logger.log("DestinationFormFiller.getPatientData: Patient data retrieved", {
							patientData: result.patientData,
						});
						resolve(result.patientData);
					} else {
						Logger.warn("DestinationFormFiller.getPatientData: No patient data found");
						resolve(null);
					}
				});
			} catch (error) {
				Logger.error("DestinationFormFiller.getPatientData: Exception occurred", { error });
				reject(error);
			}
		});
	}

	/**
	 * Fills the destination form with patient data.
	 * It maps the normalized data to destination-specific field selectors and populates the fields.
	 */
	async fillForm() {
		try {
			const patientData = await this.getPatientData();
			if (!patientData) {
				Logger.warn("DestinationFormFiller.fillForm: No patient data available for form filling.");
				return;
			}

			// Transform the normalized patient data using the destination mapping and optional transformations.
			const mappedData = mapPatientDataWithTransform(this.destinationId, patientData);
			Logger.log("DestinationFormFiller.fillForm: Mapped patient data", { mappedData });

			// Iterate over each mapping entry and set the value in the corresponding field.
			for (const [targetSelector, value] of Object.entries(mappedData)) {
				const field = this.getEl(targetSelector, true);
				if (field) {
					// If it's an input, textarea, or select, set its value.
					if (
						field.tagName === "INPUT" ||
						field.tagName === "TEXTAREA" ||
						field.tagName === "SELECT"
					) {
						field.value = value;
						// Optionally, simulate a change event.
						field.dispatchEvent(new Event("change", { bubbles: true }));
						Logger.log(`DestinationFormFiller.fillForm: Set value for ${targetSelector}`, { value });
					} else {
						// Otherwise, set the textContent.
						field.textContent = value;
						Logger.log(`DestinationFormFiller.fillForm: Set text content for ${targetSelector}`, { value });
					}
				} else {
					Logger.warn(`DestinationFormFiller.fillForm: Field not found for selector "${targetSelector}"`);
				}
			}
		} catch (error) {
			Logger.error("DestinationFormFiller.fillForm: Error while filling form", { error });
		}
	}
}

// Example usage:
// Assuming the destination page is loaded and you know which destination mapping to use:
document.addEventListener("DOMContentLoaded", () => {
	// For example, if we're on a pncDXResults page:
	const destinationId = "pncDXResults"; // or 'reliableIATServ'
	const formFiller = new DestinationFormFiller(destinationId);
	formFiller.fillForm();
});
