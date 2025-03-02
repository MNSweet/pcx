// /js/modules/patientTransfer/dataMapping.js
Logger.log("dataMapping Loaded","INIT");

/**
 * Mapping configuration for each destination.
 * Keys are the normalized field names (from patientDataCapture),
 * and values are the target DOM selectors (or field identifiers) expected on the destination site.
 */
const mappingConfigurations = {
	// For Reliable IATServ destination.
	reliableIATServ: {
		firstName: '#reliable_firstName',
		lastName: '#reliable_lastName',
		middleName: '#reliable_middleName',
		dob: '#reliable_dob',
		gender: '#reliable_gender',
		race: '#reliable_race',
		address: '#reliable_address',
		state: '#reliable_state',
		city: '#reliable_city',
		zip: '#reliable_zip',
		phone: '#reliable_phone',
		email: '#reliable_email',
		DOC: '#reliable_doc'
	},
	// For pnc DXResults destination.
	pncDXResults: {
		firstName: '#dx_firstName',
		lastName: '#dx_lastName',
		middleName: '#dx_middleName',
		dob: '#dx_dob',
		gender: '#dx_gender',
		race: '#dx_race',
		address: '#dx_address',
		state: '#dx_state',
		city: '#dx_city',
		zip: '#dx_zip',
		phone: '#dx_phone',
		email: '#dx_email',
		DOC: '#dx_doc'
	}
};

/**
 * Modify the normalized data before populating the target fields.
 * Each transformation is optional per field.
 */
const mappingTransformations = {
	reliableIATServ: {
		firstName: (value) => value.toUpperCase(),
		lastName: (value) => value.toUpperCase()
	},
	pncDXResults: {
		// Transformations for DXResults
	}
};

/**
 * Maps the normalized patient data to the destination form.
 * @param {string} destinationId - The key from mappingConfigurations (e.g. 'reliableIATServ' or 'pncDXResults').
 * @param {Object} patientData - The normalized patient data object.
 * @returns {Object} An object where keys are target selectors and values are the corresponding data.
 */
function mapPatientData(destinationId, patientData) {
	const mapping = mappingConfigurations[destinationId];
	if (!mapping) {
		throw new Error(`No mapping configuration found for destination: ${destinationId}`);
	}
	const mappedData = {};
	for (const [normalizedKey, targetSelector] of Object.entries(mapping)) {
		if (patientData[normalizedKey] !== undefined) {
			mappedData[targetSelector] = patientData[normalizedKey];
		}
	}
	return mappedData;
}

/**
 * Maps the normalized patient data to the destination form using optional transformations.
 * @param {string} destinationId - The key from mappingConfigurations.
 * @param {Object} patientData - The normalized patient data object.
 * @returns {Object} An object where keys are target selectors and values are transformed data.
 */
function mapPatientDataWithTransform(destinationId, patientData) {
	const mapping = mappingConfigurations[destinationId];
	const transformations = mappingTransformations[destinationId] || {};
	if (!mapping) {
		throw new Error(`No mapping configuration found for destination: ${destinationId}`);
	}
	const mappedData = {};
	for (const [normalizedKey, targetSelector] of Object.entries(mapping)) {
		if (patientData[normalizedKey] !== undefined) {
			const transform = transformations[normalizedKey];
			const value = transform ? transform(patientData[normalizedKey]) : patientData[normalizedKey];
			mappedData[targetSelector] = value;
		}
	}
	return mappedData;
}
