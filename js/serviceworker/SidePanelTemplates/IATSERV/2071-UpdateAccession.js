// 2071-UpdateAccession.js

const stabilityThresholds = {
	CGX:     { internal: 0, reference: 90 },
	IMMUNO:  { internal: 60, reference: 90 },
	CARDIO:  { internal: 60, reference: 90 },
	NEURO:   { internal: 60, reference: 90 },
	THYROID: { internal: 60, reference: 90 },
	UTI:     { internal: 4, reference: 0 },
	WOUND:   { internal: 4, reference: 0 },
};

function getPillClass(days) {
	if (typeof days !== "number") return "expired";
	if (days > 30) return "good";
	if (days > 10) return "warning";
	if (days > 0) return "critical";
	return "expired";
}

function evaluateStability(data) {
	const testType = data.test.toUpperCase();
	const thresholds = stabilityThresholds[testType] || { internal: 0, reference: 0 };
	const daysSinceCollection = Math.ceil((Date.now() - new Date(data.doc).getTime()) / 86400000);

	const internalRemaining = thresholds.internal > 0 ? thresholds.internal - daysSinceCollection : null;
	const referenceRemaining = thresholds.reference > 0 ? thresholds.reference - daysSinceCollection : null;

	// Internal
	if (internalRemaining === null) {
		data.stability.internal = { text: "Not Available", class: "neutral" };
	} else if (internalRemaining >= 0) {
		data.stability.internal = {
			text: `${internalRemaining} days remaining`,
			class: getPillClass(internalRemaining),
		};
	} else {
		data.stability.internal = { text: "Out of Lab Stability", class: "expired" };
	}

	// Reference
	if (referenceRemaining === null) {
		data.stability.reference = { text: "Internal Only", class: "neutral" };
	} else if (referenceRemaining >= 0) {
		data.stability.reference = {
			text: `${referenceRemaining} days remaining`,
			class: getPillClass(referenceRemaining),
		};
	} else {
		data.stability.reference = { text: "Out of Lab Stability", class: "expired" };
	}

	// Recommendation
	if (internalRemaining !== null && internalRemaining >= 0) {
		data.stability.recommendation = { text: "Test Internally", class: "good" };
	} else if (referenceRemaining !== null && referenceRemaining >= 0) {
		data.stability.recommendation = { text: "Send to Reference Lab", class: "warning" };
	} else {
		data.stability.recommendation = { text: "Discard", class: "expired" };
	}
}

export default async function (data) {
	console.log("UpdateAccession data", data);
	try {
		if (Array.isArray(data.pageContext.patient)) {
			data.patient = data.pageContext.patient.join(", ");
		}
		data.test = data.pageContext.test;
		data.doc = data.pageContext.doc;

		data.stability = {
			internal: { text: "Expired", class: "expired" },
			reference: { text: "Expired", class: "expired" },
			recommendation: { text: "Discard", class: "expired" }
		};
		data.clipboard = data.pageContext.clipboard;

		data.status = data.pageContext.acsStatus[0];
		data.subStatus = data.pageContext.acsStatus[1];

		// Skip evaluation if the test is fully resulted
		if (data.status.toUpperCase() !== 'RESULTED') {
			evaluateStability(data);
		}

		delete data.pageContext;
	} catch (e) {
		console.log("UpdateAccession error", e);
	}
	console.log("UpdateAccession data", data);
}
