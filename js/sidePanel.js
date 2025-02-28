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
	// Registry mapping each CMS (lims) and location code to a renderer function.
	const templateRegistry = {
		IATSERV: {
			"2070": renderAccessionList,
			"2071": renderUpdateAccession, // Requires AccessionId
			"2011": renderCreateAccession,
			"2078": renderPreviewResults,    // Requires AccessionId
			"2461": renderUpdateResults,     // Requires AccessionId
			"7006": renderPreauthorization,  // Requires PreauthorizationOrderId
			"2006": renderNewMasterAccount,
			"2004": renderLocations,
		},
		DXRESULTS: {
			"PGX": renderPGX,
			"CGX": renderCGX,
			"ImmunodeficiencyReq.aspx": renderImmuno,
			"Neurology": renderNeuro,
		},
	};

	// Main function to choose and call the correct renderer.
	function buildFormFromData(pageState) {
		const { lims, location } = pageState;
		const renderer = templateRegistry[lims] && templateRegistry[lims][location];
		return renderer ? renderer(pageState) : renderDefault(pageState);
	}

	// Example renderer functions for IATSERV pages.
	function renderAccessionList(pageState) {
		return `<h1>Accession List</h1><p>Details for Accession List page.</p>`;
	}

	function renderUpdateAccession(pageState) {
		if (!pageState.extraParams.AccessionId) {
			return `<h1>Error</h1><p>Missing AccessionId for Update Accession.</p>`;
		}
		return `<h1>Update Accession</h1><p>Updating Accession: ${pageState.extraParams.AccessionId}</p>`;
	}

	function renderCreateAccession(pageState) {
		return `<h1>Create Accession</h1>`;
	}

	function renderPreviewResults(pageState) {
		if (!pageState.extraParams.AccessionId) {
			return `<h1>Error</h1><p>Missing AccessionId for Preview Results.</p>`;
		}
		return `<h1>Preview Results</h1><p>Previewing results for Accession: ${pageState.extraParams.AccessionId}</p>`;
	}

	function renderUpdateResults(pageState) {
		if (!pageState.extraParams.AccessionId) {
			return `<h1>Error</h1><p>Missing AccessionId for Update Results.</p>`;
		}
		return `<h1>Update Results</h1><p>Updating results for Accession: ${pageState.extraParams.AccessionId}</p>`;
	}

	function renderPreauthorization(pageState) {
		if (!pageState.extraParams.PreauthorizationOrderId) {
			return `<h1>Error</h1><p>Missing PreauthorizationOrderId.</p>`;
		}
		return `<h1>Preauthorization</h1><p>Order: ${pageState.extraParams.PreauthorizationOrderId}</p>`;
	}

	function renderNewMasterAccount(pageState) {
		return `<h1>New Master Account</h1>`;
	}

	function renderLocations(pageState) {
		return `<h1>Locations</h1>`;
	}

	// Example renderer functions for DXRESULTS pages.
	function renderPGX(pageState) {
		return `<h1>PGX Page</h1>`;
	}

	function renderCGX(pageState) {
		return `<h1>CGX Page</h1>`;
	}

	function renderImmuno(pageState) {
		return `<h1>Immunodeficiency Request</h1>`;
	}

	function renderNeuro(pageState) {
		return `<h1>Neurology Page</h1>`;
	}

	// Default renderer if no match is found.
	function renderDefault(pageState) {
		return `<h1>Default Template</h1><p>No specific template for ${pageState.lims} with location ${pageState.location}.</p>`;
	}

	// Optional: Dynamic registration for new templates.
	function registerTemplateRenderer(lims, location, renderer) {
		if (!templateRegistry[lims]) {
			templateRegistry[lims] = {};
		}
		templateRegistry[lims][location] = renderer;
	}

	// Request the active tab's page state from the background.
	function requestTabData() {
		chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
			if (tabs.length > 0) {
				const activeTab = tabs[0];
				chrome.runtime.sendMessage({ type: 'getPageState', tabId: activeTab.id }, (response) => {
					if (response) {
						renderSidePanel(response);
					} else {
						document.getElementById('sidePanel').innerHTML = '<p>No page data available.</p>';
					}
				});
			}
		});
	}

	// Render the sidePanel's content.
	function renderSidePanel(pageState) {
		const content = buildFormFromData(pageState);
		document.getElementById('sidePanel').innerHTML = content;
	}

	// Initialize the sidePanel when the panel loads.
	document.addEventListener('DOMContentLoaded', requestTabData);
	});
