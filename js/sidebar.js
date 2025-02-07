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
	const settingsContainer = document.getElementById("settings-container");

	async function loadSettingsUI() {
		let settings = await DataHandler.get("chrome", "settings");
		settingsContainer.innerHTML = "";

		Object.keys(settings).forEach(category => {
			let categoryHeader = document.createElement("h3");
			categoryHeader.textContent = category;
			settingsContainer.appendChild(categoryHeader);

			Object.keys(settings[category]).forEach(permission => {
				let label = document.createElement("label");
				label.innerHTML = `<input type="checkbox" class="toggle-switch" data-category="${category}" data-permission="${permission}"> ${permission}`;
				settingsContainer.appendChild(label);
			});
		});

		// Load existing settings states
		document.querySelectorAll(".toggle-switch").forEach(input => {
			let category = input.dataset.category;
			let permission = input.dataset.permission;
			input.checked = settings[category][permission];

			input.addEventListener("change", async () => {
				settings[category][permission] = input.checked;
				await DataHandler.set("chrome", "settings", settings);
			});
		});
	}

	loadSettingsUI();
});
