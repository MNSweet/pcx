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

/**
 * 
 * Information
 * 
 */

	async function loadInfoUI(data) {
		console.log("loadInfoUI data", data);
		let container = PCX.getEl("#information-container");

		if (!container) {
			console.log("Error: #information-container not found.");
			return;
		}
		container.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;

		container.appendChild(PCX.createDOM("dt", {
			classList: "infoLabel",
			innerText: "Requisition Filename"
		}));

		container.appendChild(PCX.createDOM("dd", {
			classList: "infoDesc",
			innerText: data.req
		}));
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

		if (message.action === "accessionData") {
			console.log("Accession Data:", message.data);
			loadInfoUI(message.data);
			// Process the updated page content
		}
	});

	async function requestStoredPageContent() {
		chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
			if (!tabs.length) return;
			let tabId = tabs[0].id;

			// Request data from background script
			chrome.runtime.sendMessage({ action: "getStoredPageData", tabId }, (response) => {
				if (response?.data) {
					console.log("Loaded page data:", response.data);
					loadInfoUI(response.data);
				} else {
					console.warn("No stored data found for tab", tabId);
					retryFetchingPageData(tabId, 5); // Retry if data isn't available
				}
			});
		});
	}

	// Retry mechanism for fetching page data if not available initially
	function fetchPageDataWithRetry(tabId, retries = 5) {
		if (retries === 0) return;
		chrome.runtime.sendMessage({ action: "getStoredPageData", tabId }, (response) => {
			if (response?.data) {
				loadInfoUI(response.data);
			} else {
				setTimeout(() => fetchPageDataWithRetry(tabId, retries - 1), 500);
			}
		});
	}

	// Listen for updates from the background script
	chrome.runtime.onMessage.addListener((message) => {
		if (message.action === "pageDataUpdated") {
			console.log(`Page data updated for tab ${message.tabId}`);
			requestStoredPageContent();
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
