console.log("This is PL specific content script.");

/**
 *
 * PREP Variables/Constants
 *
 * @param INT					linkId
 * @param EVENT KEYDOWN[END]	eventKeyEnd		Simulated keypress of "End"
 * @param EVENT KEYDOWN[SPACE]	eventKeySpace	Simulated keypress of "Space"
 * @param EVENT KEYDOWN[TAB]	eventKeyTab		Simulated keypress of "Tab"
 * @param OBJ					pageElements	Object of DOM elements
 * @param OBJ					labs			Lookup table for Labs by DB ID's
 * @param OBJ					testCategories	Lookup table for Test Categories by DB ID's
 * 
 */
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

// Create Accession (type=acs) & Create Orders
if (linkId == "2011") {

/**
 *
 * Set Default Inputs
 *
 * @param	 INT		BillType	1			"Primary Insurance"
 * @param	 STRING		Status		Received
 *
 * @state	 DISABLED	#btnAddEditPatient
 *
 * @listener CHANGE		#MainContent_ctl00_ctl00_upPanel
 * @listener CLICK		#btnAddEditPatient
 * @listener BLUR		#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbLocation_tbText
 *
 * @function async		checkTestCat()
 * @function promise	delay()
 * 
 */

	// Define Page Elements
	pageElements['BillType']	= document.querySelector("#MainContent_ctl00_ctl00_ddBillType_ddControl");
	if(PCX_CMSInteraction.getUrlParams()['type'] == "acs") {
		pageElements['Status']	= document.querySelector("#ddNewAccessionStatus");
	}
	pageElements['locationInput']	= document.querySelector("#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbLocation_tbText");
	pageElements['Physician']		= "#ddPhysician";
	pageElements['PhysicianOptions']= "#ddPhysician option";
	pageElements['newPatientBtn']	= document.querySelector("#btnAddEditPatient");

	// Set Bill Type to Primary Insurance as default
	pageElements.BillType.value = 1;
	// Set Status to Received as default
	pageElements.Status.value = "Received";

	pageElements.newPatientBtn.addEventListener('click', async (e) => {
		waitForElm(".fancybox-overlay.fancybox-overlay-fixed iframe").then( (elm) => {
			document.querySelector(".fancybox-overlay.fancybox-overlay-fixed iframe").addEventListener('load', (el) => {
				
				// Date of Birth Checks
				let inputDOB = document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_tbDOB_tbText');
				let minorDate = new Date();
					minorDate.setFullYear(minorDate.getFullYear() - 18);
				inputDOB.addEventListener('blur',  (elme) => {
					let dob = document.querySelector('[class="fancybox-iframe"').contentWindow.document.querySelector('#MainContent_ctl00_tbDOB_tbText').value;	
					//console.log(dob,Date.parse(dob),Date.now(),Date.parse(dob) >= Date.now());
					if(Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= Date.now()){
						QAManager.addNotice("DOB","Seems like your patient hasn't been born yet. Is this birthday correct? " + dob);
						//QAManager.showQAModalNotification();
					}else if(Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= minorDate.getTime()){ // 18+ Minor check
						//console.log(Date.parse(dob), minorDate.getTime());
						QAManager.addNotice("DOB","Intesting your patient is a minor. Just a quick check. Is this birthday correct? " + dob);
						//QAManager.showQAModalNotification();
					}else if(Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= 946702800000){ //Jan 1 2000
						//console.log(Date.parse(dob), 946702800000);
						QAManager.addNotice("DOB","Just being vigilant, Is this birthday correct? " + dob);
						//QAManager.showQAModalNotification();
					}else {
						QAManager.removeNotice("DOB");
					}
				});
				//QAManager.showQAModalNotification();
			});
		});
	});

	// Disable Create Patient Button if no location is set
	pageElements.newPatientBtn.classList.add("disabled");
	pageElements.locationInput.addEventListener("blur", (event) => {
		if(event.target.value != "" && pageElements.newPatientBtn.classList.contains("disabled")) {
			if(event.target.value.match("^(AM-|CTD-).*")){
				waitForElm(pageElements.PhysicianOptions).then((elm) => {
					document.querySelector(pageElements.Physician).innerHTML = `<option value="0" disabled selected hidden>Select a Physician</option>`+document.querySelector(pageElements.Physician).innerHTML;
			        document.querySelector("#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbPhysicianId").value = "";
			        document.querySelector("#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbPhysicianName").value = "";
				});
			}
			pageElements.newPatientBtn.classList.remove("disabled");
		}else if(!pageElements.newPatientBtn.classList.contains("disabled")){
			pageElements.newPatientBtn.classList.add("disabled");
		}
	});

	document.querySelector('#MainContent_ctl00_ctl00_upPanel').addEventListener('change', (e) => {
		// Ping reloaded Elements
		pageElements['CategoryOpt']		= document.querySelector("#MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_ddTestCategory option:checked");
		pageElements['TestCodesInput']	= document.querySelector("#MainContent_ctl00_ctl00_ctrlTestCodes_tbList_tbText");
		pageElements['TestCodesOutput']	= document.querySelector("#dvSelectedItems");
		if (e.target && e.target.id === 'MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_ddTestCategory') {
			checkTestCat(pageElements.CategoryOpt,{Input: pageElements.TestCodesInput,Output: pageElements.TestCodesOutput},testCategories);
		}
	});
	async function checkTestCat(elCategory,elTestCodes,testCategories){
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
		}
	}
	function delay(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}
}

// Update Accession
if (linkId == "2071") {

/**
 * 
 * Reference Lab Transfer Assist
 * 
 */
	function capturePLData() {
		// Temp Capture was already discussed with Dean and as long as 
		// it never leaves the browser/local, it's HIPAA compliant.
		// Fn initializeBanner() immediately takes the data after 
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

		// Store patient data in Chrome's storage
		chrome.storage.local.set({ patientData }, () => {
			console.log('PL Patient data saved');
			chrome.storage.local.get(console.log)
			// Send a message to the service worker to notify all relevant tabs
			chrome.runtime.sendMessage({
				action: 'startCountdown',
				patientData: {
					FirstName:	patientData.FirstName,
					LastName:	patientData.LastName,
					Category:	patientData.Category
				}
			});
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
	
	document.getElementById("lblAddPatientTitle").addEventListener('click', function(event) {
		const siteAssets = document.createElement('div');
		siteAssets.id = 'siteAssets';
		// Add a button to capture PL data
		const plButton = document.createElement('span');
		plButton.textContent = '⎘';
		plButton.id = 'patientCopy';
		plButton.titel = 'Capture Patient Record';
		plButton.onclick = capturePLData;
		siteAssets.appendChild(plButton);
		waitForElm('.fancybox-iframe').then((elm) => {
			document.querySelector('.fancybox-overlay').appendChild(siteAssets);
		});
	});
	

/**
 *
 * File Drop
 *
 * Expands the Drop area of file upload and applies a QA Check
 * 
 */
	let 	isDragging 	= false;
	const 	dropArea	= document.getElementById('uploadTable').closest('*');
	const 	acceptTypes = document.querySelector('#uploadTable input[type="file"]').getAttribute('accept').split(',');

	dropArea.addEventListener("dragover", (e) => {
		dropZoneKeepAlive(isDragging,e);
	});

	dropArea.addEventListener("dragleave", (e) => {
		dropZoneTimeOut(isDragging,e);
	});
	document.addEventListener("dragover", (e) => {
		dropZoneKeepAlive(isDragging,e);
	});
	window.addEventListener("dragleave", (e) => {
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
		if(e.dataTransfer.files.length > 0) {
			console.log("dropArea dataTransfer",e.dataTransfer.files);

			for (const [i, file] of Object.entries(e.dataTransfer.files)) {
				let fileExt = file.name.split('.').pop();
				let fileName = file.name.replace('.'+fileExt,'');
				if (acceptTypes.findIndex(function (a) { return a.toLowerCase() == ('.' + fileExt).toLowerCase() }) == -1) {
					//return; // File not accepted
				}

				let acsNum 	= document.querySelector("#MainContent_ctl00_tbAccession").value; // LIMS ID
				let acsID 	= document.querySelector("#tbAccessionId").value; // System ID (database)
				let patient	= document.querySelector("#MainContent_ctl00_tbPatient_tbText").value.toUpperCase().split(', ');
				let queries	= patient;
					queries.push(acsNum, acsID);

				let tokens	= fileName.toUpperCase()
					.replace(/(\d{2})-(\d{2})-(\d{4})/gm, `$1$2$3`) // Condense Dates with dashes
					.replace(/(\d{2})\.(\d{2})\.(\d{4})/gm, `$1$2$3`) // Condense Dates with periods
					.split(/[\s-\._]/)	// Separate by whitespace, dashes, periods, underscores

				if(!tokens.some(item => queries.includes(item))) {
					QAManager.addNotice("FileUpload","<h4>Sorry to bother</h4>The file you just uploaded does not have the Patient's Name or Accession Number in it's name.<br/>Just wanted to double check you didn't upload the wrong file: <pre>" + file.name + "</pre>");
					QAManager.showQAModalNotification();
					QAManager.removeNotice("FileUpload");
				}
			};
		}
	});

	function dropZoneKeepAlive(isDragging, e) {
		isDragging = true;
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