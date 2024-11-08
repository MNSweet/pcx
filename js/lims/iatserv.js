PCX.log("IATServ LIMS");
class IATSERV {
/**
 *
 * PREP Variables/Constants
 *
 * @param INT					linkId
 * @param EVENT KEYDOWN[END]	eventKeyEnd		Simulated keypress of "End"
 * @param EVENT KEYDOWN[SPACE]	eventKeySpace	Simulated keypress of "Space"
 * @param EVENT KEYDOWN[TAB]	eventKeyTab		Simulated keypress of "Tab"
 * @param OBJ					labs			Lookup table for Labs by DB ID's
 * @param OBJ					testCategories	Lookup table for Test Categories by DB ID's
 * 
 */
 	static linkId = PCX.getUrlParams()['LinkId'];

	// Lab Lookup Table
	#labs = {};

	// Test Categories / Codes Lookup Table
	#testCategories = {};

	static selectors = {};

	static setTestCategories(testCats){
		if(typeof testCats == "object"){
			this.testCategories = testCats;
		}
	}

	static setLabs(labs){
		if(typeof labs == "object"){
			this.labs = labs;
		}
	}

	static setSelectors(selector){
		if(typeof selector == "object"){
			IATSERV.selectors = selector;
		}
	}




/*************************************************************************************
 *
 * Page Templete: 	Accession List
 * linkId:			2070
 *
 * Search for Accession by
 * 		Date [Received|Collected|Resulted|Created], Date Range, Status, Sub Status,
 * 		Test Category, Accession, Requisition, Batch# , First / Last Name, DOB,
 * 		Location, Physician, External ID, Source, Billing Status, Result Entry Status,
 * 		Priority
 *
 * Column Headings available:
 * 		Accession, AcsNo, Alt ID 1, Alt ID 2, Alt ID 3, Batch, Bill Type, Billing Status,
 * 		Code, Collection Date, Created Date, Created Date Time, DOB, Entered First Reported,
 * 		Gender, Pat Email, Pat Phone, Patient, Pending Test Count, Performing Lab,
 * 		Performing Lab Count, Performing Lab Level, Physician, Primary Insurance, Priority,
 * 		Process Date, Processing Days, Processing Hours, Location, Received, Released Date,
 * 		Report Generation Status, Reported, Requisition, Result Status, Secondary Insurance,
 * 		Source, Specimens, Status, Sub Status, Test Category, Tests
 * 
 *************************************************************************************/


     
	/**
	 * columnParser
	 *
	 * @param 			ARRAY	headings				List of all current headings displayed by the search listing
	 * @requiredParam	STRING	headings['Accession']	Column contains the system ID needed to build all URLS
	 *
	 * @process			IF 		Results Link 			Locates 'Alt ID 1' if available and builds a Results link
	 * @process			IF 		PreAuth Link 			Locates 'Alt ID 2' if available and builds a PreAuth link
	 * @process			IF 		-- 		Link 			Locates 'Alt ID 3' if available and builds a -- link / Unused
	 * 
	 */
	static columnParser() {
		let headingRow = PCX.getEl('#MainContent_ctl00_grid_DXHeadersRow0',true);
		if(!headingRow){return;}
		let headings = headingRow.textContent.replaceAll('\t','').replaceAll('\n','').split(" ");
		
		const overrides = [
			{heading:"Alt ID 1",linkId:2461,text:"Results"},
			{heading:"Alt ID 2",linkId:7006,text:"PreAuth"},
			{heading:"Alt ID 3",linkId:0,text:""} // Available
		]

		for (const [i,column] of Object.entries(overrides)) {
			if (headings.includes(column.heading) && headings.includes('Accession')) {
				let rowData = document.querySelectorAll('.dxgvDataRow_Metropolis');
				if(rowData.length){
					rowData.forEach((row) => {
						let accessionID = row.querySelector('td:nth-child('+(headings.indexOf('Accession')+1)+') a').getAttribute('onclick').replace(/ShowForm\((\d*),this\)/i,'$1');
						let columnLinkTD = row.querySelector('td:nth-child('+(headings.indexOf(column.heading)+1)+')');

						columnLinkTD.innerHTML = `<a href="https://prince.iatserv.com/?LinkId=${column.linkId}&AccessionId=${accessionID}" target="_blank">${column.text}</a>`
					});
					PCX.getEl('#MainContent_ctl00_grid_DXHeadersRow0 td:nth-child('+(headings.indexOf(column.heading)+1)+ ')',true).textContent = column.text;
				}
			}
		}	
	}




/*************************************************************************************
 *
 * Page Templete: 	Create Accession List (type=acs) & Create Orders
 * linkId:			2011
 * 
 * Page Templete: 	Update Accession List
 * linkId:			2071
 *
 * 
 * 
 *************************************************************************************/

// Create Accession (type=acs) & Create Orders

	/**
	 * createAccession
	 * 
	 * Set Default Inputs
	 *
	 * @elementValue	INT			BillType	1			"Primary Insurance"
	 * @elementValue	STRING		Status		Received
	 *
	 * @elementState	DISABLED	#btnAddEditPatient
	 *
	 * @listener		CLICK		selectors.newPatientBtn
	 *	@promise		LOAD		selectors.FancyBox
	 *	 @promise		LOAD		selectors.FancyBox[selectors.IframeDOB]
	 *	  @listener		BLUR		selectors.FancyBox[selectors.IframeDOB]
	 *	  @listener		SUBMIT		selectors.FancyBox[selectors.IframeForm]
	 * @listener		BLUR		selectors.locationInput
	 *  @promise		LOAD		selectors.PhysicianOptions
	 * @listener		CHANGE		selectors.UpPanel
	 * @listener		BLUR		selectors.UpPanel
	 *
	 * @function		async		checkTestCat()
	 * 
	 */
	static createAccession() {

		const el = IATSERV.selectors;

		// Set Bill Type to Primary Insurance as default
		PCX.getEl(el.BillType).value = 1;
		// Set Status to Received as default
		PCX.getEl(el.Status).value = "Received";

		PCX.getEl(el.newPatientBtn).addEventListener('click', async (eventPtBtnClick) => {
			waitForElm(el.FancyBox).then( (elementLoaded) => {
				waitForIframeElm(el.FancyBox,el.IframeDOB).then( (elementIframeLoaded) => {
					// Date of Birth Checks
					let inputDOB = PCX.getEl(el.FancyBox,true).contentWindow.document.querySelector(el.IframeDOB);
					let minorDate = new Date();
						minorDate.setFullYear(minorDate.getFullYear() - 18);
					let docAttempt 	 = 0;
					let docLastValue = '';
					inputDOB.addEventListener('blur', (e) => {
						let docAttempt 	 = 0;
						const docIntervalId = setInterval(() => { // Wait for date picker
							if (e.target.value !== docLastValue) {
								docLastValue = e.target.value;
								clearInterval(docIntervalId);

								let dob = e.target.value;
								if(Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= Date.now()){
									QAManager.addNotice("DOB","It seems that your patient hasn't been born yet. Is this birthday correct? " + dob);
								}else if(Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= minorDate.getTime()){ // 18+ Minor check
									QAManager.addNotice("DOB","Intesting, your patient is a minor. Just a quick check. Is this birthday correct? " + dob);
								}else if(Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= 946702800000){ //Jan 1 2000
									QAManager.addNotice("DOB","Just being vigilant, Though I may be wrong: Is this birthday correct? " + dob);
								}else {
									QAManager.removeNotice("DOB");
								}
							}
							if (++docAttempt >= 5) {
								clearInterval(docIntervalId);
							}
						}, 100);
					});
					PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.IframeForm).addEventListener('submit', (eventSubmit) => {
						if(QAManager.getNoticeCount() > 0) {
							eventSubmit.preventDefault()
							QAManager.showQAModalNotification();
						}
					});

				});
				
			});
		});

		// Disable Create Patient Button if no location is set
		PCX.getEl(el.newPatientBtn).classList.add("disabled");
		PCX.getEl(el.locationInput).addEventListener("blur", (event) => {
			if(event.target.value != "" && PCX.getEl(el.newPatientBtn).classList.contains("disabled")) {
				if(event.target.value.match("^(AM-|CTD-).*")){
					waitForElm(el.PhysicianOptions).then((elm) => {
						PCX.getEl(el.Physician,true).innerHTML = `<option value="0" disabled selected hidden>Select a Physician</option>`+PCX.getEl(el.Physician).innerHTML;
						PCX.getEl(el.PhysicianId,true).value = "";
						PCX.getEl(el.PhysicianName,true).value = "";
					});
				}
				PCX.getEl(el.newPatientBtn).classList.remove("disabled");
			}else if(event.target.value == "" && !PCX.getEl(el.newPatientBtn).classList.contains("disabled")){
				PCX.getEl(el.newPatientBtn).classList.add("disabled");
			}
		});

		// CHANGE
		PCX.getEl(el.UpPanel).addEventListener('change', (e) => {
			if (e.target && e.target.id === el.CategoryOpt) {
				checkTestCat(PCX.getEl(el.CategoryOpt,true),{Input: PCX.getEl(el.TestCodesInput,true),Output: PCX.getEl(el.TestCodesOutput,true)},IATSERV.testCategories);
			}
		});

		// BLUR
		PCX.getEl(el.UpPanel).addEventListener('blur', (e) => {
			if (e.target && e.target.id === el.DOC) {
				let attempt = 0;
				let lastValue = '';
				const intervalId = setInterval(() => {
					if (PCX.getEl(el.DOC,true).value !== lastValue) {
						setStablityNotice(el.DOS,PCX.getEl(el.DOC).value)
						lastValue = PCX.getEl(el.DOC).value;
						clearInterval(intervalId);
					}
					if (++attempt >= 5) {
						clearInterval(intervalId);
					}
				}, 100);
			}
		},true);

		async function checkTestCat(elCategory,elTestCodes,testCategories){
			if(
				elCategory.value != "" &&
				elTestCodes.Output.querySelectorAll('.item').length <= 0
			) {
				elTestCodes.Input.value = testCategories[elCategory.value].Test;
				await delay(1000);
				elTestCodes.Input = PCX.getEl(el.TestCodesInput,true);
				elTestCodes.Input.dispatchEvent(eventKeyEnd);
				await delay(500);
				elTestCodes.Input.dispatchEvent(eventKeyTab);
				QAManager.setStablityNotice(PCX.getEl(el.DOC,true).value);
			}
		}
	}


	/**
 * 
 * Reference Lab Transfer Assist
 * 
 */
	static capturePTData() {

		const el = IATSERV.selectors;

		// Temp Capture was already discussed with Dean and as long as 
		// it never leaves the browser/local, it's HIPAA compliant.
		// Fn initializeBanner() immediately takes the data after 
		// being added to local storage and sets a deletion timer to purge
		// the data from cache and local storage, never saving to hard disk
		const patientData = {
			Category:	PCX.getEl(el.CategoryOpt).value,
			DOC:		PCX.getEl(el.DOC).value,
			FirstName:	PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.FirstName).value,
			LastName:	PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.LastName).value,
			MiddleName:	PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.MiddleName).value,
			DOB:		PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.DOB).value.split('/'),
			Gender:		PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.Gender).textContent,
			Race:		PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.Race).textContent,
			Address:	PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.Address1).value + ' ' + PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.Address2).value,
			State:		PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.State).value,
			City:		PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.City).value,
			Zip:		PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.Zip).value,
			Phone:		PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.Phone).value,
			Email:		PCX.getEl(el.Iframe).contentWindow.document.querySelector(el.Email).value
		};

		// Store patient data in Chrome's storage
		chrome.storage.local.set({ patientData }, () => {
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


		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			if (message.action === 'startCountdownBanner') {
			// If the banner is already present, don't recreate it
				if (!PCX.getEl('#patientDataBanner')) {
					initializeBanner(message.patientData);
				}
			}
		});
	}
}