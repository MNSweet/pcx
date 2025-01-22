PCX.log("IATServ LIMS");

// Fix Spelling Mistake
if(document.querySelector("#mnu_8")){
	document.querySelector("#mnu_8").innerHTML = document.querySelector("#mnu_8").innerHTML.replace("Bach","Batch");
}

// Fix function not found error from lims
if(typeof replace !== "function") {
	function replace(string, search, replaceWith) {
		return string.replace(search,replaceWith);
	}
}

class IATSERV {
/**
 *
 * PREP Variables/Constants
 *
 * @param INT	linkId
 * @param OBJ	labs			Lookup table for Labs by DB ID's
 * @param OBJ	testCategories	Lookup table for Test Categories by DB ID's
 * 
 */
 	static linkId	= PCX.getUrlParams()['LinkId'];
 	static orderId	= PCX.getUrlParams()['OrderId'];
 	static type		= PCX.getUrlParams()['type'];

 	static noticeDisplay = "#noticeDisplay";

	// Lab Lookup Table
	static labs = {};

	// Test Categories / Codes Lookup Table
	static testCategories = {};

	// Translation Lookup Table for Prince Laboratories to Reference Lab
	static categoryTranslation = {};
	static genderTranslation = {};
	static raceTranslation = {};
	static orderDefaults = {};

	// Element DOM Selectors
	static selectors = {};

	static setTestCategories(testCats){
		if(typeof testCats == "object"){
			IATSERV.testCategories = testCats;
		}
	}

	static setCategoryTranslation(catTranslation){
		if(typeof catTranslation == "object"){
			IATSERV.categoryTranslation = catTranslation;
		}
	}

	static setGenderTranslation(genderTranslation){
		if(typeof genderTranslation == "object"){
			IATSERV.genderTranslation = genderTranslation;
		}
	}

	static setRaceTranslation(raceTranslation){
		if(typeof raceTranslation == "object"){
			IATSERV.raceTranslation = raceTranslation;
		}
	}

	static setLabs(labs){
		if(typeof labs == "object"){
			IATSERV.labs = labs;
		}
	}

	static setSelectors(selector){
		if(typeof selector == "object"){
			IATSERV.selectors = selector;
		}
	}

	static setOrderDefaults(orderDefaults){
		if(typeof orderDefaults == "object"){
			IATSERV.orderDefaults = orderDefaults;
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
			{heading:"Alt ID 2",linkId:0,text:""},
			{heading:"Alt ID 3",linkId:0,text:""} // Available
		]

		for (const [i,column] of Object.entries(overrides)) {
			let rowData = document.querySelectorAll('.dxgvDataRow_Metropolis');
			if(rowData.length){
				rowData.forEach((row) => {
					row.querySelectorAll('.dxgv').forEach((td)=>{
						let text = td.innerText.replace(/[^a-zA-Z0-9]/g, "");
						if(text == "") {return;}
						td.classList.add(text);
					});
   
					if (headings.includes(column.heading) && headings.includes('Accession')) {
						let accessionID = row.querySelector('td:nth-child('+(headings.indexOf('Accession')+1)+') a').getAttribute('onclick').replace(/ShowForm\((\d*),this\)/i,'$1');
						let columnLinkTD = row.querySelector('td:nth-child('+(headings.indexOf(column.heading)+1)+')');

						columnLinkTD.innerHTML = `<a href="/?LinkId=${column.linkId}&AccessionId=${accessionID}" target="_blank">${column.text}</a>`
					}
				});
				if (headings.includes(column.heading) && headings.includes('Accession')) {
					PCX.getEl('#MainContent_ctl00_grid_DXHeadersRow0 td:nth-child('+(headings.indexOf(column.heading)+1)+ ')',true).textContent = column.text;
				}
			}
		}	
	}



	static columnReportsParser() {
		//console.log("columnReportsParser");
		let count = document.querySelectorAll('[id^=MainContent_ctl00_grid_tccell]:not(.processCopyTo)').length;

		if(count <= 0){ return; }
		document.querySelectorAll('[id^=MainContent_ctl00_grid_tccell]').forEach((asc) => {
			if(!asc.classList.contains('processCopyTo')){
		//console.log(asc);
				asc.classList.add('processCopyTo');
				
				const copyTo = PCX.createDOM("span", {});
				copyTo.innerText = "📋 ";
				asc.innerHTML = copyTo.outerHTML + asc.innerHTML;
				if(count == 1){
					let quickClipboard = asc.querySelector('a').innerText + "\t" + asc.nextSibling.innerText;
					console.log(quickClipboard);
					PCX.copyToClipboard(quickClipboard);
				}
				asc.querySelector('span').addEventListener('click', (e)=>{
					let td = e.target.parentNode;
					//console.log(td);
					let clipboard = td.querySelector('a').innerText + "\t" + td.nextSibling.innerText;
					console.log(clipboard);
					PCX.copyToClipboard(clipboard);
				});
			}
		});
	}
/*************************************************************************************
 *
 * Page Templete: 	Location List
 * linkId:			2004
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
	 * columnLocationParser
	 *
	 * @param 			ARRAY	headings				List of all current headings displayed by the search listing
	 * @requiredParam	STRING	headings['Accession']	Column contains the system ID needed to build all URLS
	 *
	 * @process			IF 		Results Link 			Locates 'Alt ID 1' if available and builds a Results link
	 * @process			IF 		PreAuth Link 			Locates 'Alt ID 2' if available and builds a PreAuth link
	 * @process			IF 		-- 		Link 			Locates 'Alt ID 3' if available and builds a -- link / Unused
	 * 
	 */
	static columnLocationParser() {
		let headingRow = PCX.getEl('#MainContent_ctl00_grid_DXHeadersRow0',true);
		if(!headingRow){console.log('not found'); return;}
		let headings = headingRow.textContent.replaceAll('\t','').replaceAll('\n','').split(" ");
		
		const overrides = [
			{heading:"ID1",linkId:2005,text:"Delivery"},
			{heading:"ID2",linkId:0,text:""},
			{heading:"ID3",linkId:0,text:""} // Available
		]

		for (const [i,column] of Object.entries(overrides)) {
			if (headings.includes(column.heading) && headings.includes('Code')) {
				let rowData = document.querySelectorAll('.dxgvDataRow_Metropolis');
				if(rowData.length){
					rowData.forEach((row) => {
						let locationID = row.querySelector('td:nth-child('+(headings.indexOf('Code')+1)+') a').getAttribute('onclick').replace(/ShowForm\((\d*)\)/i,'$1');
						let columnLinkTD = row.querySelector('td:nth-child('+(headings.indexOf(column.heading)+1)+')');
						let link = PCX.createDOM("a",{class:"delivery",href:"javascript:ShowForm("+locationID+");"});
						link.addEventListener('click', ()=>{
							waitForElm(".fancybox-iframe").then((iframe)=> {
								waitForIframeElm(".fancybox-iframe",'[href="#delivery"]').then((link)=> {
									console.log('found');
									PCX.getEl(".fancybox-iframe",true).contentWindow.document.querySelector('[href="#delivery"]').click();
								});
							});
						});
						link.innerHTML = column.text;
						columnLinkTD.appendChild(link);
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

	/**
	 * checkTestCat
	 * @param  DOM	elCategory
	 * @param  DOM	elTestCodes
	 * @param  OBJ	testCategories
	 */
	static async checkTestCat(elCategory,elTestCodes,testCategories){
		//PCX.processEnabled("Automation_CheckTestCategoryForCodes",true);
		const el = IATSERV.selectors;
			// The website developer creates new autocompletes with each call with no garbage collections. This cleans up old lists
			[...document.querySelectorAll('.ui-menu.ui-widget.ui-widget-content.ui-autocomplete.ui-front.autocomplete-ul')].forEach(ul => {
				let sibling = ul.nextSibling;
				if (sibling.classList.contains('ui-helper-hidden-accessible')) {sibling.remove();}
				ul.remove();
			});
			document.querySelector('#MainContent_ctl00_ctl00_upPanel').addEventListener('load',watchForLaterNode,true);
			function watchForLaterNode(evt) {
				if(evt.target.nodeName == "STYLE") {
					elTestCodes.Input = PCX.getEl("#"+elTestCodes.Input.id,true);
					elTestCodes.Input.value = testCategories[elCategory.value].Test;
					PCX.simulateUserKey(elTestCodes.Input,PCX.events.End,"keydown");
					waitForElm('[id^="ui-id-"][style^="z-index"].autocomplete-ul').then(()=>{
						PCX.simulateUserKey(elTestCodes.Input,PCX.events.Tab,"keydown");
						
						//if(PCX.processEnabled("Automation_SetLabByTestCode",true)) {
							PCX.getEl(el.PreformingLab,true).value = testCategories[elCategory.value].LabCode;
							PCX.getEl(el.PreformingLab,true).dispatchEvent(new Event('change'));
						//}

			PCX.getEl(el.ICDCodesInput+"~.body",true).insertAdjacentHTML("afterbegin",`<div id="icdCodePreviewer"></div>`);
						PCX.getEl(el.UpPanel).addEventListener('change', IATSERV.upPanelChange);
					});
					document.querySelector('#MainContent_ctl00_ctl00_upPanel').removeEventListener('load',watchForLaterNode,true);
				}
			}
			QAManager.setStablityNotice(el.DOS,PCX.getEl(el.DOC,true).value);
			PCX.getEl(el.ICDCodesInput+"~.body",true).insertAdjacentHTML("afterbegin",`<div id="icdCodePreviewer"></div>`);
	}

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

		PCX.getEl(el.newPatientBtn,true).addEventListener('click', IATSERV.newPatientBtn);

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
		PCX.getEl(el.UpPanel).addEventListener('change', IATSERV.upPanelChange);


		// BLUR
		PCX.getEl(el.UpPanel).addEventListener('blur', (e) => {
			if (e.target && "#"+e.target.id === el.DOC) {
				let attempt = 0;
				let lastValue = '';
				const intervalId = setInterval(() => {
					if (PCX.getEl(el.DOC,true).value !== lastValue) {
						QAManager.setStablityNotice(el.DOS,PCX.getEl(el.DOC).value)
						lastValue = PCX.getEl(el.DOC).value;
						clearInterval(intervalId);
					}
					if (++attempt >= 5) {
						clearInterval(intervalId);
					}
				}, 100);
			}
		},true);

		PCX.getEl(el.ICDCodesInput+"~.body",true).insertAdjacentHTML("afterbegin",`<div id="icdCodePreviewer"></div>`);
		let observer = new MutationObserver(()=>{});
		PCX.getEl(el.UpPanel,true).addEventListener('keydown', async (e) => {
			if (e.target && "#"+e.target.id === el.ICDCodesInput && (e.key == "Enter" || e.key == "Tab")) {
				const targetElement = PCX.getEl(el.ICDCodesInput+"~#dvCount #lblCount",true); // Select the element you want to monitor
				observer.disconnect()
				observer = new MutationObserver((mutations) => {
					let icdCodes = Array.from(PCX.getEls(el.ICDCodesInput+"~.body #dvSelectedItems #xv_param",true)).reverse();
					PCX.getEl("#icdCodePreviewer",true).innerHTML = `<span class="icdCode">` + icdCodes.map((element)=>{return element.value;}).join(`</span><span class="icdCode">`) + `</span>`;	
				});
				observer.observe(targetElement, { childList: true });
			}
		},true);

		const removeTabIndexSelectors = [
			el.SearchPatient, el.PatientCode, el.PatientDOB, el.PatientAddress, el.PatientPhone, 
			el.PatientEmail, el.PrimaryInsurance, el.PrimaryInsurancePolicy, el.PrimaryInsuranceGroup, 
			el.SecondaryInsurance, el.SecondaryInsurancePolicy, el.SecondaryInsuranceGroup, el.SpecimenType, 
			el.Quantity, el.Requisition, el.DOCTime, el.ReceivedDate, el.ReceivedTime, el.ClearBTN, el.Medication,
			el.MedicationBTN, el.OtherMedication, el.PhySigCaptured, el.PTSigCaptured, el.SigSuccess, el.SigClear, el.SigToggle
		];
		PCX.disableTabIndex(removeTabIndexSelectors);
	}

	static upPanelChange(e) {
		const el = IATSERV.selectors;
		if (e.target && "#"+e.target.id === el.Category) {
			IATSERV.checkTestCat(PCX.getEl(el.Category,true),{Input: PCX.getEl(el.TestCodesInput,true),Output: PCX.getEl(el.TestCodesOutput,true)},IATSERV.testCategories);
			PCX.getEl(el.newPatientBtn,true).addEventListener('click', IATSERV.newPatientBtn);
		}
	}

	static showSignaturesBTN(){
		document.body.classList.add('nosignature');
		let showSignatureBTN = PCX.createDOM("div", {id:"showSignature",innerText:"Show Signature Section",classList:"form-group col-lg-1 new-row btn btn-default"});
		showSignatureBTN.addEventListener("click",()=>{
			document.body.classList.remove('nosignature');
			document.body.classList.add('signature');
		});
		PCX.getEl("#MainContent_ctl00_ctl00_PlacePhysicianAuthorizeText",true)
			.insertAdjacentElement("beforebegin",showSignatureBTN);
	}

	static async newPatientBtn(eventPtBtnClick) {
		const el = IATSERV.selectors;
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
				PCX.getEl(el.FancyBox).contentWindow.document.querySelectorAll(el.StateDropdown+' option').forEach((option)=>{
					//option.dataset.name = option.innerText;
					if(["","AA","AE","AP"].includes(option.value)){return;}
					option.innerText = option.value + " - " + option.innerText;
				});
if(true){//just in case to disabled it quickly
				let stateDropdown = PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.StateDropdown);
				PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.InsuranceLookup).addEventListener('focus',(e)=>{
					let input = e.target;
					if(stateDropdown.value == "" || !(stateDropdown.value in IATSERV.insuranceLookUp)) {return;}
					input.placeholder = IATSERV.insuranceLookUp[stateDropdown.value].name;
					
				});
				PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.InsuranceLookup).addEventListener('blur',(e)=>{
					let input = e.target;
					if(
						stateDropdown.value == ""
						|| !(stateDropdown.value in IATSERV.insuranceLookUp)
						|| input.value != ""
						|| input.placeholder == "Insurance"
					) {
						return;
					}

					// Prevent data desync between interaction states
					if (input.placeholder == IATSERV.insuranceLookUp[stateDropdown.value].name) {
						input.value = input.placeholder;
						PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.InsuranceID).value = IATSERV.insuranceLookUp[stateDropdown.value].id;
					}
					input.placeholder = "Insurance";
				});
};

				const removeIframeTabIndexSelectors = [
					el.SSN, el.LicenseState, el.LicenseNumber, el.CopyColumnBTN1, el.CopyColumnBTN2,
					el.CopyColumnBTN3, el.CopyColumnBTN4, el.PrimeRelation, 
					el.PrimeFirstName, el.PrimeLastName, el.PrimeMiddleName, el.PrimeDOB, el.PrimeSSN,
					el.PrimeGender, el.PrimeGroupNo, el.PrimeCovStart, el.PrimeCovEnd, el.PrimeAddress1,
					el.PrimeAddress2, el.PrimeState, el.PrimeCity, el.PrimeZip, el.PrimePhone, el.PrimeFax,
					el.PrimeEmail, el.SeconRelation, el.SeconFirstName, el.SeconLastName, el.SeconMiddleName,
					el.SeconDOB, el.SeconSSN, el.SeconGender, el.SeconGroupNo, el.SeconCovStart, el.SeconCovEnd, 
					el.Seconddress1, el.Seconddress2, el.SeconState, el.SeconCity, el.SeconZip, el.SeconPhone, 
					el.SeconFax, el.SeconEmail, el.Cancel
				];
				PCX.disableTabIndex(removeIframeTabIndexSelectors,el.FancyBox);

				PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.IframeForm).addEventListener('submit', (eventSubmit) => {
					if(QAManager.getNoticeCount() > 0) {
						eventSubmit.preventDefault();
						QAManager.showQAModalNotification();
					}
				});

			});
			
		});
	};

	static scanFilenamer() {
		// Define the object with keywords and corresponding values
		let type = "REQ";  // Default type if no match is found
		const locationKeywords = {
			"ABCO": "",
			"AXXESSRX": " AND FS",
			"MONROE": " AND FS",
			"RELIABLE": "",
			"TKS": " AND FS",
			"SNL": " AND FS",
			"VIBRANT": " AND FS"
			//"SAFE": ""
		};

		// Function to generate the string
		function generateLabel() {
			// Grab the value of the LOCATION field
			const location = document.querySelector('#MainContent_ctl00_tbLocation_tbText').value;

			// Check if LOCATION contains any of the keywords and set the type
			for (const keyword in locationKeywords) {
				const regex = new RegExp(keyword, 'i');  // Create a case-insensitive regex for the keyword
				if (regex.test(location)) {  // Check if the keyword is present anywhere in the LOCATION string
					type += locationKeywords[keyword];
					break;
				}
			}

			// Grab the value of the PATIENT field and remove commas
			const patient = document.querySelector('#MainContent_ctl00_tbPatient_tbText').value;
			const name = patient.replace(/,/g, '');  // Remove commas from the patient name

			// Get the current date in MM.DD.YY format
			const today = new Date();
			const date = `${(today.getMonth() + 1).toString().padStart(2, '0')}.${today.getDate().toString().padStart(2, '0')}.${today.getFullYear().toString().slice(-2)}`;

			// Create the final string
			const labelString = `${type} ${date} ${name}`;

			// Log the result to the console
			//console.log(labelString);

			// Copy the result to the clipboard
			navigator.clipboard.writeText(labelString).then(() => {
				//console.log("Label copied to clipboard!");
			}).catch(err => {
				//console.error("Failed to copy label to clipboard: ", err);
			});
		}

		// Add event listener to the button
		document.querySelector('[onclick="printLables()"]').addEventListener('click', generateLabel);

	}

	/**
	 * 
	 * Reference Lab Transfer Assist - Capture
	 * 
	 */
	static capturePTData() {

		const el = IATSERV.selectors;
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			//if(chrome.runtime.id == undefined) return;
			if (message.action === 'noticeDisplay') {
			// If the notice is already present, don't recreate it
				if (!PCX.getEl(IATSERV.noticeDisplay)) {
					PCX.initializeNotice(message.patientData);
				}
			}
		});

		PCX.getEl(el.newPatientBtn).parentNode.addEventListener('click', function(event) {
			const siteAssets = PCX.createDOM('div', { id: 'siteAssets'});
			siteAssets.appendChild(
				Object.assign(PCX.createDOM('span'), {
					textContent: '⎘',
					id: 'patientCopy',
					title: 'Capture Patient Record'
				})
			);
			waitForElm('.fancybox-iframe').then((elm) => {
				PCX.getEl('.fancybox-overlay',true).appendChild(siteAssets);
				PCX.getEl("#patientCopy").addEventListener('click', function(event) {
					
					// Temp Capture was discussed with Dean. As long as 
					// it never leaves the browser/local, it's HIPAA compliant.
					// Fn PCX.initializeNotice() immediately takes the data after 
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
						//if(chrome.runtime.id == undefined) return;
						chrome.runtime.sendMessage({
							action: 'initPatientTransfer',
							patientData: {
								FirstName:	patientData.FirstName,
								LastName:	patientData.LastName,
								Category:	patientData.Category
							}
						});
					});

				});
			});
		});
	}


	/**
	 *
	 * Reference Lab Transfer Assist - Fill
	 * 
	 * Demo Data
	 * patientData = {
	 * 	"Address": "11 Demo dr ",
	 * 	"Category": "11", //Immuno
	 * 	"City": "DemoCity",
	 * 	"DOB": [
	 * 		"4",
	 * 		"25",
	 * 		"2000"
	 * 	],
	 * 	"DOC": "4/28/2023",
	 * 	"Email": "",
	 * 	"FirstName": "DemoFirst",
	 * 	"Gender": "Male",
	 * 	"LastName": "DemoLast",
	 * 	"MiddleName": "",
	 * 	"Phone": "5551234567",
	 * 	"Race": "Caucasian",
	 * 	"State": "GA",
	 * 	"Zip": "30043"
	 * };
	 * 
	 */

	static async pastePatientData() {
		chrome.storage.local.get('patientData', ({ patientData }) => {

			const el = IATSERV.selectors;

			// Fill in data
			PCX.getEl(el.DOC).value			= patientData.DOC;
			PCX.getEl(el.Category).value	= categoryTranslation[patientData.Category];
			
			IATSERV.checkTestCat(PCX.getEl(`${el.Category} option:checked`),{Input: PCX.getEl(el.TestCodesInput,true),Output: PCX.getEl(el.TestCodesOutput,true)},IATSERV.testCategories).then( (elm) => {
				// Trigger inline OnClick Function via OnFocus
				PCX.getEl(el.NewPatientBTN).setAttribute('onFocus',"newPatient()");
				PCX.getEl(el.NewPatientBTN).focus();
				PCX.getEl(el.NewPatientBTN).setAttribute('onFocus',"");

				waitForElm(el.FancyBox).then( (elm) => {
					PCX.getEl(el.FancyBox).addEventListener('load', (el) => {
						iframeEl["FirstName"]	= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.FirstName);
						iframeEl["LastName"]	= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.LastName);
						iframeEl["MiddleName"]	= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.MiddleName);
						iframeEl["DOB"]			= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.DOB);
						iframeEl["Gender"]		= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.Gender);
						iframeEl["Race"]		= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.Race);
						iframeEl["Address"]		= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.Address);
						iframeEl["State"]		= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.State);
						iframeEl["City"]		= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.City);
						iframeEl["Zip"]			= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.Zip);
						iframeEl["Phone"]		= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.Phone);
						iframeEl["Email"]		= PCX.getEl(el.FancyBox).contentWindow.document.querySelector(el.Email);
						

						iframeEl.FirstName.value	= patientData.FirstName;
						iframeEl.LastName.value		= patientData.LastName;
						iframeEl.MiddleName.value	= patientData.MiddleName;
						iframeEl.DOB.value			= patientData.DOB.join('/');
						iframeEl.Gender.value		= genderTranslate[patientData.Gender];
						iframeEl.Race.value			= raceTranslate[patientData.Race];
						iframeEl.Address.value		= patientData.Address;
						iframeEl.State.value		= patientData.State;
						iframeEl.City.value			= patientData.City;
						iframeEl.Zip.value			= patientData.Zip;
						iframeEl.Phone.value		= patientData.Phone;
						iframeEl.Email.value		= patientData.Email;

						iframeEl.DOB.focus();
						PCX.simulateUserKey(iframeEl.DOB,PCX.events.Tab);
					});
				});
			});
			if (patientData) {
				// Clear the patient data after usage
				chrome.storage.local.set({ patientData: {} }, () => {
					PCX.log('Patient data cleared after use');
					PCX.getEl(IATSERV.noticeDisplay).remove();
				});
			}
		});


		PCX.getEl(el.UpPanel).addEventListener('change', (e) => {
			// Ping reloaded Elements
			if (e.target && e.target.id === el.Category.replace('#','')) {
				IATSERV.checkTestCat(PCX.getEl(`${el.Category} option:checked`),{Input: pageElements.TestCodesInput,Output: pageElements.TestCodesOutput},testCategories);
			}
		});
	}

	static createOrder(callback=()=>{return;}) {
		const el = IATSERV.selectors;
		el.orderDefaults = IATSERV.orderDefaults;

		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			//if(chrome.runtime.id == undefined) return;
			if (message.action === 'noticeDisplay') {
				// If the notice is already present, don't recreate it
				if (PCX.getEl(IATSERV.noticeDisplay)) {
					PCX.getEl(IATSERV.noticeDisplay).remove();
				}
				PCX.noticeUpdate(message.patientData,message.timer,callback);
			}
		});

		// Prefill Location and Physician
		waitForElm(el.Location).then((elm) => {
			PCX.getEl(el.Location).value = el.orderDefaults.Location;
			PCX.simulateUserKey(PCX.getEl(el.Location),PCX.events.Space);
			waitForElm(el.LocationMenu).then((elm) => {
			PCX.simulateUserKey(PCX.getEl(el.Location),PCX.events.Tab);
				waitForElm(el.PhysicianOptions).then((elm) => {
					PCX.getEl(el.Physician).value = el.orderDefaults.Physician;
					PCX.getEl(el.PhysicianId).value = el.orderDefaults.Physician;
					PCX.getEl(el.PhysicianName).value = el.orderDefaults.PhysicianName;
				})
			});
		});
		PCX.getEl(el.BillTo).value = el.orderDefaults.BillTo;
		PCX.getEl(el.Category).focus();
	}

	/**
	 *
	 * fileDrop
	 *
	 * Expands the Drop area of file upload and applies a QA Check
	 *
	 * @param		OBJECT 		qa			If Enabled, all other Keys are Required
	 *  @param		BOOL 		enabled		Boolean to check file name against Patient's Name, Accession number & System ID
	 *  @param		STRING 		acsNum		Accession number as used by the user 
	 *  @param		STRING 		acsID		Accession number as used by the system 
	 *  @param		ARRAY 		patient		Patient Name .split() into an array by spaces
	 * @param		STRING 		target		The "upload" DOM Element that is expecting a file
	 * @param		STRING 		targetSpan	The DOM Element that displays text related to file transfer status 
	 *
	 * @let			BOOL		isDragging	Boolean to hold the state if user is currently dragging a file over the viewport
	 * @const		OBJECT		el			All the DOM Element Selectors to reference from
	 * @const		NODE		dropArea	DOM element that is to receive the file upon drop
	 * @const		ARRAY		acceptTypes	File types/extensions that the system will allow
	 * 
	 * @listener	DRAGOVER	dropArea
	 * @listener	DRAGLEAVE	dropArea
	 * @listener	DRAGOVER	document
	 * @listener	DRAGLEAVE	window
	 * @listener	DROP		dropArea
	 *  @process	IF 			qa.enabled 	Check file name against Patient's Name, Accession number & System ID
	 *  
	 * @function	async		dropZoneKeepAlive() 	
	 * @function	async		dropZoneTimeOut()		
	 */
	static fileDrop(qa={enabled:false,acsNum:null,acsID:null,patient:null,result:false},target=false,targetSpan=false,scrollTo=false){
		let 	isDragging 	= false;
		const	el			= IATSERV.selectors;
				el.DropArea		= target ? target : el.UploadTable;
				el.ScrollTo		= scrollTo ? scrollTo : el.DropArea;
				el.AcceptTypes	= el.DropArea+' input[type="file"]';
				el.TargetSpan	= targetSpan ? targetSpan : el.UploadSpan;
		const 	dropArea	= PCX.getEl(el.DropArea).closest('*');
		const 	acceptTypes = PCX.getEl(el.AcceptTypes).getAttribute('accept').split(',');


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

				if(PCX.getEl(el.TargetSpan).textContent == "Drop File"){
					PCX.getEl(el.TargetSpan).textContent = "Choose File";
				}
			}
			if(e.dataTransfer.files.length > 0) {
				for (const [i, file] of Object.entries(e.dataTransfer.files)) {
					let fileExt = file.name.split('.').pop();
					let fileName = file.name.replace('.'+fileExt,'');
					PCX.getEl(el.ScrollTo).scrollIntoView({ behavior: "instant", block: "end"});
					if (acceptTypes.findIndex(function (a) { return a.toLowerCase() == ('.' + fileExt).toLowerCase() }) == -1) {
						return; // File not accepted
					}

					if(qa.enabled){
						let queries	= qa.patient;
							queries.push(qa.acsNum, qa.acsID);
						let showDialog = false;

						let tokens	= fileName.toUpperCase()
							.replace(/(\d{2})-(\d{2})-(\d{4})/gm, `$1$2$3`) // Condense Dates with dashes
							.replace(/(\d{2})\.(\d{2})\.(\d{4})/gm, `$1$2$3`) // Condense Dates with periods
							.split(/[\s-\._]/)	// Separate by whitespace, dashes, periods, underscores

						if(!tokens.some(item => queries.includes(item))) {
							QAManager.addNotice("FileUpload","<h4>Sorry to bother</h4>The file you just uploaded does not have the Patient's Name or Accession Number in it's name.<br/>Just wanted to double check you didn't upload the wrong file: <pre>" + file.name + "</pre>");
							QAManager.showQAModalNotification();
							QAManager.removeNotice("FileUpload");
						}
						if(!tokens.some(item => queries.includes(item))) {
							QAManager.addNotice("FileUpload2","<h4>Sorry to bother</h4>The file you just uploaded does not have the Patient's Name or Accession Number in it's name.<br/>Just wanted to double check you didn't upload the wrong file: <pre>" + file.name + "</pre>");
							showDialog = true;
						}

						if(qa.result){
							if((tokens.includes('NEG') && tokens.includes('POS')) || (!tokens.includes('NEG') && !tokens.includes('POS'))) {
								QAManager.addNotice("FileUpload1","<h4>Quick Note</h4>The file you just uploaded appear to not have it's result status set: <pre>" + file.name + "</pre>");
								showDialog = true;
							}
						}
						if(showDialog){
							QAManager.showQAModalNotification();
							QAManager.removeNotice("FileUpload");
							QAManager.removeNotice("FileUpload1");
							QAManager.removeNotice("FileUpload2");
						}
					}else{
						PCX.log('Call to QAManager: Not Enabled')
					}
				};
			}
		});

		function dropZoneKeepAlive(isDragging, e) {
			isDragging = true;
			if (!document.body.classList.contains('dropZoneKeepAlive')) {
				document.body.classList.add('dropZoneKeepAlive');
				PCX.getEl(el.TargetSpan).textContent = "Drop File";
			}
		}
		function dropZoneTimeOut(isDragging, e) {
			if (e.target === window || (e.clientX === 0 && e.clientY === 0)) {
				isDragging = false;
				if (document.body.classList.contains('dropZoneKeepAlive')) {
					document.body.classList.remove('dropZoneKeepAlive');
					PCX.getEl(el.TargetSpan).textContent = "Choose File";
				}
			}
		}
	}

	/**
	 *
	 *	Result Download
	 *
	 * 	Prep file name for download
	 * 
	 */
	
	static resultsDownloader() {
		const el = IATSERV.selectors;
		document.body.addEventListener('click', (event) => {
			const downloadLink = event.target.closest(`${el.UpdatePanel} a[title="Download Result"]`);
			if (!downloadLink) {return};

			event.preventDefault();
			const headings = PCX.getEl(el.DXHeaderRow).textContent.replaceAll('\t','').replaceAll('\n','').split(" ");
			// Check if the clicked element or one of its parents is the <a> with title "Download Result"
			
			// Find the parent <tr> for the clicked <a>
			const row = downloadLink.closest('tr');

			// Collect the text content of all <td> elements in the row into an array
			const rowData = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
			row.classList.add(el.TDCheckedClass);
			const tdCheckBox = row.querySelector(el.TDCheckBox);
			tdCheckBox.classList.replace(el.BoxUnchecked,el.BoxChecked);
			const date = new Date();
			const customFilename =  "Res "
						+('0' + (date.getMonth()+1)).slice(-2)
						+"."+('0' + (date.getDate())).slice(-2)
						+"."+(date.getFullYear().toString().substr(-2))
						+" "
						+rowData[headings.indexOf('Last')]
						+" "
						+rowData[headings.indexOf('First')]
						+".pdf"; // Output the row data as an array

			fetch(downloadLink.href)
				.then(response => response.blob().then(blob => {
					// Extract filename from Content-Disposition or use custom/default filename
					const filename = customFilename ||
						(response.headers.get('Content-Disposition')?.match(/filename="?(.+?)"?$/)?.[1]) ||
						'DownloadedFile.pdf';

					// Trigger download with the determined filename
					const url = window.URL.createObjectURL(blob);
					PCX.createDOM('a', { href: url, download: filename }).click();
					window.URL.revokeObjectURL(url);
				}))
				.catch(console.error);
		});
	}

	/**
	 * insuranceLookUp
	 * @type Object
	 *
	 * Key:		StateAbbr			
	 * Term: 	State Name		
	 * Name:	Insurance policy
	 * Id:		DBID of policy
	 *
	 *  `#MainContent_ctl00_AddressControl1_CountryState_ddState`.value: {
	 *  	term:`#MainContent_ctl00_AddressControl1_CountryState_ddState`.innerText,
	 *  	name:`#MainContent_ctl00_PrimaryInsurance_tbInsurance_tbText`.value,
	 *  	id:`#MainContent_ctl00_PrimaryInsurance_tbInsurance_tbID`.value
	 *  }
	 * 
	 */
	static insuranceLookUp = {
		AL:{term:"ALABAMA",name:"Medicare Part B Alabama *",id:"3426"},
		AK:{term:"ALASKA",name:"Medicare Part B Alaska",id:"3427"},
		AZ:{term:"ARIZONA",name:"Medicare Part B Arizona *",id:"3428"},
		AR:{term:"ARKANSAS",name:"Medicare Part B Arkansas *",id:"3429"},
		CA:{term:"CALIFORNIA",name:"Medi-Cal of California 610442",id:"3390"},
		CO:{term:"COLORADO",name:"Medicare Part B Colorado *",id:"3430"},
		CT:{term:"CONNECTICUT",name:"Medicare Part B Connecticut *",id:"3431"},
		DE:{term:"DELAWARE",name:"Medicare Part B Delaware",id:"3432"},
		FL:{term:"FLORIDA",name:"Medicare Part B Florida",id:"3433"},
		GA:{term:"GEORGIA",name:"Medicare Part B Georgia",id:"3434"},
		HI:{term:"HAWAII",name:"Medicare Part B Hawaii",id:"3435"},
		ID:{term:"IDAHO",name:"Medicare Part B Idaho *",id:"3436"},
		IL:{term:"ILLINOIS",name:"Medicare Part B Illinois *",id:"3437"},
		IN:{term:"INDIANA",name:"Medicare Part B Indiana *",id:"3438"},
		IA:{term:"IOWA",name:"Medicare Part B Iowa *",id:"3439"},
		KS:{term:"KANSAS",name:"Medicare Part B Kansas *",id:"3440"},
		KY:{term:"KENTUCKY",name:"Medicare Part B Kentucky *",id:"3442"},
		LA:{term:"LOUISIANA",name:"Medicare Part B Louisiana *",id:"3443"},
		ME:{term:"MAINE",name:"Medicare Part B Maine *",id:"3444"},
		MD:{term:"MARYLAND",name:"Medicare Part B Maryland",id:"3445"},
		MA:{term:"MASSACHUSETTS",name:"Medicare Part B Massachusetts *",id:"3446"},
		MI:{term:"MICHIGAN",name:"Medicare Part B Michigan *",id:"3447"},
		MN:{term:"MINNESOTA",name:"Medicare Part B Minnesota *",id:"3448"},
		MS:{term:"MISSISSIPPI",name:"Medicare Part B Mississippi *",id:"3449"},
		MO:{term:"MISSOURI",name:"Medicare Part B Missouri",id:"3450"},
		MT:{term:"MONTANA",name:"Medicare Part B Montana *",id:"3451"},
		NE:{term:"NEBRASKA",name:"Medicare Part B Nebraska *",id:"3452"},
		NV:{term:"NEVADA",name:"Medicare Part B Nevada *",id:"3453"},
		NH:{term:"NEW HAMPSHIRE",name:"Medicare Part B New Hampshire *",id:"3454"},
		NJ:{term:"NEW JERSEY",name:"Medicare Part B New Jersey *",id:"3455"},
		NM:{term:"NEW MEXICO",name:"Medicare Part B New Mexico *",id:"3456"},
		NY:{term:"NEW YORK",name:"Medicare Part B New York *",id:"3457"},
		NC:{term:"NORTH CAROLINA",name:"Medicare Part B North Carolina *",id:"3459"},
		ND:{term:"NORTH DAKOTA",name:"Medicare Part B North Dakota *",id:"3460"},
		OH:{term:"OHIO",name:"Medicare Part B Ohio *",id:"3463"},
		OK:{term:"OKLAHOMA",name:"Medicare Part B Oklahoma *",id:"3464"},
		OR:{term:"OREGON",name:"Medicare Part B Oregon *",id:"3465"},
		PA:{term:"PENNSYLVANIA",name:"Medicare Part B Pennsylvania *",id:"3466"},
		RI:{term:"RHODE ISLAND",name:"Medicare Part B Rhode Island *",id:"3467"},
		SC:{term:"SOUTH CAROLINA",name:"Medicare Part B South Carolina *",id:"3468"},
		SD:{term:"SOUTH DAKOTA",name:"Medicare Part B South Dakota *",id:"3469"},
		TN:{term:"TENNESSEE",name:"Medicare Part B Tennessee *",id:"3470"},
		TX:{term:"TEXAS",name:"Medicare Part B Texas *",id:"3471"},
		UT:{term:"UTAH",name:"Medicare Part B Utah *",id:"3473"},
		VT:{term:"VERMONT",name:"Medicare Part B Vermont *",id:"3474"},
		VA:{term:"VIRGINIA",name:"Medicare Part B Virginia *",id:"3475"},
		WA:{term:"WASHINGTON",name:"Medicare Part B Washington *",id:"3476"},
		DC:{term:"DISTRICT OF COLUMBIA",name:"Medicare Part B Washington DC *",id:"3477"},
		WV:{term:"WEST VIRGINIA",name:"Medicare Part B West Virginia *",id:"3478"},
		WI:{term:"WISCONSIN",name:"Medicare Part B Wisconsin",id:"3480"},
		WY:{term:"WYOMING",name:"Medicare Part B Wyoming *",id:"3481"}
	}
}