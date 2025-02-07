class Settings {
	static storageKey = "pcx_settings";

	static async get() {
		return new Promise((resolve) => {
			chrome.storage.local.get([Settings.storageKey], (result) => {
				resolve(result[Settings.storageKey] || {});
			});
		});
	}

	static async save(settings) {
		return new Promise((resolve) => {
			chrome.storage.local.set({ [Settings.storageKey]: settings }, () => {
				resolve();
			});
		});
	}

	static async check(category, key, callback) {
		let settings = await Settings.getSettings();
		
		if (!settings[category]) {
			settings[category] = {};
		}
		
		if (settings[category][key] === undefined) {
			settings[category][key] = false; // Default to false
			await Settings.save(settings);
		}
		
		let result = settings[category][key];
		
		if (callback && typeof callback === "function") {
			return callback(result);
		}
		
		return result;
	}
}