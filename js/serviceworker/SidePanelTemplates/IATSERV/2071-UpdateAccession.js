// 2071-UpdateAccession.js
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

		data.status = data.pageContext.acsStatus[0];
		data.subStatus = data.pageContext.acsStatus[1];

		const stability = Math.ceil(((new Date()).getTime() - (new Date(data.doc)).getTime()) / 86400000);

		if (data.status.toUpperCase() !== 'RESULTED') {
			const testType = data.test.toUpperCase();

			if (["IMMUNO", "CARDIO", "NEURO", "THYROID", "CGX"].includes(testType) && stability <= 120) {
				// Internal
				const intMaxNGS = 60;//Internal Stablity Threshold
				if (testType === "CGX") {
					data.stability.internal = { text: "Test Not Available", class: "neutral" };
				} else if (stability <= intMaxNGS) {
					data.stability.internal = { text: `${intMaxNGS - stability} days remaining`, class: (intMaxNGS - stability) > 20 ? "good" : (intMaxNGS - stability) > 10 ? "warning" : "critical" };
				} else {
					data.stability.internal = { text: "Out of Lab Stability", class: "expired" };
				}

				// Reference
				const refMaxNGS = 90;//Reference Stablity Threshold
				if (stability < refMaxNGS) {
					data.stability.reference = { text: `${refMaxNGS - stability} days remaining`, class: (refMaxNGS - stability) > 30 ? "good" : (refMaxNGS - stability) > 10 ? "warning" : "critical" };
				} else {
					data.stability.reference = { text: "Out of Lab Stability", class: "expired" };
				}

				// Recommendation
				data.stability.recommendation = (stability <= intMaxNGS && testType !== "CGX")
					? { text: "Test Internally", class: "good" }
					: stability < refMaxNGS
						? { text: "Send to Reference Lab", class: "warning" }
						: { text: "Discard", class: "expired" };
			}

			if (["UTI", "WOUND"].includes(testType) && stability <= 4) {
				const intMaxPGX = 4;//Internal Stablity Threshold
				data.stability.internal = (stability <= intMaxPGX)
					? { text: `${intMaxPGX - stability} days remaining`, class: (4 - stability) > 2 ? "good" : (intMaxPGX - stability) > 1 ? "warning" : "critical" }
					: { text: "Out of Lab Stability", class: "expired" };

				data.stability.reference = { text: "Internal Only", class: "neutral" };
				data.stability.recommendation = (stability <= intMaxPGX)
					? { text: "Test Internally", class: "good" }
					: { text: "Discard", class: "expired" };
			}
		}

		delete data.pageContext;
	} catch (e) {
		console.log("UpdateAccession error", e);
	}
	console.log("UpdateAccession data", data);
}