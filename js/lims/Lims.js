// /js/lims/Lims.js
import { DOMHelper } from "../modules/helpers/DOMHelper.js";

export class Lims extends DOMHelper {
	constructor() {
		super();
		// Initialize shared properties
		this.labs = {};
		this.testCategories = {};
		this.categoryTranslation = {};
		this.genderTranslation = {};
		this.raceTranslation = {};
		this.orderDefaults = {};
		this.selectors = {};
	}

  	// --- Configuration setters ---
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
}