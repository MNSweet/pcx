/**
 * PageDataManager
 * 
 * A reusable class to extract and normalize page data based on provided selectors,
 * optionally pre-process values, and send/receive messages with the background.
 * 
 */
Logger.file("PageDataManager");
class PageDataManager {
	static getData(config) {
		const data = {};
		for (const key in config) {
			const conf = config[key];
			
			// If no selector is provided, use preprocess or default.
			if (!conf.selector) {
				if (conf.preprocess && typeof conf.preprocess === "function") {
					// Call preprocess with null values since there is no element.
					data[key] = conf.preprocess(null, null, null);
				} else {
					data[key] = conf.default || "";
				}
				continue;
			}

			// Handle multiple elements case.
			if (conf.multiple) {
				const elements = document.querySelectorAll(conf.selector);
				if (elements && elements.length > 0) {
					if (conf.preprocess && typeof conf.preprocess === "function") {
						data[key] = conf.preprocess(null, null, elements);
					} else {
						data[key] = Array.from(elements).map(el => el.innerText.trim());
					}
				} else {
					data[key] = conf.default || [];
				}
			} else {
				// Single element case.
				const element = document.querySelector(conf.selector);
				if (element) {
					let value = element.value || element.innerText || "";
					value = value.trim();
					if (conf.preprocess && typeof conf.preprocess === "function") {
						value = conf.preprocess(value, element);
					}
					data[key] = value;
				} else {
					data[key] = conf.default || "";
				}
			}
		}
		return data;
	}

	/**
	 * Sends the normalized page data to the background.
	 * @param {Object} config - The configuration object.
	 */
	static sendPageData(config) {
		const data = PageDataManager.getData(config);
		// You can extend the data with additional info.
		const normalizedData = {
			pageTemplate: data.pageTemplate || new URL(location.href).searchParams.get("LinkId") || "default",
			sidePanelTemplate: data.sidePanelTemplate || "defaultSidePanel",
			pageContext: data,
			title: document.title,
			url: location.href,
			timestamp: new Date().toISOString()
		};
		console.log("PageDataManager: Data sent", normalizedData);
		MessageRouter.sendMessage({ action: 'storePageData', data: normalizedData },);
	}

	/**
	 * Attaches a listener so that when the background requests the page content,
	 * the current page data is gathered and returned.
	 * @param {Object} config - The configuration object.
	 */
	static attachContentListener(config) {
		chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
			if (request.action === "getPageContent") {
				const liveData = PageDataManager.getData(config);
				console.log("PageDataManager: Sending live page content", liveData);
				sendResponse({ content: liveData });
			}
		});
	}
}
