document.addEventListener("DOMContentLoaded", () => {
	// Tab navigation
	document.querySelectorAll(".tab-button").forEach(button => {
		button.addEventListener("click", () => {
			document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
			document.querySelectorAll(".tab-content").forEach(content => content.classList.remove("active"));
			
			button.classList.add("active");
			document.getElementById(button.dataset.tab).classList.add("active");
		});
	});

	// Load settings from storage
	chrome.storage.sync.get(["sidebarSettings"], (data) => {
		const settings = data.sidebarSettings || {};
		document.querySelectorAll(".toggle-switch").forEach((toggle) => {
			const key = toggle.dataset.setting;
			toggle.checked = settings[key] || false;
		});
	});

	// Handle toggle switches
	document.querySelectorAll(".toggle-switch").forEach((toggle) => {
		toggle.addEventListener("change", (event) => {
			chrome.storage.sync.get(["sidebarSettings"], (data) => {
				const settings = data.sidebarSettings || {};
				settings[event.target.dataset.setting] = event.target.checked;
				chrome.storage.sync.set({ sidebarSettings: settings });
			});
		});
	});

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
});
