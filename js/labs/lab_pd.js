console.log("Principle Diagnostics");

/********************************************
*
* Import Patient Data from Local Temp Cache.
*
*********************************************/

function pastePDPatientData() {
	chrome.storage.local.get('patientData', ({ patientData }) => {
		if (patientData) {
		}
	});
}

// Add a button to paste PD patient data
const pdButton = document.createElement('button');
pdButton.textContent = 'Paste Patient Data';
pdButton.style.cssText = 'position:fixed; bottom:10px; right:10px; z-index:1000;';
pdButton.onclick = pastePDPatientData;
//document.body.appendChild(pdButton);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === 'startCountdownBanner') {
		// If the banner is already present, don't recreate it
		if (!document.querySelector('#patientDataBanner')) {
			PCX.initializeBanner(message.patientData);
		}
	}
});

// Order filter - Show/Hide Read toggle
function initCheckboxes() {
	const filterElement = document.getElementById('ViewActiveRequsitions_filter');
	if (!filterElement) {
			// If not found, check again after a short delay
			setTimeout(initCheckboxes, 100); // Poll every 100ms
			return;
	}

	// Create the form-group div
	const formGroupDiv = document.createElement('div');
	formGroupDiv.className = 'pull-right btn-group-toggle';
	//formGroupDiv.setAttribute('data-toggle', 'buttons');

	// Create the checkbox for "Hide Read"
	const viewedCheckbox = document.createElement('input');
	viewedCheckbox.type = 'checkbox';
	viewedCheckbox.id = 'toggleViewed';
	viewedCheckbox.checked = false;
	const viewedLabel = document.createElement('label');
	viewedLabel.setAttribute('for', 'toggleViewed');
	viewedLabel.className = 'btn btn-info btn-sm btn-secondary active';
	viewedLabel.textContent = 'Show/Hide Read ';

	// Append checkboxes and labels to the form-group div
	viewedLabel.appendChild(viewedCheckbox);
	formGroupDiv.appendChild(viewedLabel);

	// Append the form-group div to the filter element
	filterElement.appendChild(formGroupDiv);

	// Function to toggle the display of .Viewed and .success
	function toggleDisplay() {
		const viewedElements = document.querySelectorAll('.Viewed');
		const oddElements = document.querySelectorAll('.odd');
		const evenElements = document.querySelectorAll('.even');

		viewedElements.forEach(el => {
			el.style.display = viewedCheckbox.checked ? 'none' : 'table-row';
		});
		oddElements.forEach(el => {
			el.style.display = viewedCheckbox.checked ? 'none' : 'table-row';
		});
		evenElements.forEach(el => {
			el.style.display = viewedCheckbox.checked ? 'none' : 'table-row';
		});
	}

	// Initial toggle display based on default checkbox states
	toggleDisplay();

	// Add event listeners to checkboxes
	//viewedCheckbox.addEventListener('change', toggleDisplay);
	viewedLabel.addEventListener('change', toggleDisplay);
}

// Start checking for the element
initCheckboxes();
