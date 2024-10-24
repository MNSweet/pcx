console.log("This is PL specific content script.");

///
// Page IDs
// Update Accession: LinkId=2071
// Create Order: LinkId=2011
///
const linkId = PCX_CMSInteraction.getUrlParams()['LinkId'];

// Event Keys
const eventKeyEnd	= new KeyboardEvent('keydown', { bubbles: true, cancelable : true, key : "END",shiftKey : false, keyCode : 35 });
const eventKeySpace = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
const eventKeyTab	= new KeyboardEvent('keydown', { bubbles: true, cancelable : true, key : "Tab",shiftKey : false, keyCode : 13 });

// Page Element points to avoid multiple queries
let pageElements = {};

// Lab Lookup Table
const labs = {
	   2: {Code:"IP",Label:"Ipseity Diagnostics LLC"},
	1010: {Code:"SQ",Label:"SureQuest Diagnostics"},
	1011: {Code:"RR",Label:"Reliable Result Labs"},
	1012: {Code:"PL",Label:"Prince Laboratories"},
	1013: {Code:"PD",Label:"Principle Diagnostics"}
};

// Test Categories / Codes Lookup Table
const testCategories = {
	 1: {Code:"Toxicology",		Test:""},		// --
	 3: {Code:"PGX",			Test:"PHARMA"},	// Panel - PHARMACOGENOMICSCOMPREHENSIVE
	 4: {Code:"CGX",			Test:"CANCER"},	// Panel - COMPREHENSICE CANCER
	 5: {Code:"STI",			Test:"STI"},	// Panel - STI Panel
	 6: {Code:"UTI",			Test:"UTI"},	// Panel - UTI Panel
	 7: {Code:"HPV",			Test:"HPV"},	// Panel - HPV Panel
	 8: {Code:"Wound",			Test:"WOUND"},	// Panel - Wound Panel
	 9: {Code:"COVID Flu RSV",	Test:"COVID"},	// Panel - COVIDFluRSV
	11: {Code:"Immuno",			Test:"IMMUNO"},	// Panel - COMPREHENSICE PRIMARY IMMUNODEFICIENCY
	12: {Code:"Neuro",			Test:"NEURO"},	// Panel - COMPREHENSIVE NEUROLOGY
	13: {Code:"RPP",			Test:""},		// --
	14: {Code:"Eyes Disorder",	Test:"EYE"},	// Panel - COMPREHENSIVE EYE DISORDER
	15: {Code:"Thyroid",		Test:"THYROID"},// Panel - THYROID GENETIC DISEASE
	16: {Code:"Diabetes",		Test:""},		// -- 
	17: {Code:"Cardio",			Test:"CARDIO"}	// Panel - CARDIO-PULMONARY
};

// Accession List
if (linkId == "2070") {
  const intervalID = setInterval(handleResults, 500);
  // Function to handle the click event and get the row data
  function handleResults(event) {
    let headings = document.getElementById('MainContent_ctl00_grid_DXHeadersRow0').textContent.replaceAll('\t','').replaceAll('\n','').split(" ");
    if (headings.includes('Alt ID 1') && typeof headings.includes('Accession')) {
      let rowData = document.querySelectorAll('.dxgvDataRow_Metropolis');

		rowData.forEach((row) => {
			let accessionID = row.querySelector('td:nth-child('+(headings.indexOf('Accession')+1)+') a').getAttribute('onclick').replace(/ShowForm\((\d*),this\)/i,'$1');
	    	let resultLinkTD = row.querySelector('td:nth-child('+(headings.indexOf('Alt ID 1')+1)+')');

	    	resultLinkTD.innerHTML = '<a href="https://prince.iatserv.com/?LinkId=2461&AccessionId='+accessionID+'" target="_blank">Results</a>'
		});
	    document.querySelector('#MainContent_ctl00_grid_DXHeadersRow0 td:nth-child('+(headings.indexOf('Alt ID 1')+1)+ ')').textContent = "Results";
    }
  }
  handleResults();
}

// Create Accession
if (linkId == "2011") {
	// Define Page Elements
	pageElements['BillType']		= document.querySelector("#MainContent_ctl00_ctl00_ddBillType_ddControl");
	if(PCX_CMSInteraction.getUrlParams()['type'] == "acs") {
		pageElements['Status']			= document.querySelector("#ddNewAccessionStatus");
	}
	pageElements['locationInput']	= document.querySelector("#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbLocation_tbText");
	pageElements['newPatientBtn']	= document.querySelector("#btnAddEditPatient");

	document.querySelector('#MainContent_ctl00_ctl00_upPanel').addEventListener('change', (e) => {
		// Ping reloaded Elements
		pageElements['CategoryOpt']		= document.querySelector("#MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_ddTestCategory option:checked");
		pageElements['TestCodesInput']	= document.querySelector("#MainContent_ctl00_ctl00_ctrlTestCodes_tbList_tbText");
		pageElements['TestCodesOutput']	= document.querySelector("#dvSelectedItems");
		if (e.target && e.target.id === 'MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_ddTestCategory') {
			checkTestCatLab(pageElements.CategoryOpt,{Input: pageElements.TestCodesInput,Output: pageElements.TestCodesOutput},testCategories);
		}
	});

	async function checkTestCatLab(elCategory,elTestCodes,testCategories){
		if(
			elCategory.value != "" &&
			elTestCodes.Output.querySelectorAll('.item').length <= 0
		) {
			console.log(elCategory.value);
			elTestCodes.Input.value = testCategories[elCategory.value].Test;
			await delay(1000);
  			pageElements['TestCodesInput']	= elTestCodes.Input = document.querySelector("#MainContent_ctl00_ctl00_ctrlTestCodes_tbList_tbText")
      		elTestCodes.Input.dispatchEvent(eventKeyEnd);
			await delay(500);
      		elTestCodes.Input.dispatchEvent(eventKeyTab);
			//document.querySelector("#MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_ddTestCategory").focus();
		}
	}
	function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	// Set Bill Type to Primary Insurance as default
	pageElements.BillType.value = 1;
	// Set Status to Received as default
	pageElements.Status.value = "Received";

	// Disable Create Patient Button if no location is set
	pageElements.newPatientBtn.classList.add("disabled");
	pageElements.locationInput.addEventListener("blur", (event) => {
		if(event.target.value != "" && pageElements.newPatientBtn.classList.contains("disabled")) {
			pageElements.newPatientBtn.classList.remove("disabled");
		}else if(!pageElements.newPatientBtn.classList.contains("disabled")){
			pageElements.newPatientBtn.classList.add("disabled");
		}
	});
}

// Update Accession
if (linkId == "2071") {
	function capturePLData() {
		// Temp Capture was already discussed with Drew and as long as 
		// it never leaves the browser/local, it's HIPAA compliant.
		// Fn startCountdownBanner() immediately takes the data after 
		// being added to local storage and sets a deletion timer to purge
		// the data from cache and local storage, never saving to hard disk
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