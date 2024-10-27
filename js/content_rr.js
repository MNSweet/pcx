console.log("This is RR specific content script.");




///
// Page IDs
// Update Accession:  LinkId=2071
// Create Accession:  LinkId=2088
// Create Order:      LinkId=2011 && !OrderId=#
///

const linkId = PCX_CMSInteraction.getUrlParams()['LinkId'];
const OrderId = PCX_CMSInteraction.getUrlParams()['OrderId'];

// Results List
if (linkId == "2024") {
	// Function to handle the click event and get the row data
	function handleDownloadClick(event) {
		//event.preventDefault(); // Prevent the default link behavior [For testing, should be commented out]

		const headings = document.getElementById('MainContent_ctl00_grid_DXHeadersRow0').textContent.replaceAll('\t','').replaceAll('\n','').split(" ");
		// Check if the clicked element or one of its parents is the <a> with title "Download Result"
		const clickedLink = event.target.closest('a[title="Download Result"]');

		// If the clicked element matches the <a> tag we care about
		if (clickedLink) {
			// Find the parent <tr> for the clicked <a>
			const row = clickedLink.closest('tr');

			// Collect the text content of all <td> elements in the row into an array
			const rowData = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
			//console.log(row.querySelector('td:first-child'));
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
			PCX_CMSInteraction.copyToClipboard(handleDownloadClick(event));
		}
	});
}
if (linkId == "2011" && (typeof OrderId == undefined)) { //Create Order


	/********************************************
	*
	* Import Patient Data from Local Temp Cache.
	*
	*********************************************/

	// content_rr.js
	const fieldMappingRR = {
		FirstName: '#rrFirstName',
		LastName: '#rrLastName',
		// Add more mappings as needed
	};

	function pasteRRPatientData() {
		chrome.storage.local.get('patientData', ({ patientData }) => {

			//Demo Data
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
			}

			if (patientData) {

				// Clear the patient data after usage
				chrome.storage.local.set({ patientData: {} }, () => {
					console.log('RR Patient data cleared after use');
				});
			}
		});
	}

	// Add a button to paste RR patient data
	const rrButton = document.createElement('button');
	rrButton.textContent = 'Paste Patient Data';
	rrButton.style.cssText = 'position:fixed; bottom:10px; right:10px; z-index:1000;';
	rrButton.onclick = pasteRRPatientData;
	//document.body.appendChild(rrButton);


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
		Gender: '#MainContent_ctl00_ddGender_ddControl option:checked',
		Race: '#MainContent_ctl00_ddGender_ddControl option:checked',
		Address: [
			'#MainContent_ctl00_AddressControl1_tbAddress1',
			'#MainContent_ctl00_AddressControl1_tbAddress2'
		],
		State: '#MainContent_ctl00_AddressControl1_CountryState_ddState option:checked',
		City: '#MainContent_ctl00_AddressControl1_tbCity',
		Zip: '#MainContent_ctl00_AddressControl1_tbZipCode',
		Phone: '#MainContent_ctl00_AddressControl1_tbPhone',
		Email: '#MainContent_ctl00_AddressControl1_tbEmail'
	};

	const patientDataValueDefaults = {
		Location: "Prince",
		Physician: '1896', //Prince, Laboratories
		BillTo: '3' //Client

	}

	/**
	 * PR | Category              | PL
	 *  - | Core Laboratory       | 6
	 *  - | Cultures              | 7
	 *  - | Dermatology           | 10
	 *  - | Cytology              | 11
	 *  - | Histology             | 12
	 *  - | Urology               | 13
	 *  - | Nail Fungal           | 14
	 *  - | Pathology             | 15
	 *  3 | PGX                   | 16
	 *  4 | CGX NGS               | 17
	 * 11 | Immuno NGS            | 18
	 * 17 | Cardio NGS            | 19
	 * 14 | Eye NGS               | 20
	 * 12 | Neuro NGS             | 21
	 * 15 | Thyroid NGS           | 22
	 *  1 | Toxicology            | 23
	 *  - | Clinical              | 24
	 *  5 | STI                   | 25
	 *  6 | UTI                   | 26
	 *  8 | Wound                 | 27
	 * 13 | Respiratory Pathogens | 28
	 *  - | GI                    | 29
	 *  9 | COVID-19              | 30
	 *  - | Hereditary Metabolic Disorder NGS | 31
	 *  7 | HPV                   | -
	 * 16 | Diabetes              | -
	 */
	
	categoryTranslation = {
		3:16,  // PGX
		4:17,  // CGX
		11:18, // Immuno
		17:19, // Cardio
		14:20, // Eyes
		12:21, // Neuro
		15:22, // Thyroid
		1:23,  // Toxicology
		5:25,  // STI
		6:26,  // UTI
		8:27,  // Wound
		13:28, // RPP
		9:30,  // COVID
		7:-1,  // HPV
		16:-1  // Diabetes
	};

	chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
		if (message.action === 'startCountdownBanner') {
			// If the banner is already present, don't recreate it
			if (!document.querySelector('#patientDataBanner')) {
				initializeBanner(message.patientData);
			}
		}
	});

	// Prefill Location and Physician
	const eventKeySpace = new KeyboardEvent('keydown', { key: ' ', bubbles: true });
	const eventKeyTab = new KeyboardEvent('keydown', { bubbles: true, cancelable : true, key : "Tab",shiftKey : false, keyCode : 13 });
	waitForElm(patientDataKeys.Location).then((elm) => {
		document.querySelector(patientDataKeys.Location).value = patientDataValueDefaults.Location;
		document.querySelector(patientDataKeys.Location).dispatchEvent(eventKeySpace);
		waitForElm(patientDataKeys.LocationMenu).then((elm) => {
			document.querySelector(patientDataKeys.Location).dispatchEvent(eventKeyTab);
			waitForElm(patientDataKeys.PhysicianOptions).then((elm) => {
				document.querySelector(patientDataKeys.Physician).value = patientDataValueDefaults.Physician;
				document.querySelector("#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbPhysicianId").value = 1896;
				document.querySelector("#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbPhysicianName").value = "Prince, Laboratories";
				 
				 
			})
		});
	});
	document.querySelector(patientDataKeys.BillTo).value = patientDataValueDefaults.BillTo;
	document.querySelector(patientDataKeys.Category).focus();
}
