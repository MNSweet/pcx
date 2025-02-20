// Logger.js
export class Logger {
	static enabled = false;
	static outputTarget = null; // Optional DOM element for on-screen logging
	static logs = []; // Store log entries for later use if needed

	/**
	 * Initialize the Logger.
	 * Reads the URL parameter "debug" and any configuration options.
	 * @param {Object} config - Optional configuration.
	 * @param {boolean} config.enabled - Override for enabling logging.
	 * @param {Element} config.outputTarget - A DOM element to display logs.
	 */
	static init(config = {}) {
		const params = new URLSearchParams(window.location.search);
		this.enabled = params.get('debug') === 'true' || config.enabled || false;
		if (config.outputTarget) {
			this.outputTarget = config.outputTarget;
		}
	}

	/**
	 * Parses the current error stack to extract caller info.
	 * Note: The stack trace format is browser-dependent.
	 * @returns {string} - Caller info (file, line, column) or an empty string.
	 */
	static getCallerInfo() {
		try {
			const err = new Error();
			if (!err.stack) return '';
			const stackLines = err.stack.split('\n');
			// Typically:
			// stackLines[0] is "Error"
			// stackLines[1] is this method (getCallerInfo)
			// stackLines[2] is the Logger method (log, warn, or error)
			// stackLines[3] is the caller of Logger.log (our target)
			if (stackLines.length >= 4) {
				return stackLines[3].trim();
			} else if (stackLines.length >= 3) {
				return stackLines[2].trim();
			}
			return '';
		} catch (error) {
			return '';
		}
	}

	/**
	 * Creates a standardized log entry.
	 * @param {string} level - Log level ('log', 'warn', 'error').
	 * @param {string} message - The primary message.
	 * @param {any} context - Optional additional data.
	 * @returns {Object} - The log entry.
	 */
	static createEntry(level, message, context) {
		return {
			level,
			timestamp: new Date(),
			message,
			context,
			caller: this.getCallerInfo()
		};
	}

	/**
	 * Outputs the log entry to the console and, if defined, to an on-screen target.
	 * @param {Object} entry - The log entry object.
	 */
	static output(entry) {
		// Save the entry for potential later use
		this.logs.push(entry);

		// Output to console based on level
		switch (entry.level) {
			case 'log':
				console.log(entry);
				break;
			case 'warn':
				console.warn(entry);
				break;
			case 'error':
				console.error(entry);
				break;
			default:
				console.log(entry);
		}

		// If an on-screen output target is set, append a formatted log line
		if (this.outputTarget) {
			const logEl = document.createElement('div');
			logEl.style.fontFamily = 'monospace';
			logEl.style.borderBottom = '1px solid #ccc';
			logEl.style.padding = '2px 4px';
			logEl.style.fontSize = '12px';
			let text = `[${entry.timestamp.toISOString()}] [${entry.level.toUpperCase()}] ${entry.message} ${entry.caller}`;
			if (entry.context) {
				text += ` | Context: ${JSON.stringify(entry.context)}`;
			}
			logEl.textContent = text;
			this.outputTarget.appendChild(logEl);
		}
	}

	/**
	 * Logs a normal message.
	 * @param {string} message - The message.
	 * @param {any} context - Optional additional data.
	 */
	static log(message, context = null) {
		if (!this.enabled) return;
		const entry = this.createEntry('log', message, context);
		this.output(entry);
	}

	/**
	 * Logs a warning message.
	 * @param {string} message - The message.
	 * @param {any} context - Optional additional data.
	 */
	static warn(message, context = null) {
		if (!this.enabled) return;
		const entry = this.createEntry('warn', message, context);
		this.output(entry);
	}

	/**
	 * Logs an error message.
	 * @param {string} message - The message.
	 * @param {any} context - Optional additional data.
	 */
	static error(message, context = null) {
		if (!this.enabled) return;
		const entry = this.createEntry('error', message, context);
		this.output(entry);
	}

	/**
	 * Dynamically sets the output target for on-screen logging.
	 * @param {Element} target - A DOM element to display log messages.
	 */
	static setOutputTarget(target) {
		this.outputTarget = target;
	}

	/**
	 * Clears the stored logs and, if an output target is defined, clears its content.
	 */
	static clearLogs() {
		this.logs = [];
		if (this.outputTarget) {
			this.outputTarget.innerHTML = '';
		}
	}
}
