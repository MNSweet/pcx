class Settings {
	static storageKey = "pcx_settings";

	static PERMISSION_STRUCTURE;
	static cache;
	static saveQueue = Promise.resolve();

	static async get() {
		if (!Settings.cache) {
			Settings.cache = await DataHandler.get("chrome", Settings.storageKey);
		}
		if (!Settings.PERMISSION_STRUCTURE) {
			Settings.PERMISSION_STRUCTURE = await DataHandler.get("chrome", "pcx_permissions");
		}
		return Settings.cache;
	}

	static async save(category, key, value) {
		Settings.saveQueue = Settings.saveQueue.then(async () => {
			let settings = await Settings.get();
			if (!settings[category]) {
				settings[category] = {};
			}
			settings[category][key] = value;

			// Update the cache before saving
			Settings.cache = settings;
			return DataHandler.set("chrome", Settings.storageKey, settings);
		});
		return Settings.saveQueue;
	}

	static async check(category, key, callback) {
		let settings = await Settings.get();

		if (!settings[category]) {
			settings[category] = {};
		}

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