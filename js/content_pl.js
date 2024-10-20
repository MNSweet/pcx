console.log("This is PL specific content script.");

///
// Page IDs
// Update Accession: LinkId=2071
// Create Order: LinkId=2011
///
const linkId = PCX_CMSInteraction.getUrlParams()['LinkId'];


// Accession List
if (linkId == "2070") {
}

// Create Accession
if (linkId == "2011") {
}

// Update Accession
if (linkId == "2071") {
	function capturePLData() {
		const patientData = {
			Category: document.querySelector('#MainContent_ctl00_ctrlOrderTestCategoryControl_ddTestCategory option:checked').value,
			DOC: document.querySelector('#MainContent_ctl00_tbCollectionDateTime_tbDate_tbText').value,
			FirstName: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#tbFirstName').value,
			LastName: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#tbLastName').value,
			MiddleName: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_tbMiddleName').value,
			DOB: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_tbDOB_tbText').value.split('/'),
			Gender: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_ddGender_ddControl option:checked').textContent,
			Race: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_ddRace_ddControl option:checked').textContent,
			Address: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_AddressControl1_tbAddress1').value + ' ' + document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_AddressControl1_tbAddress2').value,
			State: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_AddressControl1_CountryState_ddState option:checked').value,
			City: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_AddressControl1_tbCity').value,
			Zip: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_AddressControl1_tbZipCode').value,
			Phone: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_AddressControl1_tbPhone').value,
			Email: document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_AddressControl1_tbEmail').value
		};

		///
		// Prep Data
		///

		/* 
		* Category
		*  Toxicology: 1,
		*  PGX: 3,
		*  CGX: 4,
		*  STI: 5,
		*  UTI: 6,
		*  HPV: 7,
		*  Wound: 8,
		*  COVID Flu RSV: 9,
		*  Immuno: 11,
		*  Neuro: 12,
		*  RPP: 13,
		*  Eyes Disorder: 14,
		*  Thyroid: 15,
		*  Diabetes: 16,
		*  Cardio: 17
		**/ 

		//patientData



		// Store patient data in Chrome's storage
		chrome.storage.local.set({ patientData }, () => {
			console.log('PL Patient data saved');
			startCountdownBanner(patientData);
			chrome.storage.local.get(console.log)
			// Send a message to the service worker to notify all relevant tabs
			chrome.runtime.sendMessage({ action: 'startCountdown', patientData });
		});
	}






	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.action === 'startCountdownBanner') {
		// If the banner is already present, don't recreate it
			if (!document.querySelector('#patientDataBanner')) {
				initializeBanner(message.patientData);
			}
		}
	});

	// Site Assets

	// Add BTN to copy PT data
	/*
		document.getElementById("lblAddPatientTitle").addEventListener('click', function(event) {
			const siteAssets = document.createElement('div');
			siteAssets.id = 'siteAssets';
			siteAssets.style.cssText = 'position:fixed; top:70px; right:2px; z-index:10000;';
		// Add a button to capture PL data
			const plButton = document.createElement('button');
			plButton.textContent = '⎘';
			plButton.id = 'patientCopy';
			plButton.titel = 'Capture Patient Record';
			plButton.onclick = capturePLData;
			siteAssets.appendChild(plButton);
			waitForElm('.fancybox-iframe').then((elm) => {
				document.querySelector('.fancybox-overlay').appendChild(siteAssets);
			});
		});
	*/

	let isDragging = false;
	const dropArea = document.getElementById('uploadTable');

	dropArea.addEventListener("dragover", (e) => {
		dropZoneKeepAlive(isDragging,e);
	});

	dropArea.addEventListener("dragleave", (e) => {
		dropZoneTimeOut(isDragging,e);
	});

	dropArea.addEventListener("drop", (e) => {
    	isDragging = false;
		if (document.body.classList.contains('dropZoneKeepAlive')) {
			document.body.classList.remove('dropZoneKeepAlive');
			if(document.querySelector('.upload span').textContent == "Drop File"){
				document.querySelector('.upload span').textContent = "Choose File";
			}
		}
	});

	document.addEventListener("dragover", (e) => {
		dropZoneKeepAlive(isDragging,e);
	});
	window.addEventListener("dragleave", (e) => {
		dropZoneTimeOut(isDragging,e);
	});

	function dropZoneKeepAlive(isDragging, e) {
    	isDragging = true;
		console.log("Dragging");
		if (!document.body.classList.contains('dropZoneKeepAlive')) {
			document.body.classList.add('dropZoneKeepAlive');
			document.querySelector('.upload span').textContent = "Drop File";
		}
	}
	function dropZoneTimeOut(isDragging, e) {
		if (e.target === window || (e.clientX === 0 && e.clientY === 0)) {
			isDragging = false;
			if (document.body.classList.contains('dropZoneKeepAlive')) {
				document.body.classList.remove('dropZoneKeepAlive');
				document.querySelector('.upload span').textContent = "Choose File";
			}
		}
	}
}