// Operator.js
import { DOMHelper } from './DOMHelper.js';
import { Logger } from './Logger.js';

export class Operator extends DOMHelper {
	/**
	 * Retrieves extra parameters from the URL query string.
	 * This method wraps the getUrlParams() function from DOMHelper.
	 * @returns {Object} An object mapping URL parameter keys to values.
	 */
	getExtraParams() {
		try {
			const params = this.getUrlParams();
			Logger.log(`Operator.getExtraParams: Retrieved extra parameters`, { params });
			return params;
		} catch (error) {
			Logger.error(`Operator.getExtraParams: Failed to retrieve extra parameters`, { error });
			return {};
		}
	}

	/**
	 * A placeholder method for preparing the page state.
	 * CMS‑specific classes should override this method to return a structured
	 * object containing properties such as `lims`, `location`, and any extra parameters.
	 * @returns {Object} An object representing the page state.
	 */
	preparePageState() {
		Logger.warn(`Operator.preparePageState: This method should be overridden by a CMS-specific subclass.`);
		return {
			lims: null,
			location: null,
			extraParams: this.getExtraParams()
		};
	}

	/**
	 * Retrieves the directory segments of the current URL.
	 * This can be useful for CMS modules (like DXRESULTS) that use URL path segments for routing.
	 * @returns {string[]} An array of non-empty path segments.
	 */
	getDirectorySegments() {
		try {
			const segments = this.getUrlDirectory();
			Logger.log(`Operator.getDirectorySegments: Retrieved directory segments`, { segments });
			return segments;
		} catch (error) {
			Logger.error(`Operator.getDirectorySegments: Failed to retrieve directory segments`, { error });
			return [];
		}
	}

	/**
	 * Additional shared functionality can be added here.
	 * For example, you could include methods for common data transformations,
	 * validations, or other utility logic that is common across your CMS modules.
	 */
}
