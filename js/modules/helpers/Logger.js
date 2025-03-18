// /js/modules/helpers/Logger.js
console.log("Logger Active");
/**
 *
 * Usage:
 *  - Enable logging via URL parameter debug=true or via Logger.init({ enabled: true }).
 *  - Call Logger.registerStructure() when a new class or function is defined.
 *  - Call Logger.capture() at strategic capture points (e.g., on user actions).
 *  - Wrap functions with Logger.trackFunction() to log their first call and subsequent calls.
 *  - DevLog UI provides a Console tab (for logs), a Tracer tab (for function calls), and two placeholder tabs.
 *
 */
class Logger {
	// Core properties
	static enabled = false;
	static outputBrowserConsole = null; // Optional DOM element for on-screen logging (legacy)
	static logs = []; // All log entries

	// Hybrid logging: structure and state captures
	static structureTree = [];
	static stateCaptures = [];

	// DevLog UI and function tracking
	static devLogContainer = null;
	static devLogHandle = null;
	static devLogTabs = {};
	static activeTab = 'console';
	static functionCalls = {};


	static scriptCategories = {
		background:					"SW",
		SidePanel: 					"SW",
		SWMessageRouter:			"SW",
		SWLogger:					"SW",

		LabPL:						"CMS",
		LabPD:						"CMS",
		LabRR:						"CMS",
		IATSERV:					"CMS",
		DXRESULTS:					"CMS",
		LIMS:						"CMS",
		KeyBinding:					"CMS",
		TableEnhancer: 				"CMS",

		PCX: 						"Perms",
		permissions:				"Perms",
		Settings:					"Perms",

		AsyncHelpers:				"DOM",
		DOMHelper:					"DOM",
		DOMObserver:				"DOM",
		"marked.min":				"DOM",
		Utils:						"DOM",

		Logger:						"QA",
		QAManager:					"QA",

		MessageRouter:				"Comms",
		Data:						"Comms",
		TransferNoticeController:	"Comms",
		DestinationFormFiller:		"Comms",
		PatientDataCapture:			"Comms",
		DataMapping:				"Comms"
	};

	/**
	 * Initialize the Logger.
	 * @param {Object} config - Optional configuration.
	 *   {boolean} config.enabled - Override for enabling logging.
	 */
	static init(config) {
		config = config || {};
		let params = new URLSearchParams(window.location.search);
		Logger.enabled = true;//(params.get('debug') === 'true') || config.enabled || false;
		Logger.outputBrowserConsole = (params.get('console') === 'true') || config.outputBrowserConsole || false;
		if (Logger.enabled) {
			Logger.createDevLog();
		}
	}

	/**
	 * Parses the current error stack to extract caller info.
	 * Note: The stack trace format is browser-dependent.
	 * @returns {string} Caller info (file, line, column) or an empty string.
	 */
	static getCallerInfo() {
		try {
			let err = new Error();
			if (!err.stack) { return ''; }
			let stackLines = err.stack.split('\n');
			// Typically:
			// stackLines[0] is "Error"
			// stackLines[1] is getCallerInfo
			// stackLines[2] is the Logger method (log, warn, error)
			// stackLines[3] is the caller we want to capture
			if (stackLines.length > 1) {
				return stackLines[stackLines.length - 1].trim().match(/(?:at\s+)?(?:[a-zA-Z-]+:\/\/[^/]+)(\/[^)]*)(?:\))?$/)[1];
			}
			return '';
		} catch (error) {
			return '';
		}
	}

	/**
	 * Extracts the file name from a given file path and returns its category.
	 * The file path should follow the format: "/path/to/FileName.extension:line:column".
	 * This method splits the input to remove the path, extension, and line/column info,
	 * leaving only the file name for lookup in Logger.scriptCategories.
	 *
	 * @param {string} filePath - The complete file path to process.
	 * @returns {string|null} The category corresponding to the file name if found; otherwise, "General".
	 */
	static getFileCategory(filePath) {
		return Logger.scriptCategories[
			(
				(
					filePath.split('/').pop()
				).split(':')[0]
			).split('.')[0]
		] || "General";
	}

	/**
	 * Creates a standardized log entry.
	 * @param {string} type - Log type ('log', 'warn', 'error', 'structure', 'capture').
	 * @param {string} message - The primary message.
	 * @param {any} context - Optional additional data.
	 * @returns {Object} The log entry.
	 */
	static createEntry(type, message, context, args) {
		return {
			type: type,
			timestamp: new Date(),
			message: message,
			context: context,
			args: args,
			caller: Logger.getCallerInfo()
		};
	}

	/**
	 * Outputs the log entry to the console and, if applicable, to the DevLog UI.
	 * @param {Object} entry - The log entry.
	 */
	static output(entry) {
		// Save the log entry
		Logger.logs.push(entry);
		// Optionally output to browser console
		if (Logger.outputBrowserConsole) {
			switch (entry.type) {
				case 'warn': console.warn(entry); break;
				case 'error': console.error(entry); break;
				default: console.log(entry);
			}
		}
		
		// Determine the target tab based on the log entry type.
		// "console" covers 'log', 'warn', 'error', 'structure', and 'capture'
		// "tracer" covers entries created via trackFunction() (type 'tracer')
		// "messaging" covers entries with type 'message'
		// "file" covers entries with type 'file'
		let targetTab = 'console';
		if (['tracer'].includes(entry.type)) {
			targetTab = 'tracer';
		} else if (['messaging'].includes(entry.type)) {
			targetTab = 'messaging';
		} else if (['file'].includes(entry.type)) {
			targetTab = 'file';
		}
		
		// Define the table headings and column classes for each tab.
		let headings = [];
		let colClasses = [];
		switch(targetTab) {
			case 'console':
				headings = ['Date', 'Type', 'Message/Args', 'Location'];
				colClasses = ['colDate', 'colType', 'colMsg', 'colLoc'];
				break;
			case 'tracer':
				headings = ['Data', 'Event', 'Count', 'Location'];
				colClasses = ['colDate', 'colEvent', 'colCount', 'colLoc'];
				break;
			case 'messaging':
				// Reuse the console layout for messaging (or change as desired)
				headings = ['Date', 'Direction', 'Message', 'Location'];
				colClasses = ['colDate', 'colDir', 'colMsg', 'colLoc'];
				break;
			case 'file':
				// Reuse the console layout for file events (or define a custom one)
				headings = ['Date', 'Name', 'Location'];
				colClasses = ['colDate', 'colName', 'colLoc'];
				break;
			default:
				headings = ['Date', 'Type', 'Message/Args', 'Location'];
				colClasses = ['colDate', 'colType', 'colMsg', 'colLoc'];
		}
		
		// Get the target tab container.
		let targetContainer = Logger.devLogTabs[targetTab];
		
		// Check if a table already exists; if not, create one.
		let table = targetContainer.querySelector('table');
		if (!table) {
			table = Logger.createLogDOM('table', { id: `debug-table-${targetTab}` });
			// Create a colgroup with the appropriate column classes.
			let colgroup = Logger.createLogDOM('colgroup');
			colClasses.forEach(cls => {
				let col = Logger.createLogDOM('col', { className: cls });
				colgroup.appendChild(col);
			});
			table.appendChild(colgroup);
			// Create the table header (thead)
			let thead = Logger.createLogDOM('thead');
			let headerRow = Logger.createLogDOM('tr');
			headings.forEach((heading, index) => {
				let th = Logger.createLogDOM('th', { textContent: heading, className: colClasses[index] });
				headerRow.appendChild(th);
			});
			thead.appendChild(headerRow);
			table.appendChild(thead);
			// Create a tbody for log entries.
			let tbody = Logger.createLogDOM('tbody');
			table.appendChild(tbody);
			targetContainer.appendChild(table);
		}
		
		// Append a new row for the log entry.
		let tbody = table.querySelector('tbody');
		let row = Logger.createLogDOM('tr');
		let count = tbody.children.length;
		// Alternate row background color
		row.style.background = (count % 2 === 0 ? '#fff' : '#f9f9f9');
		

		colClasses.forEach(cls => {
			let cell = Logger.createLogDOM('td');
			
			switch(cls) {
				case 'colDate':
					Logger.applyLogAttributes(cell, {
						className: 'colDate',
						textContent: entry.timestamp.toLocaleString()
					});
				break;

				case 'colType':
					let typeList = [entry.type.toUpperCase(),Logger.getFileCategory(entry.caller),entry.context];
					row.dataset.types = typeList.join(",")

					Logger.applyLogAttributes(cell, {
						className: 'colType',
						innerHTML: '[' + typeList.join(']<br/>[') + "]"
					});
				break;

				case 'colMsg':
				case 'colName':
					let msgText = entry.message;
					if (entry.args) {
						entry.args.forEach(arg => {
							msgText += `<br/><pre>${JSON.stringify(arg,null,"\t")}</pre>`;
						});
					}
					Logger.applyLogAttributes(cell, {
						className: 'colMsg',
						innerHTML: msgText
					});
				break;

				case 'colLoc':
					Logger.applyLogAttributes(cell, {
						className: 'colLoc',
						textContent: entry.caller
					});
				break;

				case 'colEvent':
					Logger.applyLogAttributes(cell, {
						textContent: ""
					});
				break;

				case 'colCount':
					Logger.applyLogAttributes(cell, {
						textContent: ""
					});
				break;

				case 'colDir':
					Logger.applyLogAttributes(cell, {
						textContent: entry.context
					});
				break;

				default:
					Logger.applyLogAttributes(cell, {
						textContent: ""
					});
				break;
			}
			row.appendChild(cell);
		});
		
		tbody.appendChild(row);
	}

	/**
	 * Log if a file is loaded to the File tab.
	 * @param {string} message - The message.
	 * @param {any} context - Optional context.
	 */
	static file(message, ...args) {
		if (!Logger.enabled) { return; }
		let entry = Logger.createEntry('file', message, '', args);
		Logger.output(entry);
	}

	/**
	 * Log intercontext messaging events.
	 * This logs a message with type "message" that will be output in the Messaging tab.
	 * @param {string} message - The message.
	 * @param {any} direction - Sent / Received / Added / Deleted.
	 */
	static messageLog(message, direction, ...args) {
		if (!Logger.enabled) { return; }
		let entry = Logger.createEntry('messaging', message, direction, args);
		Logger.output(entry);
	}

	/**
	 * Logs a normal message.
	 * @param {string} message - The message.
	 * @param {any} context - Optional additional data.
	 */
	static log(message, context, ...args) {
		if (!Logger.enabled) { return; }
		let entry = Logger.createEntry('log', message, context, args);
		Logger.output(entry);
	}

	/**
	 * Logs a warning message.
	 * @param {string} message - The message.
	 * @param {any} context - Optional additional data.
	 */
	static warn(message, context, ...args) {
		if (!Logger.enabled) { return; }
		let entry = Logger.createEntry('warn', message, context, args);
		Logger.output(entry);
	}

	/**
	 * Logs an error message.
	 * @param {string} message - The message.
	 * @param {any} context - Optional additional data.
	 */
	static error(message, context, ...args) {
		if (!Logger.enabled) { return; }
		let entry = Logger.createEntry('error', message, context, args);
		Logger.output(entry);
	}

	/**
	 * Register a structural event (e.g., class or function definition).
	 * Builds the "family tree" of your code.
	 * @param {string} label - Description of the structural event.
	 * @param {any} data - Optional metadata.
	 */
	static registerStructure(label, data) {
		if (!Logger.enabled) { return; }
		let entry = {
			type: 'structure',
			label: label,
			data: data || null,
			timestamp: new Date(),
			caller: Logger.getCallerInfo()
		};
		Logger.structureTree.push(entry);
		Logger.output(entry);
	}

	/**
	 * Capture the state at a specific point.
	 * @param {string} pointLabel - Label for the capture point.
	 * @param {any} stateData - The state data to capture.
	 */
	static capture(pointLabel, stateData) {
		if (!Logger.enabled) { return; }
		let entry = {
			type: 'capture',
			pointLabel: pointLabel,
			stateData: stateData,
			timestamp: new Date(),
			caller: Logger.getCallerInfo()
		};
		Logger.stateCaptures.push(entry);
		Logger.output(entry);
	}

	/**
	 * Wraps a function to track its calls.
	 * On the first call, registers a structural event.
	 * @param {Function} fn - The function to track.
	 * @param {string} name - A name to identify the function.
	 * @returns {Function} The wrapped function.
	 */
	static trackFunction(fn, name) {
		name = name || (fn.name || 'anonymous');
		if (!Logger.functionCalls[name]) {
			Logger.functionCalls[name] = 0;
		}
		let self = this;
		let firstCall = true;
		return function() {
			self.functionCalls[name]++;
			if (firstCall) {
				self.registerStructure('Function ' + name + ' first call', { args: Array.prototype.slice.call(arguments) });
				firstCall = false;
			}
			// Log each call in the Tracer tab as a table row
			if (self.devLogTabs.tracer) {
				// Create tracer table if it doesn't exist
				if (!self.devLogTabs.tracer.querySelector('table')) {
					let table = Logger.createLogDOM('table',{
						style:{
							width:'100%',
							borderCollapse:'collapse'
						}
					});
					// Create thead with sticky header
					let headerRow = document.createElement('tr');
					['Data', 'Event', 'Count', 'Location'].forEach(function(col) {
						headerRow.appendChild(
						    Logger.createLogDOM(
								'th',
								{
									textContent: col,
									style: {
										textAlign: 'left',
										padding: '4px',
										background: '#fff',
										position: 'sticky',
										top: '0',
										borderBottom: '1px solid #ccc',
										zIndex: '1'
									}
								}
							)
						);
					});
					table.appendChild(
						document.createElement('thead').appendChild(headerRow)
					);
					// Create tbody for tracer entries
					let tbody = document.createElement('tbody');
					table.appendChild(tbody);
					self.devLogTabs.tracer.appendChild(table);
				}
				let table = self.devLogTabs.tracer.querySelector('table');
				let tbody = table.querySelector('tbody');
				let row = document.createElement('tr');
				let count = tbody.children.length;
				row.style.background = (count % 2 === 0 ? '#fff' : '#f9f9f9');

				// Data cell (timestamp)
				let dataCell = document.createElement('td');
				dataCell.style.padding = '4px';
				dataCell.textContent = '[' + new Date().toISOString() + ']';

				// Event cell (function call description)
				let eventCell = document.createElement('td');
				eventCell.style.padding = '4px';
				eventCell.textContent = 'Called "' + name + '"';

				// Count cell (number of calls)
				let countCell = document.createElement('td');
				countCell.style.padding = '4px';
				countCell.textContent = self.functionCalls[name];

				// Location cell (caller info)
				let locCell = document.createElement('td');
				locCell.style.padding = '4px';
				locCell.textContent = self.getCallerInfo();

				row.appendChild(dataCell);
				row.appendChild(eventCell);
				row.appendChild(countCell);
				row.appendChild(locCell);
				tbody.appendChild(row);
			}
			return fn.apply(this, arguments);
		};
	}

	/**
	 * Clears all stored logs and clears the on-screen outputs.
	 */
	static clearLogs() {
		Logger.logs = [];
		if (Logger.devLogTabs.console) {
			Logger.devLogTabs.console.innerHTML = '';
		}
	}

	/**
	 * Creates the DevLog UI.
	 * The DevLog is fixed to the bottom of the page and collapsed by default,
	 * with a small handle in the bottom-right.
	 */
	static createDevLog() {
		Logger.devLogContainer = Logger.createLogDOM('div',
		{
			id: 'devlog-container',
			style: {
				display: 'none'
			}
		});

		// Create tab navigation container.
		let tabNav = Logger.createLogDOM('div', { id: 'devlog-tab-nav' });
		// Create content container.
		let tabContent = Logger.createLogDOM('div', { id: 'devlog-tab-content' });

		// Define tabs
		let tabs = [
			{ name: 'console', label: 'Console' },
			{ name: 'tracer', label: 'Tracer' },
			{ name: 'messaging', label: 'Messaging' },
			{ name: 'file', label: 'Files' }//,
			//{ name: 'tab3', label: 'Tab 3' },
			//{ name: 'tab4', label: 'Tab 4' }
		];

		let self = this;
		// Create each tab button and content pane
		tabs.forEach(function(tab) {
			// Tab button
			let tabButton = Logger.createLogDOM('div',{
				textContent: tab.label,
				className: 'devlog-tab-button', 
				dataset: {
					tab: tab.name
				}
			});
			tabButton.addEventListener('click', function() {
				self.activeTab = tab.name;
				// Update tab nav buttons styling
				Array.prototype.forEach.call(tabNav.children, function(child) {
					child.style.background = (child.getAttribute('data-tab') === self.activeTab ? '#e0e0e0' : 'transparent');
				});
				// Show/hide content panes
				Object.keys(self.devLogTabs).forEach(function(key) {
					self.devLogTabs[key].style.display = (key === self.activeTab ? 'block' : 'none');
				});
			});
			tabNav.appendChild(tabButton);

			// Content pane
			let pane = Logger.createLogDOM('div', {
				className: 'devlog-tab-pane',
				style: {
					display: (tab.name === self.activeTab ? 'block' : 'none')
				}
			});
			self.devLogTabs[tab.name] = pane;
			tabContent.appendChild(pane);
		});

		Logger.devLogContainer.appendChild(tabNav);
		Logger.devLogContainer.appendChild(tabContent);
		document.body.appendChild(Logger.devLogContainer);

		// Create the toggle handle (always visible at the bottom-right)
		Logger.devLogHandle = Logger.createLogDOM('div', {
			id: 'devlog-handle',
			textContent: 'DevLog',
			style: {
				bottom: '0px'
			}
		});
		Logger.devLogHandle.addEventListener('click', function() {
			self.toggleDevLog();
		});
		document.body.appendChild(Logger.devLogHandle);
	}

	/**
	 * Toggles the DevLog container between collapsed and expanded states.
	 */
	static toggleDevLog() {
		if (!Logger.devLogContainer) { return; }
		Logger.devLogHandle.style.bottom		= (Logger.devLogContainer.style.display === 'none' ? '300px' : '0px');
		Logger.devLogContainer.style.display	= (Logger.devLogContainer.style.display === 'none' ? 'block' : 'none');
	}



	static createLogDOM(domType, properties = {}) {
		try {
			const element = document.createElement(domType);
			Logger.applyLogAttributes(element, properties);
			return element;
		} catch (error) {
			return null;
		}
	}
	static applyLogAttributes(element, attributes) {
		for (const key in attributes) {
			if (attributes.hasOwnProperty(key)) {
				if (typeof attributes[key] === 'object' && attributes[key] !== null) {
					// Recursive application for nested objects (like 'style')
					Logger.applyLogAttributes(element[key], attributes[key]);
				} else {
					// Direct attribute assignment
					element[key] = attributes[key];
				}
			}
		}
	}
};

// Automatically initialize if debug is enabled via URL, otherwise require manual init.
Logger.init();



class Icon {
	static Incoming	= "⎥«";
	static Outgoing	= "»⎢";
	static Error 	= "⎥!⎢";
	static Info 	= "⎥ℹ⎢";
	static Port 	= "⎥⊶⎢";
	static Listener = "⎥«⊶";
}

/*
	// Example usage:
	// Register structural events when classes or functions are defined.
	Logger.registerStructure('MyClass defined');
	function MyClass(value) {
		Logger.value = value;
	}
	MyClass.prototype.increment = function() {
		Logger.value++;
		return Logger.value;
	};
	Logger.registerStructure('MyClass.prototype.increment defined');

	// Capture state on a specific event (e.g., click)
	document.addEventListener('click', function() {
		let importantState = {
			someValue: window.someGlobalValue || null,
			anotherValue: window.anotherGlobalValue || null
		};
		Logger.capture('User click state capture', importantState);
	});

	// Wrap a function to track its calls
	function exampleFunction(a, b) {
		return a + b;
	}
	let trackedExampleFunction = Logger.trackFunction(exampleFunction, 'exampleFunction');
	console.log('Result:', trackedExampleFunction(2, 3));

	// Basic logs
	Logger.log('This is a log message.');
*/