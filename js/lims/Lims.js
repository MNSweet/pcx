// /js/lims/LIMS.js
Logger.log('/js/lims/LIMS.js')

class LIMS extends DOMHelper {
	constructor() {
		super();
		// Initialize shared properties common to all LIM implementations.
		this.labs = {};
		this.testCategories = {};
		this.categoryTranslation = {};
		this.genderTranslation = {};
		this.raceTranslation = {};
		this.orderDefaults = {};
		this.selectors = {};
	}

	// --- Shared Setters ---
	setLabs(labs) {
		if (typeof labs === "object") {
			this.labs = labs;
		}
	}

	setTestCategories(testCats) {
		if (typeof testCats === "object") {
			this.testCategories = testCats;
		}
	}

	setCategoryTranslation(catTranslation) {
		if (typeof catTranslation === "object") {
			this.categoryTranslation = catTranslation;
		}
	}

	setGenderTranslation(genderTranslation) {
		if (typeof genderTranslation === "object") {
			this.genderTranslation = genderTranslation;
		}
	}

	setRaceTranslation(raceTranslation) {
		if (typeof raceTranslation === "object") {
			this.raceTranslation = raceTranslation;
		}
	}

	setOrderDefaults(orderDefaults) {
		if (typeof orderDefaults === "object") {
			this.orderDefaults = orderDefaults;
		}
	}

	setSelectors(selector) {
		if (typeof selector === "object") {
			this.selectors = selector;
		}
	}

	/**
	 * getExtraParams can be used if any child classes require a copy of URL parameters.
	 * For example, IATSERV can override this if needed.
	 */
	getExtraParams() {
		// Default implementation: return an empty object.
		return {};
	}
}

window.LIMS = LIMS;