console.log("This is RR specific content script.");

/**
 *
 * PREP Variables/Constants
 *
 * @param OBJ					pageElements		Object of DOM elements
 * @param OBJ					testCategories		Lookup table for Test Categories by DB ID's
 * @param OBJ					categoryTranslation	Translation table for Test Categories by DB ID's PL>>RR 
 * 
 */

	// Page Element points to avoid multiple queries
	let pageElements = {};

	IATSERV.setTestCategories({
		 6: {Code:"Core Laboratory",		Test:""},				// --
		 7: {Code:"Cultures",				Test:""},				// --
		10: {Code:"Dermatology",			Test:""},				// --
		11: {Code:"Cytology",				Test:""},				// --
		12: {Code:"Urology",				Test:""},				// --
		13: {Code:"Histology",				Test:""},				// --
		14: {Code:"Nail Fungal",			Test:""},				// --
		15: {Code:"Pathology",				Test:""},				// --
		16: {Code:"PGX",					Test:"COMP120"},		// Panel - COMP120
		17: {Code:"CGX NGS",				Test:"COMPREHENSIVE"},	// Panel - IP-CGX Comprehensive Cancer
		18: {Code:"Immuno NGS",				Test:"PANEL"},			// Panel - Comprehensive Immunodeficiency Panel
		19: {Code:"Cardio NGS",				Test:"CARDIO"},			// Panel - CARDIO-PULMONARY
		20: {Code:"Eye NGS",				Test:"EYE"},			// Panel - Comprehensive Eye Disorder Panel
		21: {Code:"Neuro NGS",				Test:"PANEL"},			// Panel - Neuro-Degenerative Panel
		22: {Code:"Thyroid NGS",			Test:"PANEL"},			// Panel - Thyroid Genetic Disease Panel
		23: {Code:"Toxicology",				Test:"REFLEX"},			// Panel - Urine Drug Screen Profile w/ Reflex to Definitive | Urine Drug Screen ONLY
		25: {Code:"STI",					Test:"PROFILE"},		// Panel - STI Profile
		26: {Code:"UTI",					Test:"ABR PROFILE"},	// Panel - UTI w/ ABR Profile
		27: {Code:"Wound",					Test:"ABR PROFILE"},	// Panel - Wound W/ ABR Profile
		28: {Code:"Respiratory Pathogens",	Test:"PROFILE"},		// Panel - RPP - Respiratory Pathogen Profile w/ ABR
		30: {Code:"COVID-19",				Test:"COVID"}			// Panel - COVID-19
	//	-1: {Code:"Diabetes",				Test:""},				// -- 
	//	-1: {Code:"HPV",					Test:"HPV"},			// Panel - HPV Panel
	};
	
	IATSERV.setCategoryTranslation({
	//	-1:6,	// Core Laboratory	- R&R only
	//	-1:16,	// Cultures			- R&R only
	//	-1:16,	// Dermatology		- R&R only
	//	-1:16,	// Cytology			- R&R only
	//	-1:16,	// Histology		- R&R only
	//	-1:16,	// Urology			- R&R only
	//	-1:16,	// Nail Fungal		- R&R only
	//	-1:16,	// Pathology		- R&R only
		 3:16,	// PGX
		 4:17,	// CGX
		11:18,	// Immuno
		17:19,	// Cardio
		14:20,	// Eyes
		12:21,	// Neuro
		15:22,	// Thyroid
		 1:23,	// Toxicology
		 5:25,	// STI
		 6:26,	// UTI
		 8:27,	// Wound
		13:28,	// RPP
		 9:30,	// COVID
		 7:-1,	// HPV 				- Prince only
		16:-1	// Diabetes			- Prince only
	};

	const genderTranslate = {
		Male: 1,
		Female: 2
	};

	const raceTranslate = {
		"African American": 1,
		"Hispanic": 2,
		"Caucasian": 3,
		"Mixed Race": 4,
		"Mixed": 4,
		"Asian": 5,
		"Native American": 6,
		"Other": 7
	};


// Results List
if (IATSERV.linkId == "2024") {
	// Function to handle the click event and get the row data
	function handleDownloadClick(event) {
		//event.preventDefault(); // Prevent the default link behavior [For testing, should be commented out]

		const headings = PCX.findEl('#MainContent_ctl00_grid_DXHeadersRow0').textContent.replaceAll('\t','').replaceAll('\n','').split(" ");
		// Check if the clicked element or one of its parents is the <a> with title "Download Result"
		const clickedLink = event.target.closest('a[title="Download Result"]');

		// If the clicked element matches the <a> tag we care about
		if (clickedLink) {
			// Find the parent <tr> for the clicked <a>
			const row = clickedLink.closest('tr');

			// Collect the text content of all <td> elements in the row into an array
			const rowData = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
			row.classList.add('dxgvSelectedRow_Metropolis');
			const tdCheckBox = row.querySelector('td:first-child span');
			tdCheckBox.classList.replace('dxWeb_edtCheckBoxUnchecked_Metropolis','dxWeb_edtCheckBoxChecked_Metropolis');
			const date = new Date();
			return "Results "
						+('0' + (date.getMonth()+1)).slice(-2)
						+"."+('0' + (date.getDate())).slice(-2)
						+"."+(date.getFullYear().toString().substr(-2))
						+" "
						+rowData[headings.indexOf('Last')]
						+" "
						+rowData[headings.indexOf('First')]
						+".pdf"; // Output the row data as an array
		}
	}

	// Attach the event listener to a common ancestor of the dynamically replaced content
	document.body.addEventListener('click', function(event) {
		// Only process clicks inside the dynamically replaced div#MainContent_ctl00_updatePanel1
		if (event.target.closest('#MainContent_ctl00_updatePanel1') && event.target.closest('a[title="Download Result"]')) {
			PCX.copyToClipboard(handleDownloadClick(event));
		}
	});
}
if (IATSERV.linkId == "2011") { //Create Order


	/********************************************
	*
	* Import Patient Data from Local Temp Cache.
	*
	*********************************************/

	const patientDataKeys = {
		Location: '#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbLocation_tbText',
		LocationMenu: "#ui-id-1 .ui-menu-item",
		Physician: '#ddPhysician',
		PhysicianOptions: '#ddPhysician option',
		BillTo: '#MainContent_ctl00_ctl00_ddBillType_ddControl',
		Category: "#MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_ddTestCategory",
		DOC: "#MainContent_ctl00_ctl00_tbCollectionDateTime_tbDate_tbText",
		FirstName: '#tbFirstName',
		LastName: '#tbLastName',
		MiddleName: '#MainContent_ctl00_tbMiddleName',
		DOB: '#MainContent_ctl00_tbDOB_tbText',
		Gender: '#MainContent_ctl00_ddGender_ddControl',
		Race: '#MainContent_ctl00_ddRace_ddControl',
		Address: [
			'#MainContent_ctl00_AddressControl1_tbAddress1',
			'#MainContent_ctl00_AddressControl1_tbAddress2'
		],
		State: '#MainContent_ctl00_AddressControl1_CountryState_ddState',
		City: '#MainContent_ctl00_AddressControl1_tbCity',
		Zip: '#MainContent_ctl00_AddressControl1_tbZipCode',
		Phone: '#MainContent_ctl00_AddressControl1_tbPhone',
		Email: '#MainContent_ctl00_AddressControl1_tbEmail',
		NewPatientBTN: '#btnAddEditPatient'
	};

	const patientDataValueDefaults = {
		Location: "Prince",
		Physician: '1896', //Prince, Laboratories
		BillTo: '3' //Client
	}

	async function pasteRRPatientData() {
		
		//let patientData = {};
		chrome.storage.local.get('patientData', ({ patientData }) => {
			/*Demo Data
			patientData = {
				"Address": "11 Demo dr ",
				"Category": "11", //Immuno
				"City": "DemoCity",
				"DOB": [
					"4",
					"25",
					"2000"
				],
				"DOC": "4/28/2023",
				"Email": "",
				"FirstName": "DemoFirst",
				"Gender": "Male",
				"LastName": "DemoLast",
				"MiddleName": "",
				"Phone": "5551234567",
				"Race": "Caucasian",
				"State": "GA",
				"Zip": "30043"
			};*/

		// Fill in data
		PCX.findEl(patientDataKeys.DOC).value		= patientData.DOC;
		PCX.findEl(patientDataKeys.Category).value	= categoryTranslation[patientData.Category];
		
		pageElements['CategoryOpt']		= PCX.findEl(`${patientDataKeys.Category} option:checked`);
		pageElements['TestCodesInput']	= PCX.findEl("#MainContent_ctl00_ctl00_ctrlTestCodes_tbList_tbText");
		pageElements['TestCodesOutput']	= PCX.findEl("#dvSelectedItems");
		checkTestCat(pageElements.CategoryOpt,{Input: pageElements.TestCodesInput,Output: pageElements.TestCodesOutput},testCategories).then( (elm) => {

			pageElements['NewPatientBTN'] = PCX.findEl(patientDataKeys.NewPatientBTN);
			pageElements.NewPatientBTN.setAttribute('onFocus',"newPatient()");
			pageElements.NewPatientBTN.focus();
			pageElements.NewPatientBTN.setAttribute('onFocus',"");

			waitForElm(".fancybox-overlay.fancybox-overlay-fixed iframe").then( (elm) => {
				PCX.findEl(".fancybox-overlay.fancybox-overlay-fixed iframe").addEventListener('load', (el) => {
					pageElements["FirstName"]	= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.FirstName);
					pageElements["LastName"]	= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.LastName);
					pageElements["MiddleName"]	= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.MiddleName);
					pageElements["DOB"]			= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.DOB);
					pageElements["Gender"]		= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.Gender);
					pageElements["Race"]		= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.Race);
					pageElements["Address"]		= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.Address);
					pageElements["State"]		= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.State);
					pageElements["City"]		= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.City);
					pageElements["Zip"]			= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.Zip);
					pageElements["Phone"]		= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.Phone);
					pageElements["Email"]		= PCX.findEl('[class="fancybox-iframe"').contentWindow.document.querySelector(patientDataKeys.Email);
					

					pageElements.FirstName.value	= patientData.FirstName;
					pageElements.LastName.value		= patientData.LastName;
					pageElements.MiddleName.value	= patientData.MiddleName;
					pageElements.DOB.value			= patientData.DOB.join('/');
					pageElements.Gender.value		= genderTranslate[patientData.Gender];
					pageElements.Race.value			= raceTranslate[patientData.Race];
					pageElements.Address.value		= patientData.Address;
					pageElements.State.value		= patientData.State;
					pageElements.City.value			= patientData.City;
					pageElements.Zip.value			= patientData.Zip;
					pageElements.Phone.value		= patientData.Phone;
					pageElements.Email.value		= patientData.Email;

					pageElements.DOB.focus();
					pageElements.DOB.dispatchEvent(eventKeyTab);
				});
			});
		});
		if (patientData) {
				// Clear the patient data after usage
				chrome.storage.local.set({ patientData: {} }, () => {
					console.log('RR Patient data cleared after use');
					PCX.findEl('#patientDataBanner').remove();
				});
			}
		});
	}


	PCX.findEl('#MainContent_ctl00_ctl00_upPanel').addEventListener('change', (e) => {
		// Ping reloaded Elements
		pageElements['CategoryOpt']		= PCX.findEl(`${patientDataKeys.Category} option:checked`);
		pageElements['TestCodesInput']	= PCX.findEl("#MainContent_ctl00_ctl00_ctrlTestCodes_tbList_tbText");
		pageElements['TestCodesOutput']	= PCX.findEl("#dvSelectedItems");
		if (e.target && e.target.id === patientDataKeys.Category.replace('#','')) {
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
			pageElements['TestCodesInput']	= elTestCodes.Input = PCX.findEl("#MainContent_ctl00_ctl00_ctrlTestCodes_tbList_tbText")
			elTestCodes.Input.dispatchEvent(eventKeyEnd);
			await delay(500);
			elTestCodes.Input.dispatchEvent(eventKeyTab);
		}
	}

	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.action === 'startCountdownBanner') {
			// If the banner is already present, don't recreate it
			if (PCX.findEl('#patientDataBanner')) {
				PCX.findEl('#patientDataBanner').remove();
			}
			initializeBanner(
				message.patientData,
				90,
				() => {
					const rrButton = document.createElement('span');
					rrButton.textContent	= 'Paste Patient Data';
					rrButton.id 			= "patientDataClone";

					const patientDataBanner = PCX.findEl('#patientDataBanner');

					PCX.findEl("#patientDataBanner").appendChild(rrButton);

					PCX.findEl("#patientDataClone").addEventListener('click', function(event) {
						pasteRRPatientData();
					});
				}
			);
		}
	});

// Prefill Location and Physician
	waitForElm(patientDataKeys.Location).then((elm) => {
		PCX.findEl(patientDataKeys.Location).value = patientDataValueDefaults.Location;
		PCX.findEl(patientDataKeys.Location).dispatchEvent(eventKeySpace);
		waitForElm(patientDataKeys.LocationMenu).then((elm) => {
			PCX.findEl(patientDataKeys.Location).dispatchEvent(eventKeyTab);
			waitForElm(patientDataKeys.PhysicianOptions).then((elm) => {
				PCX.findEl(patientDataKeys.Physician).value = patientDataValueDefaults.Physician;
				PCX.findEl("#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbPhysicianId").value = 1896;
				PCX.findEl("#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbPhysicianName").value = "Prince, Laboratories";
			})
		});
	});
	PCX.findEl(patientDataKeys.BillTo).value = patientDataValueDefaults.BillTo;
	PCX.findEl(patientDataKeys.Category).focus();
}

// Shared enhancments linkId: 2011 & 2071
function setStablityNotice(stabilityDate,existingAcs = false) {
	if(stabilityDate == "") {return;}
	let stabilityAge = Math.floor(
		(new Date() - new Date(stabilityDate)) / (1000 * 60 * 60 * 24)
	);

	let stabilityText	= "";
	let stabilityPhase	= "";
	if(stabilityAge >= 180){
		stabilityText	= `Expired`;
		stabilityPhase	= "phaseFour";
	}else if(stabilityAge > 88){
		stabilityText	= `${stabilityAge} Days Old`;
		stabilityPhase	= "phaseThree";
	}else if(stabilityAge > 27){
		stabilityText	= `${stabilityAge} Days Old`;
		stabilityPhase	= "phaseTwo";
	}else{
		stabilityText	= `${stabilityAge} Days Old`;
		stabilityPhase	= "phaseOne";
	}

	if(!PCX.findEl('#stabilityNotice')) {
		const stabilityNotice = document.createElement("div");
			stabilityNotice.innerHTML = `<span class="QAManagerSubHeading">Sample Stability</span><span id="stabilityNoticeAge"></span>`;
			stabilityNotice.id = "stabilityNotice";
		PCX.findEl('.dos').appendChild(stabilityNotice);
	}
	PCX.findEl('#stabilityNoticeAge').textContent = stabilityText;
	PCX.findEl('#stabilityNotice').classList = stabilityPhase + (existingAcs?" stabilityNoticeExistingACS":"");
}