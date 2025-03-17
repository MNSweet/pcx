// /js/lims/LIMS.js
Logger.file("LIMS")

class LIMS extends DOMHelper {
	static {
		// Initialize shared properties common to all LIM implementations.
		LIMS.labs = {};
		LIMS.testCategories = {};
		LIMS.categoryTranslation = {};
		LIMS.genderTranslation = {};
		LIMS.raceTranslation = {};
		LIMS.orderDefaults = {};
		LIMS.selectors = {};
	}

	// --- Shared Setters ---
	static setLabs(labs) {
		if (typeof labs === "object") {
			LIMS.labs = labs;
		}
	}

	static setTestCategories(testCats) {
		if (typeof testCats === "object") {
			LIMS.testCategories = testCats;
		}
	}

	static setCategoryTranslation(catTranslation) {
		if (typeof catTranslation === "object") {
			LIMS.categoryTranslation = catTranslation;
		}
	}

	static setGenderTranslation(genderTranslation) {
		if (typeof genderTranslation === "object") {
			LIMS.genderTranslation = genderTranslation;
		}
	}

	static setRaceTranslation(raceTranslation) {
		if (typeof raceTranslation === "object") {
			LIMS.raceTranslation = raceTranslation;
		}
	}

	static setOrderDefaults(orderDefaults) {
		if (typeof orderDefaults === "object") {
			LIMS.orderDefaults = orderDefaults;
		}
	}

	static setSelectors(selector) {
		if (typeof selector === "object") {
			LIMS.selectors = selector;
		}
	}

	/**
	 * getExtraParams can be used if any child classes require a copy of URL parameters.
	 * For example, IATSERV can override this if needed.
	 */
	static getExtraParams() {
		// Default implementation: return an empty object.
		return {};
	}
}