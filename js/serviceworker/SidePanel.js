// sidepanel.js

// Wait for DOM to be ready

// == Extension UI Setup ==
document.addEventListener("DOMContentLoaded", async () => {
	MessageRouter.registerHandler("showLoading", (msg) => {
		DOMHelper.getEl('#tabCheck').innerHTML = `${JSON.stringify(msg.message,null,"\t")}`;
		//renderSidePanel({ lims: "Loading", sidePanelTemplate: "Default" });
	});

	MessageRouter.registerHandler("sidePanelReadyResponse", (message) => {/* Silence */});
	MessageRouter.sendMessage({ action: "sidePanelReady" });

/**
 * 
 * Tab navigation
 * 
 */
	DOMHelper.getEls(".tab-button").forEach((button) => {
		button.addEventListener("click", () => {
			DOMHelper.getEls(".tab-button").forEach((btn) => btn.classList.remove("active"));
			DOMHelper.getEls(".tab-content").forEach((content) => content.classList.remove("active"));
			button.classList.add("active");
			document.getElementById(button.dataset.tab).classList.add("active");
		});
	});

/**
 * 
 * Readme
 * 
 */
	// Markdown viewer
	const markdownViewer = document.getElementById("markdown-viewer");

	function loadMarkdown(file) {
		fetch(file)
			.then((response) => response.text())
			.then((markdown) => {
				markdownViewer.innerHTML = marked.parse(markdown);
				attachMarkdownLinkHandlers();
			})
			.catch((error) => console.error("Error loading markdown:", error));
	}

	function attachMarkdownLinkHandlers() {
		markdownViewer.querySelectorAll("a").forEach((link) => {
			link.addEventListener("click", (event) => {
				const href = link.getAttribute("href");
				if (href.endsWith(".md")) {
					event.preventDefault();
					loadMarkdown(href);
				}
			});
		});
	}

	loadMarkdown("README.md");

/**
 * 
 * Settings
 * 
 */
	async function loadSettingsUI() {
		let settings = await Settings.get();
		let container = DOMHelper.getEl("#settings-container");
		if (!container) return;

		container.innerHTML = "";

		for (const [category, permissions] of Object.entries(settings)) {
			let categoryDiv = DOMHelper.createDOM("div", { classList: "settings-category" });
			let categoryHeader = DOMHelper.createDOM("h3", { innerText: category });
			categoryDiv.appendChild(categoryHeader);

			// Convert object to an array and sort by priority, then alphabetically
			const sortedPermissions = Object.entries(permissions).sort((a, b) => {
				let metaA = Settings.PERMISSION_STRUCTURE[category]?.[a[0]] || { priority: 10 };
				let metaB = Settings.PERMISSION_STRUCTURE[category]?.[b[0]] || { priority: 10 };
				return metaA.priority - metaB.priority || a[0].localeCompare(b[0]);
			});

			for (const [key, value] of sortedPermissions) {
				let meta = Settings.PERMISSION_STRUCTURE[category]?.[key] || { description: "", priority: 10, tags: ["Unsorted"] };
				let settingLabel = DOMHelper.createDOM("label", { classList: "settingsField" });

				let inputCheckbox = DOMHelper.createDOM("input", {
					type: "checkbox",
					classList: "settingsFieldInput toggle-switch",
					"data-category": category,
					"data-permission": key,
					checked: value
				});

				let contentDiv = DOMHelper.createDOM("div", {
					classList: "settingsFieldContent",
					innerHTML: `
						<span class="settingsFieldText">${key}</span>
						<span class="settingsFieldDesc">${meta.description}</span>
						<span class="settingsFieldTags">
							<span class="settingsFieldTag">
								${meta.tags.join("</span><span class=\"settingsFieldTag\">")}
							</span>
						</span>
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

	// Template name registry
	const templateRegistry = {
		IATSERV: {
			"2001": "MasterList",
			"2004": "Locations",
			"2006": "NewMasterAccount",
			"2011": "CreateAccession",
			"2070": "AccessionList",
			"2071": "UpdateAccession",
			"2461": "UpdateResults",
			"7006": "Preauthorization",
		},
		DXRESULTS: {
			"PGX": "PGX",
			"CGX": "CGX",
			"Immuno": "Immuno",
			"Neuro": "Neuro",
		},
		OutOfScope: {
			"Default": "OOSDefault"
		},
		Loading: {
			"Default": "Loading"
		}
	};

	async function buildFormFromData(pageState) {
		const { lims, sidePanelTemplate } = pageState;
		const key = sidePanelTemplate || lims;
		const nameHint = templateRegistry[lims]?.[key] || "";
		return await TemplateRenderer.render(lims, key, pageState, nameHint);
	}
	
	// Request the active tab's page state from the background.
	function requestPageData() {
		MessageRouter.registerHandler("getPageDataResponse", (message) => {/* Silence */});
		MessageRouter.registerHandler("updatePageData", (message) => {
			try {
				renderSidePanel(message.data.inScope ? message.data.contents : {"lims":"OutOfScope","sidePanelTemplate":"Default"});
			}catch(e){console.log(e)}
		});
		MessageRouter.sendMessage({ action: "getPageData" });

		const infoTab = document.getElementById("infoTab");
		if (infoTab) {
			infoTab.addEventListener("click", () => {
				requestPageData();
			});
		}
	}

	// Render the sidePanel's content.
	function renderSidePanel(pageState) {
		DOMHelper.getEl("#debug-dump").innerHTML = `${JSON.stringify(pageState, null, "\t")}`;
		buildFormFromData(pageState).then((content) => {
			DOMHelper.getEl("#information-container").innerHTML = content;
		});
	}

	requestPageData();
});

window.addEventListener("unload", () => {
	MessageRouter.registerHandler("sidePanelClosedResponse", (message) => {/* Silence */});
	chrome.runtime.sendMessage({ action: "sidePanelClosed" });
});
