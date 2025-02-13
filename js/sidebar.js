document.addEventListener("DOMContentLoaded", async () => {
/**
 * 
 * Tab navigation
 * 
 */
	document.querySelectorAll(".tab-button").forEach(button => {
		button.addEventListener("click", () => {
			document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
			document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
			
			button.classList.add("active");
			document.getElementById(button.dataset.tab).classList.add("active");
		});
	});

	async function getCurrentTabUrl() {
		let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		return tab?.url || "unknown";
	}

/**
 * 
 * Information
 * 
 */

	async function getCurrentTabUrl() {
		let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
		return tab?.url || "unknown";
	}
	async function requestPageContent() {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs.length === 0) return;
			chrome.tabs.sendMessage(tabs[0].id, { action: "getPageContent" }, (response) => {
				if (chrome.runtime.lastError) {
					console.warn("Content script not injected or unavailable");
					return;
				}
				if (response && response.content) {
					console.log("Page content received:", response.content);
					// Now you can process the DOM data inside the sidebar
				}
			});
		});
	}

	async function loadInfoUI() {
		let container = PCX.getEl("#settings-container");

		if (!container) {
			PCX.log("Error: #settings-container not found.");
			return;
		}
	}
	chrome.runtime.onMessage.addListener((message) => {
	if (message.action === "pageUpdated") {
		console.log("Page URL changed:", message.url);
		// Update sidebar UI based on new page
	}

	if (message.action === "domUpdated") {
		console.log("Page content changed:", message.snapshot);
		// Process the updated page content
	}
});



/**
 * 
 * Readme
 * 
 */
	const markdownViewer = document.getElementById("markdown-viewer");

	function loadMarkdown(file) {
		fetch(file)
			.then(response => response.text())
			.then(markdown => {
				markdownViewer.innerHTML = marked.parse(markdown);
				attachMarkdownLinkHandlers();
			})
			.catch(error => console.error("Error loading markdown:", error));
	}

	function attachMarkdownLinkHandlers() {
		markdownViewer.querySelectorAll("a").forEach(link => {
			link.addEventListener("click", (event) => {
				const href = link.getAttribute("href");

				if (href.endsWith(".md")) {
					event.preventDefault();
					loadMarkdown(href);
				}
			});
		});
	}

	// Initial load of README.md
	loadMarkdown("README.md");

/**
 * 
 * Settings
 * 
 */
	async function loadSettingsUI() {
		let settings = await Settings.get()
		let container = PCX.getEl("#settings-container");

		if (!container) {
			PCX.log("Error: #settings-container not found.");
			return;
		}

		container.innerHTML = ""; // Clear existing UI

		for (const [category, permissions] of Object.entries(settings)) {
			let categoryDiv = PCX.createDOM("div", {
				classList: "settings-category"
			});

			let categoryHeader = PCX.createDOM("h3", {
				innerText: category
			});
			categoryDiv.appendChild(categoryHeader);

			// Convert object to an array and sort by priority, then alphabetically
			const sortedPermissions = Object.entries(permissions).sort((a, b) => {
				let metadataA = Settings.PERMISSION_STRUCTURE[category]?.[a[0]] || { priority: 10 };
				let metadataB = Settings.PERMISSION_STRUCTURE[category]?.[b[0]] || { priority: 10 };

				return metadataA.priority - metadataB.priority || a[0].localeCompare(b[0]);
			});

			for (const [key, value] of sortedPermissions) {
				let metadata = Settings.PERMISSION_STRUCTURE[category]?.[key] || { description: "", priority: 10, tags:['Unsorted'] };

				let settingLabel = PCX.createDOM("label", {
					classList: "settingsField"
				});

				let inputCheckbox = PCX.createDOM("input", {
					type: "checkbox",
					classList: "settingsFieldInput toggle-switch",
					"data-category": category,
					"data-permission": key,
					checked: value
				});

				let contentDiv = PCX.createDOM("div", {
					classList: "settingsFieldContent",
					innerHTML: `
						<span class="settingsFieldText">${key}</span>
						<span class="settingsFieldDesc">${metadata.description}</span>
						<span class="settingsFieldTags"><span class="settingsFieldTag">${metadata.tags.join('</span><span class="settingsFieldTag">')}</span>
					`
				});

				inputCheckbox.addEventListener("change", async (event) => {
					await Settings.save(category, key, event.target.checked);
				});

				settingLabel.appendChild(inputCheckbox);
				settingLabel.appendChild(contentDiv);
				categoryDiv.appendChild(settingLabel);
			}

			container.appendChild(categoryDiv);
		}
	}

	loadSettingsUI();
});
