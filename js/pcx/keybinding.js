class Keybinding {
	constructor(bindings = {}) {
		this.bindings = bindings;
		this.initListener();
	}

	initListener() {
		document.addEventListener("keydown", (event) => {
			if (!event.altKey) { return; }

			const key = event.code.toLowerCase().replace('key', '');
			const isShift = event.shiftKey;
			const bindingKey = `${isShift ? "shift+" : ""}${key}`;
			
			if (this.bindings[bindingKey]) {
				event.preventDefault();
				this.executeBinding(this.bindings[bindingKey]);
			}
		});
	}

	executeBinding(binding) {
		if (binding.type === "open") {
			this.requestOpenWindow(binding.target, binding.url, binding.whitelist);
		} else if (binding.type === "click") {
			this.clickElement(binding.selector);
		} else if (binding.type === "callback" && typeof binding.callback === "function") {
			binding.callback();
		}
	}

	requestOpenWindow(target, url, whitelist) {
		// Send message to background.js to handle tab opening and focusing
		chrome.runtime.sendMessage({
			action: "openWindow",
			target: target,
			url: url,
			whitelist: whitelist
		});
	}

	clickElement(selector) {
		const element = document.querySelector(selector);
		if (element) { element.click(); }
	}
}