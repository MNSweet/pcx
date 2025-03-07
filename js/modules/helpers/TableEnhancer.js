// /js/modules/helpers/TableEnhancer.js
Logger.log("TableEnhancer loaded","INIT");
class TableEnhancer {
	/**
	 * @param {string} headerSelector - CSS selector for the header row.
	 * @param {string} rowSelector - CSS selector for the data rows.
	 * @param {Object} config - Optional mapping of header names to cell-modification functions.
	 * Example: { "Alt ID 1": (cell) => { cell.innerHTML = `<a href="/?LinkId=2071&AccessionId=${value}" target="_blank">Results</a>`; } }
	 */
	constructor(headerSelector, rowSelector, config = {}) {
		this.headerSelector = headerSelector;
		this.rowSelector = rowSelector;
		this.config = config;
		this.debounceTimeout = null;
	}
	
	/**
	 * Converts header text into a CSS-friendly class name.
	 * @param {string} header 
	 * @returns {string}
	 */
	sanitizeHeader(header) {
		return header.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
	}
	
	/**
	 * Processes the table:
	 *  - Extracts headers from the header row.
	 *  - Iterates over each data row and adds a CSS class to each cell based on its header.
	 *  - Optionally invokes an override function if specified in the config.
	 */
	processTable() {
		const headerRow = document.querySelector(this.headerSelector);
		if (!headerRow) {
			Logger.warn("TableEnhancer: Header row not found", "", { selector: this.headerSelector });
			return;
		}
		const headerCells = Array.from(headerRow.querySelectorAll("th, td"));
		const headers = headerCells.map(cell => cell.textContent.trim());
		Logger.log("TableEnhancer: Extracted headers","", { headers });
		
		const rows = document.querySelectorAll(this.rowSelector);
		rows.forEach(row => {
			const cells = Array.from(row.children);
			cells.forEach((cell, index) => {
				if (headers[index]) {
					const headerClass = this.sanitizeHeader(headers[index]);
					cell.classList.add(headerClass);
					if (this.config[headers[index]]) {
						try {
							this.config[headers[index]](cell);
						} catch (error) {
							Logger.error(`TableEnhancer: Error applying override for header "${headers[index]}"`, "",{ error });
						}
					}
				}
			});
		});
	}
	
	/**
	 * Starts observing the document body using DOMObserver.
	 * When mutations occur, debounces and then processes the table.
	 */
	startObserver() {
		DOMObserver.observe(document.body, { childList: true, subtree: true }, (mutations) => {
			// Debounce processing to avoid rapid reprocessing.
			clearTimeout(this.debounceTimeout);
			this.debounceTimeout = setTimeout(() => {
				this.processTable();
			}, 300);
		});
		Logger.log("TableEnhancer: DOMObserver started on body.");
	}
	
	/**
	 * Stops the observer that was watching the document body.
	 * Uses DOMObserver.removeObserver() to disconnect only our observer.
	 */
	stopObserver() {
		DOMObserver.removeObserver(document.body, { childList: true, subtree: true });
		Logger.log("TableEnhancer: DOM observer on body removed.");
	}
}
