// /js/modules/helpers/DataHandler.js
Logger.log("DataHandler Loaded","INIT");

class DataHandler {
	static IndexDB = "pxc";
	static AccessionTable = "Accessions";
	static LookupTables = [
		"FirstName", "LastName", "TestCategory",
		"PerformingLab", "Code", "CollectionDate", "Received"
	];

	// Generic get method to retrieve data from various storage types
	static async get(storageType, key, preset = "", table = null) {
		switch (storageType) {
			case "chrome":
				return (await DataHandler.getFromChromeStorage(key)) ?? preset;
			case "session":
				return (await DataHandler.getFromChromeSession(key)) ?? preset;
			case "local":
				return (await DataHandler.getFromLocalStorage(key)) ?? preset;
			case "indexedDB":
				return (await DataHandler.getFromIndexedDB(key, table)) ?? preset;
			default:
				throw new Error("Invalid storage type");
		}
	}

	// Generic set method to store data in various storage types
	static async set(storageType, key, value, table = null) {
		switch (storageType) {
			case "chrome":
				return await DataHandler.saveToChromeStorage(key, value);
			case "session":
				return await DataHandler.saveToChromeSession(key, value);
			case "local":
				return await DataHandler.saveToLocalStorage(key, value);
			case "indexedDB":
				return await DataHandler.saveToIndexedDB(key, value, table);
			default:
				throw new Error("Invalid storage type");
		}
	}

	// Generic delete method for various storage types
	static async remove(storageType, key, table = null) {
		switch (storageType) {
			case "chrome":
				return await DataHandler.removeFromChromeStorage(key);
			case "session":
				return await DataHandler.removeFromChromeSession(key);
			case "local":
				return await DataHandler.removeFromLocalStorage(key);
			case "indexedDB":
				return await DataHandler.removeFromIndexedDB(key, table);
			default:
				throw new Error("Invalid storage type");
		}
	}

	// Chrome Storage Operations
	static async getFromChromeSession(key) {
		return new Promise((resolve) => {
			chrome.storage.session.get([key], (result) => {
				resolve(result[key] || null);
			});
		});
	}

	static async saveToChromeSession(key, value) {
		return new Promise((resolve) => {
			chrome.storage.session.set({ [key]: value }, () => {
				resolve();
			});
		});
	}

	static async removeFromChromeSession(key) {
		return new Promise((resolve) => {
			chrome.storage.session.remove([key], () => {
				resolve();
			});
		});
	}

	static async clearChromeSession() {
		return new Promise((resolve) => {
			chrome.storage.session.clear(() => resolve());
		});
	}

	// Chrome Storage Operations
	static async getFromChromeStorage(key) {
		return new Promise((resolve) => {
			chrome.storage.local.get([key], (result) => {
				resolve(result[key] || null);
			});
		});
	}

	static async saveToChromeStorage(key, value) {
		return new Promise((resolve) => {
			chrome.storage.local.set({ [key]: value }, () => {
				resolve();
			});
		});
	}

	static async removeFromChromeStorage(key) {
		return new Promise((resolve) => {
			chrome.storage.local.remove([key], () => {
				resolve();
			});
		});
	}

	static async clearChromeStorage() {
		return new Promise((resolve) => {
			chrome.storage.local.clear(() => resolve());
		});
	}

	// Local Storage Operations
	static async getFromLocalStorage(key) {
		try {
			return JSON.parse(localStorage.getItem(key)) || null;
		} catch (error) {
			return null;
		}
	}

	static async saveToLocalStorage(key, value) {
		localStorage.setItem(key, JSON.stringify(value));
	}

	static async removeFromLocalStorage(key) {
		localStorage.removeItem(key);
	}

	static async clearLocalStorage() {
		localStorage.clear();
	}

	// IndexedDB Operations
	static async openIndexedDB(dbName = DataHandler.IndexDB, table = DataHandler.AccessionTable) {
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(dbName);

			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				if (!db.objectStoreNames.contains(table)) {
					db.createObjectStore(table, { keyPath: "Accession" });
				}
				DataHandler.LookupTables.forEach(lookupTable => {
					if (!db.objectStoreNames.contains(lookupTable)) {
						db.createObjectStore(lookupTable);
					}
				});
			};

			request.onerror = () => reject("IndexedDB error");
			request.onsuccess = () => resolve(request.result);
		});
	}

	// Retrieve data from IndexedDB
	static async getFromIndexedDB(key, table = DataHandler.AccessionTable, dbName = DataHandler.IndexDB) {
		const db = await DataHandler.openIndexedDB(dbName, table);
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(table, "readonly");
			const store = transaction.objectStore(table);
			const request = store.get(key);

			request.onsuccess = () => resolve(request.result || null);
			request.onerror = () => reject("Error retrieving record from IndexedDB");
		});
	}

	// Save data to IndexedDB
	static async saveToIndexedDB(key, value, table = DataHandler.AccessionTable, dbName = DataHandler.IndexDB) {
		const db = await DataHandler.openIndexedDB(dbName, table);
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(table, "readwrite");
			const store = transaction.objectStore(table);
			const request = store.put({ ...value, Accession: key });

			request.onsuccess = () => resolve();
			request.onerror = () => reject("Error saving record to IndexedDB");
		});
	}

	static async removeFromIndexedDB(key, table = DataHandler.AccessionTable, dbName = DataHandler.IndexDB) {
		const db = await DataHandler.openIndexedDB(dbName, table);
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(table, "readwrite");
			const store = transaction.objectStore(table);
			const request = store.delete(key);

			request.onsuccess = () => resolve();
			request.onerror = () => reject(`Error deleting record ${key} from IndexedDB`);
		});
	}

	static async saveAccession(record) {
		await DataHandler.saveToIndexedDB(record.Accession, record, DataHandler.AccessionTable);
		await DataHandler.updateLookupTables(record);
	}

	static async updateLookupTables(record) {
		for (const field of DataHandler.LookupTables) {
			const value = record[field];
			if (!value) continue;
			const key = value[0].toLowerCase(); // Grab first letter of string
			const lookupData = await DataHandler.get("indexedDB", key, field) || {};
			if (!lookupData[value]) {
				lookupData[value] = [];
			}
			lookupData[value].push(record.Accession);
			await DataHandler.set("indexedDB", key, lookupData, field);
		}
	}

	static async findRecords(fieldTable, value) {
		if (!value || typeof value !== "string" || value.length === 0) {
			return [];
		}

		const key = value[0].toLowerCase(); // Grab first letter of string
		const lookupData = await DataHandler.getFromIndexedDB(key, fieldTable) ?? {};

		if (lookupData[value]) {
			return await Promise.all(lookupData[value].map(id => DataHandler.getFromIndexedDB(id, DataHandler.AccessionTable)));
		}
		return [];
	}

	static async rebuildLookupTables() {
		const db = await DataHandler.openIndexedDB();
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(DataHandler.AccessionTable, "readonly");
			const store = transaction.objectStore(DataHandler.AccessionTable);
			const request = store.getAll();

			request.onsuccess = async () => {
				const accessions = request.result;
				for (const record of accessions) {
					await DataHandler.updateLookupTables(record);
				}
				resolve();
			};
			request.onerror = () => reject("Error rebuilding lookup tables");
		});
	}

	static async clearIndexedDB(table = DataHandler.AccessionTable, dbName = DataHandler.IndexDB) {
		const db = await DataHandler.openIndexedDB(dbName, table);
		return new Promise((resolve, reject) => {
			const transaction = db.transaction(table, "readwrite");
			const store = transaction.objectStore(table);
			const request = store.clear();

			request.onsuccess = () => resolve();
			request.onerror = () => reject(`Error clearing table ${table} from IndexedDB`);
		});
	}


	// Transfer Patient Data
	static async getPatientData() {
		return await DataHandler.get("chrome", "patientData", null);
	}

	static async savePatientData(data) {
		return await DataHandler.set("chrome", "patientData", data);
	}

	static async removePatientData() {
		return await DataHandler.remove("chrome", "patientData");
	}

}