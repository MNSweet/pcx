class DOMObserver {
	static observers = new Map(); // Stores observers keyed by node and options

	static observe(node, options, callback) {
		if (!(node instanceof Node)) {
			console.error("Invalid node provided for observation");
			return;
		}
		const key = JSON.stringify({ node: node.nodeName, options });

		if (!this.observers.has(key)) {
			try {
				const observer = new MutationObserver((mutations) => {
					this.observers.get(key).callbacks.forEach(cb => cb(mutations));
				});
				observer.observe(node, options);
				this.observers.set(key, { observer, callbacks: [callback] });
			} catch (error) {
				console.error("Failed to observe node:", error);
			}
		} else {
			this.observers.get(key).callbacks.push(callback);
		}
	}

	static removeObserver(node, options) {
		const key = JSON.stringify({ node: node.nodeName, options });
		if (this.observers.has(key)) {
			this.observers.get(key).observer.disconnect();
			this.observers.delete(key);
		}
	}

	static disconnectAll() {
		this.observers.forEach(({ observer }) => observer.disconnect());
		this.observers.clear();
	}
}
window.DOMObserver = DOMObserver;