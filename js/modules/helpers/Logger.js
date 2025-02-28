// /js/modules/helpers/Logger.js
console.log("/js/modules/helpers/Logger.js");
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
(function (root, factory) {
	if (typeof define === 'function' && define.amd) {
		define([], factory);
	} else if (typeof exports === 'object') {
		module.exports = factory();
	} else {
		root.Logger = factory();
	}
}(this, function () {
"use strict";
	var Logger = {
		// Core properties
		enabled: false,
		outputTarget: null, // Optional DOM element for on-screen logging (legacy)
		outputBrowserConsole: null, // Optional DOM element for on-screen logging (legacy)
		logs: [], // All log entries

		// Hybrid logging: structure and state captures
		structureTree: [],
		stateCaptures: [],

		// DevLog UI and function tracking
		devLogContainer: null,
		devLogHandle: null,
		devLogTabs: {},
		activeTab: 'console',
		functionCalls: {},

		/**
		 * Initialize the Logger.
		 * @param {Object} config - Optional configuration.
		 *   {boolean} config.enabled - Override for enabling logging.
		 *   {Element} config.outputTarget - A DOM element to display logs.
		 */
		init: function(config) {
			config = config || {};
			var params = new URLSearchParams(window.location.search);
			this.enabled = (params.get('debug') === 'true') || config.enabled || false;
			this.outputBrowserConsole = (params.get('console') === 'true') || config.outputBrowserConsole || false;
			if (config.outputTarget) {
				this.outputTarget = config.outputTarget;
			}
			if (this.enabled) {
				this.createDevLog();
			}
		},

		/**
		 * Parses the current error stack to extract caller info.
		 * Note: The stack trace format is browser-dependent.
		 * @returns {string} Caller info (file, line, column) or an empty string.
		 */
		getCallerInfo: function() {
			try {
				var err = new Error();
				if (!err.stack) { return ''; }
				var stackLines = err.stack.split('\n');
				// Typically:
				// stackLines[0] is "Error"
				// stackLines[1] is getCallerInfo
				// stackLines[2] is the Logger method (log, warn, error)
				// stackLines[3] is the caller we want to capture
				if (stackLines.length >= 4) {
					return stackLines[3].trim();
				} else if (stackLines.length >= 3) {
					return stackLines[2].trim();
				}
				return '';
			} catch (error) {
				return '';
			}
		},

		/**
		 * Creates a standardized log entry.
		 * @param {string} type - Log type ('log', 'warn', 'error', 'structure', 'capture').
		 * @param {string} message - The primary message.
		 * @param {any} context - Optional additional data.
		 * @returns {Object} The log entry.
		 */
		createEntry: function(type, message, context) {
			return {
				type: type,
				timestamp: new Date(),
				message: message,
				context: context,
				caller: this.getCallerInfo()
			};
		},

		/**
		 * Outputs the log entry to the console and, if applicable, to the DevLog UI.
		 * @param {Object} entry - The log entry.
		 */
		output: function(entry) {
			this.logs.push(entry);
			// Output to browser console
			if (this.outputBrowserConsole) {
				switch (entry.type) {
					case 'warn': console.warn(entry); break;
					case 'error': console.error(entry); break;
					default: console.log(entry);
				}
			}
			// Legacy on-screen logging if configured
			if (this.outputTarget) {
				var logEl = document.createElement('div');
				logEl.style.fontFamily = 'monospace';
				logEl.style.padding = '2px 4px';
				logEl.style.fontSize = '12px';
				var text = '[' + entry.timestamp.toISOString() + '] [' + entry.type.toUpperCase() + '] ' + entry.message + ' ' + entry.caller;
				if (entry.context) {
					text += ' | Context: ' + JSON.stringify(entry.context);
				}
				logEl.textContent = text;
				this.outputTarget.appendChild(logEl);
			}
			// Add to the DevLog UI Console tab as a table row
			if (this.devLogTabs.console && (entry.type === 'log' || entry.type === 'structure' || entry.type === 'capture')) {
				// Create the table if it doesn't exist yet
				if (!this.devLogTabs.console.querySelector('table')) {
					var table = document.createElement('table');
					table.style.width = '100%';
					table.style.borderCollapse = 'collapse';
					// Create thead with sticky header
					var thead = document.createElement('thead');
					var headerRow = document.createElement('tr');
					['Date', 'Type', 'Message/Args', 'Location'].forEach(function(col) {
						var th = document.createElement('th');
						th.textContent = col;
						th.style.textAlign = 'left';
						th.style.padding = '4px';
						th.style.background = '#fff';
						th.style.position = 'sticky';
						th.style.top = '0';
						th.style.borderBottom = '1px solid #ccc';
						th.style.zIndex = '1';
						headerRow.appendChild(th);
					});
					thead.appendChild(headerRow);
					table.appendChild(thead);
					// Create tbody for log entries
					var tbody = document.createElement('tbody');
					table.appendChild(tbody);
					this.devLogTabs.console.appendChild(table);
				}
				var table = this.devLogTabs.console.querySelector('table');
				var tbody = table.querySelector('tbody');
				var row = document.createElement('tr');
				// Calculate alternating row colors (excluding header)
				var count = tbody.children.length;
				row.style.background = (count % 2 === 0 ? '#fff' : '#f9f9f9');

				// Date cell
				var dateCell = document.createElement('td');
				dateCell.style.padding = '4px';
				dateCell.textContent = '[' + entry.timestamp.toISOString() + ']';

				// Type cell
				var typeCell = document.createElement('td');
				typeCell.style.padding = '4px';
				typeCell.textContent = '[' + entry.type.toUpperCase() + ']';

				// Message/Args cell
				var msgCell = document.createElement('td');
				msgCell.style.padding = '4px';
				var msgText = entry.message;
				if (entry.context) {
					msgText += ' | ' + JSON.stringify(entry.context);
				}
				msgCell.textContent = msgText;

				// Location cell
				var locCell = document.createElement('td');
				locCell.style.padding = '4px';
				locCell.textContent = entry.caller;

				row.appendChild(dateCell);
				row.appendChild(typeCell);
				row.appendChild(msgCell);
				row.appendChild(locCell);

				tbody.appendChild(row);
			}
		},


		/**
		 * Logs a normal message.
		 * @param {string} message - The message.
		 * @param {any} context - Optional additional data.
		 */
		log: function(message, context) {
			if (!this.enabled) { return; }
			var entry = this.createEntry('log', message, context);
			this.output(entry);
		},

		/**
		 * Logs a warning message.
		 * @param {string} message - The message.
		 * @param {any} context - Optional additional data.
		 */
		warn: function(message, context) {
			if (!this.enabled) { return; }
			var entry = this.createEntry('warn', message, context);
			this.output(entry);
		},

		/**
		 * Logs an error message.
		 * @param {string} message - The message.
		 * @param {any} context - Optional additional data.
		 */
		error: function(message, context) {
			if (!this.enabled) { return; }
			var entry = this.createEntry('error', message, context);
			this.output(entry);
		},

		/**
		 * Register a structural event (e.g., class or function definition).
		 * Builds the "family tree" of your code.
		 * @param {string} label - Description of the structural event.
		 * @param {any} data - Optional metadata.
		 */
		registerStructure: function(label, data) {
			if (!this.enabled) { return; }
			var entry = {
				type: 'structure',
				label: label,
				data: data || null,
				timestamp: new Date(),
				caller: this.getCallerInfo()
			};
			this.structureTree.push(entry);
			this.output(entry);
		},

		/**
		 * Capture the state at a specific point.
		 * @param {string} pointLabel - Label for the capture point.
		 * @param {any} stateData - The state data to capture.
		 */
		capture: function(pointLabel, stateData) {
			if (!this.enabled) { return; }
			var entry = {
				type: 'capture',
				pointLabel: pointLabel,
				stateData: stateData,
				timestamp: new Date(),
				caller: this.getCallerInfo()
			};
			this.stateCaptures.push(entry);
			this.output(entry);
		},

		/**
		 * Wraps a function to track its calls.
		 * On the first call, registers a structural event.
		 * @param {Function} fn - The function to track.
		 * @param {string} name - A name to identify the function.
		 * @returns {Function} The wrapped function.
		 */
		trackFunction: function(fn, name) {
			name = name || (fn.name || 'anonymous');
			if (!this.functionCalls[name]) {
				this.functionCalls[name] = 0;
			}
			var self = this;
			var firstCall = true;
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
						var table = document.createElement('table');
						table.style.width = '100%';
						table.style.borderCollapse = 'collapse';
						// Create thead with sticky header
						var thead = document.createElement('thead');
						var headerRow = document.createElement('tr');
						['Data', 'Event', 'Count', 'Location'].forEach(function(col) {
							var th = document.createElement('th');
							th.textContent = col;
							th.style.textAlign = 'left';
							th.style.padding = '4px';
							th.style.background = '#fff';
							th.style.position = 'sticky';
							th.style.top = '0';
							th.style.borderBottom = '1px solid #ccc';
							th.style.zIndex = '1';
							headerRow.appendChild(th);
						});
						thead.appendChild(headerRow);
						table.appendChild(thead);
						// Create tbody for tracer entries
						var tbody = document.createElement('tbody');
						table.appendChild(tbody);
						self.devLogTabs.tracer.appendChild(table);
					}
					var table = self.devLogTabs.tracer.querySelector('table');
					var tbody = table.querySelector('tbody');
					var row = document.createElement('tr');
					var count = tbody.children.length;
					row.style.background = (count % 2 === 0 ? '#fff' : '#f9f9f9');

					// Data cell (timestamp)
					var dataCell = document.createElement('td');
					dataCell.style.padding = '4px';
					dataCell.textContent = '[' + new Date().toISOString() + ']';

					// Event cell (function call description)
					var eventCell = document.createElement('td');
					eventCell.style.padding = '4px';
					eventCell.textContent = 'Called "' + name + '"';

					// Count cell (number of calls)
					var countCell = document.createElement('td');
					countCell.style.padding = '4px';
					countCell.textContent = self.functionCalls[name];

					// Location cell (caller info)
					var locCell = document.createElement('td');
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
		},

		/**
		 * Dynamically sets the legacy on-screen output target.
		 * @param {Element} target - A DOM element to display log messages.
		 */
		setOutputTarget: function(target) {
			this.outputTarget = target;
		},

		/**
		 * Clears all stored logs and clears the on-screen outputs.
		 */
		clearLogs: function() {
			this.logs = [];
			if (this.outputTarget) {
				this.outputTarget.innerHTML = '';
			}
			if (this.devLogTabs.console) {
				this.devLogTabs.console.innerHTML = '';
			}
		},

		/**
		 * Creates the DevLog UI.
		 * The DevLog is fixed to the bottom of the page and collapsed by default,
		 * with a small handle in the bottom-right.
		 */
		createDevLog: function() {
			// Create main container (initially hidden)
			this.devLogContainer = document.createElement('div');
			this.devLogContainer.style.position = 'fixed';
			this.devLogContainer.style.left = '0';
			this.devLogContainer.style.right = '0';
			this.devLogContainer.style.bottom = '0';
			this.devLogContainer.style.height = '300px';
			this.devLogContainer.style.background = '#fff';
			this.devLogContainer.style.borderTop = '1px solid #ccc';
			this.devLogContainer.style.boxShadow = '0 -2px 5px rgba(0,0,0,0.1)';
			this.devLogContainer.style.display = 'none'; // collapsed initially
			this.devLogContainer.style.zIndex = '9999';
			this.devLogContainer.style.fontFamily = 'sans-serif';
			this.devLogContainer.style.fontSize = '12px';

			// Create tab navigation container (left side)
			var tabNav = document.createElement('div');
			tabNav.style.width = '100px';
			tabNav.style.height = '100%';
			tabNav.style.float = 'left';
			tabNav.style.borderRight = '1px solid #ddd';
			tabNav.style.boxSizing = 'border-box';
			tabNav.style.background = '#f7f7f7';
			tabNav.style.overflowY = 'auto';

			// Create content container (right side)
			var tabContent = document.createElement('div');
			tabContent.style.marginLeft = '100px';
			tabContent.style.height = '100%';
			tabContent.style.overflowY = 'auto';
			tabContent.style.padding = '4px';

			// Define tabs
			var tabs = [
				{ name: 'console', label: 'Console' },
				{ name: 'tracer', label: 'Tracer' }//,
				//{ name: 'tab3', label: 'Tab 3' },
				//{ name: 'tab4', label: 'Tab 4' }
			];

			var self = this;
			// Create each tab button and content pane
			tabs.forEach(function(tab) {
				// Tab button
				var tabButton = document.createElement('div');
				tabButton.textContent = tab.label;
				tabButton.style.padding = '8px';
				tabButton.style.cursor = 'pointer';
				tabButton.style.borderBottom = '1px solid #ddd';
				tabButton.style.background = (tab.name === self.activeTab ? '#e0e0e0' : 'transparent');
				tabButton.setAttribute('data-tab', tab.name);
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
				var pane = document.createElement('div');
				pane.style.width = '100%';
				pane.style.height = '100%';
				pane.style.display = (tab.name === self.activeTab ? 'block' : 'none');
				pane.style.overflowY = 'auto';
				self.devLogTabs[tab.name] = pane;
				tabContent.appendChild(pane);
			});

			this.devLogContainer.appendChild(tabNav);
			this.devLogContainer.appendChild(tabContent);
			document.body.appendChild(this.devLogContainer);

			// Create the toggle handle (always visible at the bottom-right)
			this.devLogHandle = document.createElement('div');
			this.devLogHandle.style.position = 'fixed';
			this.devLogHandle.style.width = '100px';
			this.devLogHandle.style.height = '30px';
			this.devLogHandle.style.right = '0';
			this.devLogHandle.style.bottom = '0';
			this.devLogHandle.style.background = '#333';
			this.devLogHandle.style.color = '#fff';
			this.devLogHandle.style.display = 'flex';
			this.devLogHandle.style.alignItems = 'center';
			this.devLogHandle.style.justifyContent = 'center';
			this.devLogHandle.style.cursor = 'pointer';
			this.devLogHandle.style.zIndex = '10000';
			this.devLogHandle.style.fontSize = '18px';
			this.devLogHandle.style.borderRadius = '10px 0 0';
			this.devLogHandle.textContent = 'DevLog';
			this.devLogHandle.addEventListener('click', function() {
				self.toggleDevLog();
			});
			document.body.appendChild(this.devLogHandle);
		},

		/**
		 * Toggles the DevLog container between collapsed and expanded states.
		 */
		toggleDevLog: function() {
			if (!this.devLogContainer) { return; }
			this.devLogHandle.style.bottom		= (this.devLogContainer.style.display === 'none' ? '300px' : '0px');
			this.devLogContainer.style.display	= (this.devLogContainer.style.display === 'none' ? 'block' : 'none');
		}
	};

	// Automatically initialize if debug is enabled via URL, otherwise require manual init.
	Logger.init();

  return Logger;
}));
/*
// Example usage:
// Register structural events when classes or functions are defined.
Logger.registerStructure('MyClass defined');
function MyClass(value) {
	this.value = value;
}
MyClass.prototype.increment = function() {
	this.value++;
	return this.value;
};
Logger.registerStructure('MyClass.prototype.increment defined');

// Capture state on a specific event (e.g., click)
document.addEventListener('click', function() {
	var importantState = {
		someValue: window.someGlobalValue || null,
		anotherValue: window.anotherGlobalValue || null
	};
	Logger.capture('User click state capture', importantState);
});

// Wrap a function to track its calls
function exampleFunction(a, b) {
	return a + b;
}
var trackedExampleFunction = Logger.trackFunction(exampleFunction, 'exampleFunction');
console.log('Result:', trackedExampleFunction(2, 3));

// Basic logs
Logger.log('This is a log message.');
*/