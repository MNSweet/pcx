class Settings {
	static storageKey = "pcx_settings";

	static PERMISSION_STRUCTURE = {
		"SOP": {
			"New Accession Workflow": {
				description: "Controls new accession workflow behavior",
				priority: 10
			},
			"REQ Filename to Clipboard on Scan": {
				description: "Generate a REQ filename based on the SOP when printing labels to scan with.",
				priority: 10
			},
			"Patient Referrence Lab Transfer": {
				description: "Itemizes Patient data to transfer to referrence lab. Data is auto purged by timeout & successful transfer",
				priority: 10
			}
		},
		"Interface": {
			"Hide Signatures": {
				description: "Hides the signature section",
				priority: 10
			},
			"Enabled FileDrop": {
				description: "Enables full screen file drag-and-drop",
				priority: 10
			},
			"Show Stablity Notice": {
				description: "Displays number of dates since Collection Date with color coded ranges",
				priority: 10
			},
			"Accession List Enhanced Columns": {
				description: "Adds a quicklink via Alt 1 for Results",
				priority: 10
			},
			"Reports Enhanced Columns": {
				description: "Adds a quicklink via Alt 1 for Accessions",
				priority: 10
			},
			"Loation List Enhanced Columns": {
				description: "Adds a quicklink via Alt 1 for Delivery Method (Fax)",
				priority: 10
			}
		},
	};

	static async get() {
		return await DataHandler.get("chrome", Settings.storageKey);
	}

	static async save(category, key, value) {
		let settings = await Settings.get() || {};

		if (!settings[category]) {
			settings[category] = {};
		}

		settings[category][key] = value;

		await DataHandler.set("chrome", Settings.storageKey, settings);
	}

	static async check(category, key, callback) {
		let settings = await Settings.get() || {};

		if (!settings[category]) {
			settings[category] = {};
		}

		// Ensure the permission exists with defaults
		if (settings[category][key] === undefined) {
			settings[category][key] = false;
			await Settings.save(category, key, false);
		}

		let result = settings[category][key];

		// Fetch permission metadata
		let metadata = Settings.PERMISSION_STRUCTURE[category]?.[key] || { description: "", priority: 10 };

		return callback ? callback(result, metadata) : result;
	}
}