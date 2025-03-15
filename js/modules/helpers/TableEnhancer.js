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
		this.headerCellSelector = ".dxgvHeader_Metropolis";
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
		// Locate the header row using the provided headerSelector.
		const headerRow = document.querySelector(this.headerSelector);
		if (!headerRow) {
			Logger.warn("TableEnhancer: Header row not found", "", { selector: this.headerSelector });
			return;
		}

		const headerCells = Array.from(headerRow.querySelectorAll(this.headerCellSelector));

		const normalizedHeaders = headerCells.map(cell => this.sanitizeHeader(cell.textContent.trim()));
		Logger.log("TableEnhancer: Extracted & normalizedHeaders headers", "", { headers: normalizedHeaders });

		const rows = document.querySelectorAll(this.rowSelector);
		rows.forEach(row => {
			const cells = Array.from(row.children);
			cells.forEach((cell, index) => {
				if (normalizedHeaders[index]) {
					cell.classList.add(normalizedHeaders[index]);
					if (this.config[normalizedHeaders[index]]) {
						try {
							this.config[normalizedHeaders[index]].fn(cell);
						} catch (error) {
							Logger.error(`TableEnhancer: Error applying override for header "${originalHeaders[index]}"`, "", { error });
						}
					}
				}
			});
		});

	headerCells.forEach((cell, index) => {
		const normalizedHeader = normalizedHeaders[index];
		if (this.config[normalizedHeader] && this.config[normalizedHeader].name) {
			cell.textContent = this.config[normalizedHeader].name;
		}
	});
	Logger.log("TableEnhancer: Headers renamed based on config.");
}
	
	/**
	 * Starts observing the document body using DOMObserver.
	 * When mutations occur, debounces and then processes the table.
	 */
	startObserver() {
		DOMObserver.observe(document.body, { childList: true, subtree: true }, (mutations) => {
			for (const mutation of mutations) { 
				if(mutation.target.id == "MainContent_ctl00_updatePanel1") {
					Array.from(mutation.addedNodes).forEach((node)=> {
						if (node.nodeType === Node.ELEMENT_NODE && node.matches) {
							if (node.matches("table#MainContent_ctl00_grid.dxgvControl_Metropolis.dxgrid-table.dxgv")) {
								this.processTable();
								return;
							}
						}
					});
				}
				if(mutation.target.nodeName == "TD" && mutation.target.id == "") {
					console.log("addedNodes",mutation.addedNodes);
					Array.from(mutation.addedNodes).forEach((node)=> {
						if (node.nodeType === Node.ELEMENT_NODE && node.matches) {
							if (node.matches("table#MainContent_ctl00_grid_DXMainTable.dxgvTable_Metropolis.dxgvRBB")) {
								this.processTable();
								return;
							}
						}
					});
				}
			}
		});
		this.processTable();
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
