// /js/modules/helpers/SWLogger.js
console.log("/js/modules/helpers/SWLogger.js");
/**
 *
 * Usage:
 *  - Enable logging via URL parameter debug=true or via SWLogger.init({ enabled: true }).
 *  - Call SWLogger.registerStructure() when a new class or function is defined.
 *  - Call SWLogger.capture() at strategic capture points (e.g., on user actions).
 *  - Wrap functions with SWLogger.trackFunction() to log their first call and subsequent calls.
 *
 */
export var SWLogger = {
	// Core properties
	enabled: false,
	outputBrowserConsole: null,
	logs: [], // All log entries

	// Hybrid logging: structure and state captures
	structureTree: [],
	stateCaptures: [],

	// Function tracking
	functionCalls: {},

	/**
	 * Initialize the SWLogger.
	 * @param {Object} config - Optional configuration.
	 *   {boolean} config.enabled - Override for enabling logging.
	 *   {Element} config.outputBrowserConsole - Override for enabling logging to ServiceWorker Console.
	 */
	init: function(config) {
		config = config || {};
		this.enabled = config.enabled || false;
		this.outputBrowserConsole = config.outputBrowserConsole || false;
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
			// stackLines[2] is the SWLogger method (log, warn, error)
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
	 * Outputs the log entry to the console.
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
			return fn.apply(this, arguments);
		};
	},

	/**
	 * Clears all stored logs and clears the on-screen outputs.
	 */
	clearLogs: function() {
		this.logs = [];
	}

};
export default SWLogger;

// Automatically initialize if debug is enabled via URL, otherwise require manual init.
SWLogger.init();
