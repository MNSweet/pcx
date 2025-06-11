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
			{heading:"Alt ID 3",linkId:0,text:"Benchmarks"} // Available
		]

		for (const [i,column] of Object.entries(overrides)) {
			let rowData = document.querySelectorAll('.dxgvDataRow_Metropolis');
			let prevTimeStamp = "";
			if(rowData.length){
				rowData.forEach((row) => {
					row.querySelectorAll('.dxgv').forEach((td)=>{
						let text = td.innerText.replace(/[^a-zA-Z0-9]/g, "");
						if(text == "") {return;}
						td.classList.add(text);
					});
   
					if (headings.includes(column.heading)) {
						if (headings.includes('Accession')) {
							let accessionID = row.querySelector('td:nth-child('+(headings.indexOf('Accession')+1)+') a').getAttribute('onclick').replace(/ShowForm\((\d*),this\)/i,'$1');
							let columnLinkTD = row.querySelector('td:nth-child('+(headings.indexOf(column.heading)+1)+')');

							columnLinkTD.innerHTML = `<a href="/?LinkId=${column.linkId}&AccessionId=${accessionID}" target="_blank">${column.text}</a>`
						}
						if (headings.includes("Created Date Time") && column.heading == "Alt ID 3") {
							let timeStamp = Date.parse(row.querySelector('td:nth-child('+(headings.indexOf('Accession')+1)+')').innerText);

							let columnLinkTD = row.querySelector('td:nth-child('+(headings.indexOf(column.heading)+1)+')');

							columnLinkTD.innerHTML = ``;
						}
					}
				});
				if (headings.includes(column.heading) && headings.includes('Accession')) {
					PCX.getEl('#MainContent_ctl00_grid_DXHeadersRow0 td:nth-child('+(headings.indexOf(column.heading)+1)+ ')',true).textContent = column.text;
				}
			}
		}	
	}



	static columnReportsParser() {
		let count = document.querySelectorAll('[id^=MainContent_ctl00_grid_tccell]:not(.processCopyTo)').length;

		if(count <= 0){ return; }
		let headingRow = PCX.getEl('#MainContent_ctl00_grid_DXHeadersRow0',true);
		if(!headingRow){return;}
		let headings = headingRow.textContent.replaceAll('\t','').replaceAll('\n','').split(" ");
		document.querySelectorAll('[id^=MainContent_ctl00_grid_tccell]').forEach((asc) => {
			if(!asc.classList.contains('processCopyTo')){
				asc.classList.add('processCopyTo');

				//?LinkId=2071&AccessionId=15489&_ml=9&_mlp=5
				let anchor = asc.querySelector('a[href*="/ViewAccession.aspx?AccessionId="]')

				// Regular expression to extract AccessionId
				let match = anchor.getAttribute('href').match(/AccessionId=(\d+)&?/);

				if (match) {
					anchor.setAttribute('href', `/?LinkId=2071&AccessionId=${match[1]}&_ml=9&_mlp=5`);
				}

				const copyTo = PCX.createDOM("span", {});
				copyTo.innerText = "📋 ";
				asc.innerHTML = copyTo.outerHTML + asc.innerHTML;
				if(count == 1){
					let quickClipboard = asc.querySelector('a').innerText + "\t" + asc.nextSibling.innerText;
					PCX.copyToClipboard(quickClipboard);
				}
				asc.querySelector('span').addEventListener('click', (e)=>{
					let td = e.target.parentNode;
					//console.log(td);
					let clipboard = td.querySelector('a').innerText + "\t" + td.nextSibling.innerText;
					PCX.copyToClipboard(clipboard);
				});
			}
		});
		let rowData = document.querySelectorAll('.dxgvDataRow_Metropolis');
		if(rowData.length){
			rowData.forEach((row) => {
				if (headings.includes('DOS')) {
		            let dos = row.querySelector('td:nth-child(' + (headings.indexOf('DOS') + 2) + ')');
		            let doc = new Date(dos.innerText.trim());
		            let date = new Date();
		            dos.classList.add('ngsDate');
		            if (doc < (new Date(date)).setDate(date.getDate() - 90)) {
		                dos.classList.add('ngs90');
		            } else if (doc < (new Date(date)).setDate(date.getDate() - 60)) {
		                dos.classList.add('ngs60');
		            }
				}
			})
		}
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
			{heading:"ID3",linkId:0,text:""}, // Available
			{heading:"Phone",linkId:0,text:"Phone"},
			{heading:"Fax",linkId:0,text:"Fax"},
			{heading:"Location Name",linkId:0,text:"Location"}
		]

		let LocAccount = (headings.includes("Location Name") && headings.includes("Account"));

		for (const [i,column] of Object.entries(overrides)) {
			if (headings.includes(column.heading) && headings.includes('Code')) {
				let rowData = document.querySelectorAll('.dxgvDataRow_Metropolis');
				if(rowData.length){
					rowData.forEach((row) => {
						console.log(row,column.heading,LocAccount);
						if("Location Name" == column.heading && LocAccount) {
							let locationCell = row.querySelector('td:nth-child('+(headings.indexOf("Location Name")+1)+')');
							let accountCell = row.querySelector('td:nth-child('+(headings.indexOf('Account')+1)+')');
							if(locationCell.innerText.trim() != accountCell.innerText.trim()) {
								locationCell.style.backgroundColor="#fdf0f0";
								accountCell.style.backgroundColor="#fdf0f0";
							}
						}else if(["Phone","Fax"].includes(column.heading)) {
							let cell = row.querySelector('td:nth-child('+(headings.indexOf(column.heading)+1)+')');
							if (cell.innerText.trim() == "" || /\D/.test(cell.innerText.trim())) {
								cell.style.backgroundColor="#fdf0f0";
							}
						}else{
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
						}
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

		PCX.getEl(el.newPatientBtn,true).addEventListener('click', IATSERV.newPatientBtn);

		// Disable Create Patient Button if no location is set
		PCX.getEl(el.newPatientBtn).classList.add("disabled");
		PCX.getEl(el.locationInput).addEventListener("blur", (event) => {
			if(event.target.value != "" && PCX.getEl(el.newPatientBtn).classList.contains("disabled")) {
				if(event.target.value.match("^(AM-|CTD-|TS-).*")){
					waitForElm(el.PhysicianOptions).then((elm) => {
						PCX.getEl(el.Physician,true).innerHTML = `<option value="0" disabled selected hidden>Select a Physician</option>`+PCX.getEl(el.Physician).innerHTML;
						PCX.getEl(el.PhysicianId,true).value = "";
						PCX.getEl(el.PhysicianName,true).value = "";
					});
				}
				if(event.target.value.match("^(5556).*")){
					PCX.getEl("#MainContent_ctl00_ctl00_ddBillType_ddControl",true).value = "3";
					
					// Set Status to Received as default to p revent the Auto-PA
					PCX.getEl(el.Status).value = "Received";
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
			el.ReqImport, el.ReqImportSearch, el.SearchPatient, el.PatientCode, el.PatientDOB, el.PatientAddress, el.PatientPhone, 
			el.PatientEmail, el.PrimaryInsurance, el.PrimaryInsurancePolicy, el.PrimaryInsuranceGroup, 
			el.SecondaryInsurance, el.SecondaryInsurancePolicy, el.SecondaryInsuranceGroup, el.SpecimenType, 
			el.Quantity, el.Requisition, el.DOCTime, el.ReceivedDate, el.ReceivedTime, el.ClearBTN, el.Medication,
			el.MedicationBTN, el.OtherMedication, el.PhySigCaptured, el.PTSigCaptured, el.SigSuccess, el.SigClear, el.SigToggle
		];
		PCX.disableTabIndex(removeTabIndexSelectors);

		waitForElm(el.locationInput).then((input)=>{input.focus()});

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
			
			const frame = PCX.getEl(el.FancyBox,true).contentWindow.document;


			// ---- Birthday  ----
				let inputDOB = frame.querySelector(el.IframeDOB);
				let minorDate = new Date();
					minorDate.setFullYear(minorDate.getFullYear() - 18);
				let docAttempt 	 = 0;
				let docLastValue = '';
				inputDOB.addEventListener('blur', (e) => {
					let docAttempt 	 = 0;
					const docIntervalId = setInterval(() => { // Wait for date picker
						let dobNotice = false;
						let dobError = frame.querySelector('#MainContent_ctl00_tbDOB_ctl00');
						if (e.target.value !== docLastValue) {
							docLastValue = e.target.value;
							clearInterval(docIntervalId);

							let dob = e.target.value;
							dobError.style.display = "none";
							if(Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= Date.now()){
								dobNotice = true;
								QAManager.addNotice("DOB","It seems that your patient hasn't been born yet. Is this birthday correct? " + dob);
							}else if(Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= minorDate.getTime()){ // 18+ Minor check
								dobNotice = true;
								QAManager.addNotice("DOB","Intesting, your patient is a minor. Just a quick check. Is this birthday correct? " + dob);
							}else if(Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= 946702800000){ //Jan 1 2000
								dobNotice = true;
								QAManager.addNotice("DOB","Just being vigilant, Though I may be wrong: Is this birthday correct? " + dob);
							}else {
								QAManager.removeNotice("DOB");
							}
						}
						if (dobNotice) {
							dobError.style.position = "absolute";
							dobError.style.top = "2px";
							dobError.style.right = "32px";
							dobError.style.display = "block";
							dobError.style.fontWeight = "900";
							dobError.innerText = "?";
						}
						if (++docAttempt >= 5) {
							clearInterval(docIntervalId);
						}
					}, 100);
				});



			// ---- Phone Number  ----
				const inputPhone = frame.querySelector(el.IframePhone);
				inputPhone.addEventListener('blur', (e) => {
					if(![0,10].includes(e.target.value.length)){
						e.target.style.backgroundColor = "#ffcece";
						e.target.style.border = "1px #872626 solid";
					} else {
						e.target.style.backgroundColor = null;
						e.target.style.border = null;
					}
				});

			// ---- Address 1  ----
				console.log(el.IframeAddress1);
				const inputAddr1 = frame.querySelector(el.IframeAddress1);
				inputAddr1.addEventListener('blur', (e) => {
					console.log(e);
					console.log(e.target);
					console.log(e.target.value);
					console.log(e.target.value.length);
					if(e.target.value.length > 0 && e.target.value.length < 10){
						e.target.style.backgroundColor = "#fff0e2";
						e.target.style.border = "1px #c18c2a solid";
					} else {
						e.target.style.backgroundColor = null;
						e.target.style.border = null;
					}
				});



			// ---- Zip Code  ----
				const inputZip = frame.querySelector(el.IframeZip);
				inputZip.addEventListener('blur', (e) => {
					if(![0,5].includes(e.target.value.length)){
						e.target.style.backgroundColor = "#ffcece";
						e.target.style.border = "1px #872626 solid";
					} else {
						e.target.style.backgroundColor = null;
						e.target.style.border = null;
					}
				});



			// ---- State DropDown ----
				frame.querySelectorAll(el.StateDropdown+' option').forEach((option)=>{
					//option.dataset.name = option.innerText;
					if(["","AA","AE","AP"].includes(option.value)){return;}
					option.innerText = option.value + " - " + option.innerText;
				});



			// ---- Insurance Placeholder AutoComplete ----
				let stateDropdown = frame.querySelector(el.StateDropdown);
				frame.querySelector(el.InsuranceLookup).addEventListener('focus',(e)=>{
					let input = e.target;
					if(stateDropdown.value == "" || !(stateDropdown.value in IATSERV.insuranceLookUp)) {return;}
					input.placeholder = IATSERV.insuranceLookUp[stateDropdown.value].name;
					
				});
				frame.querySelector(el.InsuranceLookup).addEventListener('blur',(e)=>{
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
						frame.querySelector(el.InsuranceID).value = IATSERV.insuranceLookUp[stateDropdown.value].id;
					}
					input.placeholder = "Insurance";
				});
				frame.querySelector(el.IframePolicy).addEventListener('focus',(e)=>{
					const policyInput = e.target;
					const insurance = frame.querySelector(el.InsuranceLookup).value.toLowerCase();
					const mediCheck = (insurance.includes('medicare')) || (insurance.includes('medi-cal')) ;

					if(mediCheck) {
						const blurMBI = (blurE)=>{
							const blurPolicyInput = blurE.target;
							const policyInputValue = blurPolicyInput.value.toUpperCase();
							// Set Maximum Length
							const maxLength = 11;
							
							// Regular expressions for each position
							const positionPatterns = [
								/^[1-9]$/,					// Position 1: numeric 1-9
								/^[AC-HJ-KM-NP-RT-Y]$/,		// Position 2: alphabetic A-Z (minus S, L, O, I, B, Z)
								/^[0-9AC-HJ-KM-NP-RT-Y]$/,	// Position 3: alphanumeric (minus S, L, O, I, B, Z)
								/^[0-9]$/,					// Position 4: numeric 0-9
								/^[AC-HJ-KM-NP-RT-Y]$/,		// Position 5: alphabetic A-Z (minus S, L, O, I, B, Z)
								/^[0-9AC-HJ-KM-NP-RT-Y]$/,	// Position 6: alphanumeric (minus S, L, O, I, B, Z)
								/^[0-9]$/,					// Position 7: numeric 0-9
								/^[AC-HJ-KM-NP-RT-Y]$/,		// Position 8: alphabetic A-Z (minus S, L, O, I, B, Z)
								/^[AC-HJ-KM-NP-RT-Y]$/,		// Position 9: alphabetic A-Z (minus S, L, O, I, B, Z)
								/^[0-9]$/,					// Position 10: numeric 0-9
								/^[0-9]$/					// Position 11: numeric 0-9
							];

							let isValid = true;
							let debugOutput = [];

							// Validate the length of the policyInputValue
							if (policyInputValue.length == 0) {
								return;
							} else if (policyInputValue.length < maxLength) {
								blurPolicyInput.title = `Number should contain 11 alphanumerical characters. Current: ${policyInputValue.length}`;
								blurPolicyInput.style.backgroundColor = "#ffcece";
								blurPolicyInput.style.border = "1px #872626 solid";
								return;
							} else if (policyInputValue.length > maxLength) {
								blurPolicyInput.title = `Number should contain 11 alphanumerical characters. Current: ${policyInputValue.length}`;
								blurPolicyInput.style.backgroundColor = "#ffcece";
								blurPolicyInput.style.border = "1px #872626 solid";
								return;
							}

							// Validate each character against the respective pattern
							for (let i = 0; i < maxLength; i++) {
								if (positionPatterns[i].test(policyInputValue[i])) {
									debugOutput.push(1);
								} else {
									debugOutput.push(0);
									isValid = false;
								}
							}

							// If there are invalid characters, highlight them in the policyInputValue
							if (!isValid) {
								let highlightedInput = '';

								for (let i = 0; i < maxLength; i++) {
									highlightedInput += (debugOutput[i] === 0) 
										? ` [${policyInputValue[i]}] `		// Error
										: ` ${policyInputValue[i]} `;	// Correct
								}

								// Show the detailed error message with the invalid characters highlighted
								blurPolicyInput.title = highlightedInput;
								blurPolicyInput.style.backgroundColor = "#ffcece";
								blurPolicyInput.style.border = "1px #872626 solid";
							} else {
								// If everything is valid, clear the error message
								blurPolicyInput.title = '';
								blurPolicyInput.style.backgroundColor = null;
								blurPolicyInput.style.border = null;
							}
					
							
						};

						policyInput.removeEventListener('blur',blurMBI);
						policyInput.addEventListener('blur',blurMBI);
					}
				});



			// ---- Disable input tabable areas ----
				const removeIframeTabIndexSelectors = [
					el.SSN, el.LicenseState, el.LicenseNumber, el.MainAddress2, el.MainFax, el.MainEmail, el.CopyColumnBTN1, el.CopyColumnBTN2,
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



			// ---- QA Duplicate Field Check ----
				const inputDupCheck = [
					el.IframeFName, el.IframeLName, el.IframeMName, el.IframeDOB, el.IframeAddress1,
					el.IframeCity, el.IframeZip, el.IframePhone, el.IframePolicy, el.IframeForm
				]

				inputDupCheck.forEach((input)=>{
					frame.querySelector(input).addEventListener('blur',(e)=>{
						console.log([e.target]);
						checkForDups();
					});
				});

				function checkForDups() {
					frame.querySelectorAll(".dup").forEach((dup)=>{dup.classList.remove('dup')})
					let ledger = {_index:[]}
					inputDupCheck.forEach((input)=>{
						let value = frame.querySelector(input).value;
						ledger._index.push(value);
						if(!ledger[value]) {
							ledger[value] = [];
						}
						ledger[value].push(input);
					})
					const uniqueElements = new Set();
					const loggedDuplicates = new Set();
					const duplicates = [];

					ledger._index.forEach(item => {
						if (typeof item === 'string' && (!item || item.trim() === '')) {
							return;
						}

						if (uniqueElements.has(item)) {
							if(!loggedDuplicates.has(item)){
								duplicates.push(item);
								loggedDuplicates.add(item)
							}
						} else {
							uniqueElements.add(item);
						}
					});

					duplicates.forEach((key)=>{
						console.log(ledger[key]);
						ledger[key].forEach((dup)=>{
							frame.querySelector(dup).classList.add('dup')
						})
					});

				}


			// ---- QA Submit Check ----
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
		let fs = " FS";
		const locationKeywords = {
			"ABCO": "",
			"AXXESSRX": fs,
			"MONROE": fs,
			"RELIABLE": "",
			"AEM": "",
			"TKS": fs,
			"SNL": fs,
			"Murray Medical Center": fs,
			"VIBRANT": fs
			//"SAFE": "",
			//"LIF": "",
			//"SUN": "",
			//"PRE": "",
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
			const patient = PCX.getEl('#MainContent_ctl00_tbPatient_tbText',true).value;
			const name = patient.replace(/,/g, '');  // Remove commas from the patient name

			const acsNum = PCX.getEl('#MainContent_ctl00_tbAccession',true).value;

			// Create the final string
			const labelString = `${type} ${acsNum} ${name}`;

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
		document.querySelectorAll('[onclick="printLables()"]').forEach((btn)=>{btn.addEventListener('click', generateLabel);});

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
							action: 'initPatientTransfer'
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	console.log('IATSERV',message, sender, sendResponse);
	if (message.action === 'noticePing') {
		// If the notice is already present, don't recreate it
		PCX.noticeUpdate();
	}
});
(new Promise(async resolve => {
	await chrome.storage.local.get(['noticeTimerState'], ( noticeTimerState ) => {
		PCX.patientTimer = noticeTimerState.noticeTimerState;
		return resolve()
	});
})).then((resolve)=>{
	if(PCX.patientTimer > (PCX.patientTransfer.Buffer+3)){
		PCX.noticeUpdate();
	}
});