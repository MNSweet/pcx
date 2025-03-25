// TemplateRenderer.js
class TemplateRenderer {
	static templateCache = {};

	static async loadTemplate(path) {
		if (this.templateCache[path]) {
			return this.templateCache[path];
		}

		try {
			const fullPath = chrome.runtime.getURL(`js/serviceworker/SidePanelTemplates/${path}`);
			const res = await fetch(fullPath);
			if (!res.ok) throw new Error(`Template not found: ${path}`);
			const text = await res.text();
			this.templateCache[path] = text;
			return text;
		} catch {
			// Silently return null for fallback logic
			return null;
		}
	}

	static renderTemplate(template, data) {
		return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
			const keys = key.trim().split(".");
			return keys.reduce((obj, k) => (obj && obj[k] !== undefined) ? obj[k] : "", data);
		});
	}

	static async render(lims, templateKey, pageState, nameHint = "") {
		const pathsToTry = [
			`${lims}/${templateKey}${nameHint ? "-" + nameHint : ""}.html`,
			`${lims}/${templateKey}.html`,
			`${lims}.html`,
			`DEFAULT.html`
		];

		for (const path of pathsToTry) {
			const template = await this.loadTemplate(path);
			if (template) {
				return this.renderTemplate(template, pageState);
			}
		}

		console.warn(`[TemplateRenderer] No template found for ${lims}/${templateKey}. Tried:\n${pathsToTry.join("\n")}`);
		return `<h1>Template Missing</h1><p>No usable template for lims: ${lims}, key: ${templateKey}</p>`;
	}
}
