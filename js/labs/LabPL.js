// /js/labs/lab_pl.js
Logger.log('Viewing Prince Laboratories | LabPL Loaded',"INIT");

// Log initial messages and set the lab portal
PCX.setLabPortal("PL");

// Instantiate the IATSERV module
Logger.log("LinkId from URL: "+ (IATSERV.linkId ? IATSERV.linkId : "Login"),"Status");

// Proceed only if the preferred user mode is active
if (PCX.preferredUserMode()) {
	// Configure lab settings
	IATSERV.setLabs({
		2: { Code: "IP", Label: "Ipseity Diagnostics LLC", Stability: { NGS: 90 } },
		1010: { Code: "SQ", Label: "SureQuest Diagnostics", Stability: { NGS: 90 } },
		1011: { Code: "RR", Label: "Reliable Result Labs", Stability: { NGS: 60 } },
		1012: { Code: "PL", Label: "Prince Laboratories", Stability: { NGS: 60 } },
		1013: { Code: "PD", Label: "Principle Diagnostics", Stability: { NGS: 90 } }
	});
	
	// Set test categories for Prince
	IATSERV.setTestCategories({
		1: { Code: "Toxicology", Test: "", Lab: "PL", LabCode: 1012 },
		3: { Code: "PGX", Test: "PHARMA", Lab: "PL", LabCode: 1012 },
		4: { Code: "CGX", Test: "CANCER", Lab: "PD", LabCode: 1013 },
		5: { Code: "STI", Test: "STI", Lab: "PL", LabCode: 1012 },
		6: { Code: "UTI", Test: "UTI", Lab: "PL", LabCode: 1012 },
		7: { Code: "HPV", Test: "HPV", Lab: "PL", LabCode: 1012 },
		8: { Code: "Wound", Test: "WOUND", Lab: "PL", LabCode: 1012 },
		9: { Code: "COVID Flu RSV", Test: "COVID", Lab: "PL", LabCode: 1012 },
		11: { Code: "Immuno", Test: "IMMUNO", Lab: "PL", LabCode: 1012 },
		12: { Code: "Neuro", Test: "NEURO", Lab: "PL", LabCode: 1012 },
		13: { Code: "RPP", Test: "", Lab: "PL", LabCode: 1012 },
		14: { Code: "Eyes Disorder", Test: "EYE", Lab: "PL", LabCode: 1012 },
		15: { Code: "Thyroid", Test: "THYROID", Lab: "PL", LabCode: 1012 },
		16: { Code: "Diabetes", Test: "", Lab: "PL", LabCode: 1012 },
		17: { Code: "Cardio", Test: "CARDIO", Lab: "PL", LabCode: 1012 }
	});
	
	
	// Initialize keybindings
	const keybindings = new Keybinding({
		"n": { type: "open", target: "_accessionNew", url: "https://prince.iatserv.com/?LinkId=2011&type=acs&_ml=7&_mlp=5", whitelist: ["LinkId=2011", "LinkId=2071"] },
		"shift+n": { type: "open", target: "_accessionList", url: "https://prince.iatserv.com/?LinkId=2070&_ml=9&_mlp=5", whitelist: ["LinkId=2070"] },
		"d": { type: "open", target: "_locationNew", url: "https://prince.iatserv.com/?LinkId=2006&_ml=30&_mlp=12", whitelist: ["LinkId=2006"] },
		"shift+d": { type: "open", target: "_locationList", url: "https://prince.iatserv.com/?LinkId=2004&_ml=31&_mlp=12", whitelist: ["LinkId=2004"] }
	});
	
// Routing logic based on the current page

	// Locations
	if (IATSERV.linkId == "2004") {
		PCX.processEnabled('Interface','Location List Enhanced Columns', IATSERV.locations);
	}

	// Reports
	if (IATSERV.linkId == "6001") {
		PCX.processEnabled('Interface','Reports Enhanced Columns', IATSERV.reports);
	}

	// Accession List(LinkId "2070")
	if (IATSERV.linkId === "2070") {
		PCX.processEnabled("Interface", "Accession List Enhanced Columns",IATSERV.accessionList);
	}

	// Create Accession (LinkId "2011" and type "acs")
	if (IATSERV.linkId === "2011" && IATSERV.type === "acs") {
		PCX.processEnabled("SOP", "New Accession Workflow", () => {
			IATSERV.setSelectors({
				DOS				: ".dos",
				BillType		: "#MainContent_ctl00_ctl00_ddBillType_ddControl",
				locationInput	: "#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbLocation_tbText",
				Status			: "#ddNewAccessionStatus",
				Physician		: "#ddPhysician",
				PhysicianOptions: "#ddPhysician option",
				newPatientBtn	: "#btnAddEditPatient",
				DOC				: "#MainContent_ctl00_ctl00_tbCollectionDateTime_tbDate_tbText",
				FancyBox		: ".fancybox-overlay.fancybox-overlay-fixed iframe",
				Iframe			: '[class="fancybox-iframe"',
				IframeDOB		: "#MainContent_ctl00_tbDOB_tbText",
				IframeForm		: "#form1",
				PhysicianId		: "#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbPhysicianId",
				PhysicianName	: "#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbPhysicianName",
				Category		: "#MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_ddTestCategory",
				CategoryOpt		: "#MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_ddTestCategory option:checked",
				TestCodesInput	: "#MainContent_ctl00_ctl00_ctrlTestCodes_tbList_tbText",
				TestCodesOutput	: "#dvSelectedItems",
				UpPanel			: "#MainContent_ctl00_ctl00_upPanel",
				UploadTable		: "#uploadTable",
				UploadSpan		: ".upload span",
				ICDCodesInput	: "#MainContent_ctl00_ctl00_ctrlICDCodes_tbList_tbText",
				PreformingLab	: "#ddPerformingLabId",
				StateDropdown	: "#MainContent_ctl00_AddressControl1_CountryState_ddState",
				InsuranceLookup	: "#MainContent_ctl00_PrimaryInsurance_tbInsurance_tbText",
				InsuranceID		: "#MainContent_ctl00_PrimaryInsurance_tbInsurance_tbID",
				InsuranceList	: "#ui-id-2",


				// Disable Tab Index
				SearchPatient	: '#btnAddEditPatient+#btnSearchPatient',
				PatientCode		: '#tbPatientCode',
				PatientDOB		: '#tbPatientDOB',
				PatientAddress	: '#tbPatientAddress',
				PatientPhone	: '#tbPatientPhone',
				PatientEmail	: '#tbPatientEmail',
				PrimaryInsurance			: '#tbPrimaryInsurance',
				PrimaryInsurancePolicy		: '#tbPrimaryInsurancePolicy',
				PrimaryInsuranceGroup		: '#tbPrimaryInsuranceGroup',
				SecondaryInsurance			: '#tbSecondaryInsurance',
				SecondaryInsurancePolicy	: '#tbSecondaryInsurancePolicy',
				SecondaryInsuranceGroup		: '#tbSecondaryInsuranceGroup',
				SpecimenType	: '#MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_ddSpecimenType',
				Quantity		: '#MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_tbQuantity_tbText',
				Requisition		: '#tbRequisition',
				DOCTime			: '#MainContent_ctl00_ctl00_tbCollectionDateTime_tbTime_I',
				ReceivedDate	: '#MainContent_ctl00_ctl00_tbReceivedDateTime_tbDate_tbText',
				ReceivedTime	: '#MainContent_ctl00_ctl00_tbReceivedDateTime_tbTime_I',
				ClearBTN		: '#dvClearItems a',
				Medication		: '#MainContent_ctl00_ctl00_ctrlMedications_tbList_tbText',
				MedicationBTN	: '#MainContent_ctl00_ctl00_ctrlMedications_tbList_tbText~.input-group-btn button',
				OtherMedication	: '#tbOtherMedication',
				PhySigCaptured	: '#ddPhysicianSignatureCaptured',
				PTSigCaptured	: '#ddPatientSignatureCaptured',
				SigSuccess		: '#MainContent_ctl00_ctl00_SignaturePad2_SignaturePanel .btn-success',
				SigClear		: '#MainContent_ctl00_ctl00_SignaturePad2_SignaturePanel .btn-danger',
				SigToggle		: '#MainContent_ctl00_ctl00_SignaturePad2_SignaturePanel .btn-default',

				//Iframe Disable Tab Index
				SSN				: '#MainContent_ctl00_tbSSN',
				LicenseState	: '#MainContent_ctl00_ddDriverLicenseState',
				LicenseNumber	: '#MainContent_ctl00_tbDriverLicenseNumber',
				CopyColumnBTN1	: '.copy-pat1 a',
				CopyColumnBTN2	: '.copy-pat2 a',
				CopyColumnBTN3	: '.copy-adrs1 a',
				CopyColumnBTN4	: '.copy-adrs2 a',
				PrimeRelation	: '#MainContent_ctl00_PrimaryInsurance_ddInsuredRelationShip_ddControl',
				PrimeFirstName	: '#MainContent_ctl00_PrimaryInsurance_tbFirstName',
				PrimeLastName	: '#MainContent_ctl00_PrimaryInsurance_tbLastName',
				PrimeMiddleName	: '#MainContent_ctl00_PrimaryInsurance_tbMiddleName',
				PrimeDOB		: '#MainContent_ctl00_PrimaryInsurance_tbDOB_tbText',
				PrimeSSN		: '#MainContent_ctl00_PrimaryInsurance_tbSSN',
				PrimeGender		: '#MainContent_ctl00_PrimaryInsurance_ddGender_ddControl',
				PrimeGroupNo	: '#MainContent_ctl00_PrimaryInsurance_tbGroupNo',
				PrimeCovStart	: '#MainContent_ctl00_PrimaryInsurance_tbCoverageStartDate_tbText',
				PrimeCovEnd		: '#MainContent_ctl00_PrimaryInsurance_tbCoverageEndDate_tbText',
				PrimeAddress1	: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbAddress1',
				PrimeAddress2	: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbAddress2',
				PrimeState		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_CountryState_ddState',
				PrimeCity		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbCity',
				PrimeZip		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbZipCode',
				PrimePhone		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbPhone',
				PrimeFax		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbFax',
				PrimeEmail		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbEmail',
				SeconRelation	: '#MainContent_ctl00_SecondaryInsurance_ddInsuredRelationShip_ddControl',
				SeconFirstName	: '#MainContent_ctl00_SecondaryInsurance_tbFirstName',
				SeconLastName	: '#MainContent_ctl00_SecondaryInsurance_tbLastName',
				SeconMiddleName	: '#MainContent_ctl00_SecondaryInsurance_tbMiddleName',
				SeconDOB		: '#MainContent_ctl00_SecondaryInsurance_tbDOB_tbText',
				SeconSSN		: '#MainContent_ctl00_SecondaryInsurance_tbSSN',
				SeconGender		: '#MainContent_ctl00_SecondaryInsurance_ddGender_ddControl',
				SeconGroupNo	: '#MainContent_ctl00_SecondaryInsurance_tbGroupNo',
				SeconCovStart	: '#MainContent_ctl00_SecondaryInsurance_tbCoverageStartDate_tbText',
				SeconCovEnd		: '#MainContent_ctl00_SecondaryInsurance_tbCoverageEndDate_tbText',
				Seconddress1	: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbAddress1',
				Seconddress2	: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbAddress2',
				SeconState		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_CountryState_ddState',
				SeconCity		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbCity',
				SeconZip		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbZipCode',
				SeconPhone		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbPhone',
				SeconFax		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbFax',
				SeconEmail		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbEmail',
				Cancel			: '#MainContent_ctl00_btnCancel'
			});

			IATSERV.createAccession();
		});
	}
	
	// Update Accession (LinkId "2071")
	if (IATSERV.linkId == "2071") {

		IATSERV.setSelectors({
			DOS				: ".dos",
			DOC				: "#MainContent_ctl00_tbCollectionDateTime_tbDate_tbText",
			newPatientBtn	: "#lblAddPatientTitle",
			Category		: "#MainContent_ctl00_ctrlOrderTestCategoryControl_ddTestCategory",
			CategoryOpt		: "#MainContent_ctl00_ctrlOrderTestCategoryControl_ddTestCategory option:checked",
			Iframe			: '[class="fancybox-iframe"',
			FirstName		: '#tbFirstName',
			LastName		: '#tbLastName',
			MiddleName		: '#MainContent_ctl00_tbMiddleName',
			DOB				: '#MainContent_ctl00_tbDOB_tbText',
			Gender			: '#MainContent_ctl00_ddGender_ddControl option:checked',
			Race			: '#MainContent_ctl00_ddRace_ddControl option:checked',
			Address1		: '#MainContent_ctl00_AddressControl1_tbAddress1',
			Address2		: '#MainContent_ctl00_AddressControl1_tbAddress2',
			StateDropdown	: '#MainContent_ctl00_AddressControl1_CountryState_ddState',
			State			: '#MainContent_ctl00_AddressControl1_CountryState_ddState option:checked',
			City			: '#MainContent_ctl00_AddressControl1_tbCity',
			Zip				: '#MainContent_ctl00_AddressControl1_tbZipCode',
			Phone			: '#MainContent_ctl00_AddressControl1_tbPhone',
			Email			: '#MainContent_ctl00_AddressControl1_tbEmail',
			UploadTable		: '#uploadTable',
			UploadSpan		: '.upload span'
		});
		PCX.processEnabled('Interface','Show Stablity Notice',
			()=>{QAManager.setStablityNotice(
				IATSERV.selectors.DOS,
				IATSERV.getEl(IATSERV.selectors.DOC).value,
				true
			)}
		);

		// Add BTN to copy PT data
		PCX.processEnabled('SOP','Patient Referrence Lab Transfer',IATSERV.capturePTData);

		PCX.processEnabled('Interface','Enabled FileDrop',
			()=>{IATSERV.fileDrop({
				enabled	: true,
				acsNum	: IATSERV.getEl("#MainContent_ctl00_tbAccession").value,
				acsID	: IATSERV.getEl("#tbAccessionId").value,
				patient	: IATSERV.getEl("#MainContent_ctl00_tbPatient_tbText").value.toUpperCase().split(', ')
			},false,false,"#dvFooter")}
		);

		PCX.processEnabled('SOP','REQ Filename to Clipboard on Scan',IATSERV.scanFilenamer);


		
		let files = [];
			IATSERV.getEls('[id^="MainContent_ctl00_ObjectDocuments1_ObjectDocuments_Exists_GridView1_lblTitle_"]').forEach((file)=>{files.push(file.innerText);});
		let data = {
			acsNum	: IATSERV.getEl("#MainContent_ctl00_tbAccession").value,
			acsID	: IATSERV.getEl("#tbAccessionId").value,
			location: IATSERV.getEl("#MainContent_ctl00_tbLocation_tbText").value,
			req		: IATSERV.scanFilenamer(true)+".pdf",
			patient	: IATSERV.getEl("#MainContent_ctl00_tbPatient_tbText").value.toUpperCase().split(', '),
			ptID	: IATSERV.getEl("#MainContent_ctl00_tbPatient_tbID").value,
			dob		: IATSERV.getEl("#tbPatientDOB").value,
			doc		: IATSERV.getEl("#MainContent_ctl00_tbCollectionDateTime_tbDate_tbText").value,
			rd		: IATSERV.getEl("#MainContent_ctl00_tbReceivedDateTime_tbDate_tbText").value,
			lab		: IATSERV.getEl("#ddPerformingLabId option:checked").innerText,
			test	: IATSERV.getEl("#MainContent_ctl00_ctrlOrderTestCategoryControl_ddTestCategory option:checked").innerText,
			files	: files
		};




		const pageData = {
			acsNum: { selector: "#MainContent_ctl00_tbAccession", default: "" },
			acsID: { selector: "#tbAccessionId", default: "" },
			location: { selector: "#MainContent_ctl00_tbLocation_tbText", default: "" },
			req: { 
				preprocess: () => IATSERV.scanFilenamer(true) + ".pdf",
				default: ""
			},
			patient: { 
				selector: "#MainContent_ctl00_tbPatient_tbText", 
				preprocess: (value) => value.toUpperCase().split(', ')
			},
			ptID: { selector: "#MainContent_ctl00_tbPatient_tbID", default: "" },
			dob: { selector: "#tbPatientDOB", default: "" },
			doc: { selector: "#MainContent_ctl00_tbCollectionDateTime_tbDate_tbText", default: "" },
			rd: { selector: "#MainContent_ctl00_tbReceivedDateTime_tbDate_tbText", default: "" },
			lab: { 
				selector: "#ddPerformingLabId option:checked", 
				preprocess: (value, el) => el ? el.innerText : ""
			},
			test: { 
				selector: "#MainContent_ctl00_ctrlOrderTestCategoryControl_ddTestCategory option:checked", 
				preprocess: (value, el) => el ? el.innerText : ""
			},
			files: { 
				selector: '[id^="MainContent_ctl00_ObjectDocuments1_ObjectDocuments_Exists_GridView1_lblTitle_"]',
				multiple: true,
				preprocess: (value, el, elements) => Array.from(elements).map(file => file.innerText)
			},
			pageTemplate: { 
				default: IATSERV.linkId
			},
			sidePanelTemplate: { 
				default: IATSERV.linkId
			}
		};

		PCX.monitorPageData(pageData);

	}

	// Patient
	if (IATSERV.linkId == "2022") {	
		Logger.log('IATSERV 2022','Note');
		// Reduce tab indices for elements inside the FancyBox.
		PCX.processEnabled("Interface", "Reduce Tabable Inputs", () => {
			const el = {
			SSN				: '#MainContent_ctl00_tbSSN',
			LicenseState	: '#MainContent_ctl00_ddDriverLicenseState',
			LicenseNumber	: '#MainContent_ctl00_tbDriverLicenseNumber',
			CopyColumnBTN1	: '.copy-pat1 a',
			CopyColumnBTN2	: '.copy-pat2 a',
			CopyColumnBTN3	: '.copy-adrs1 a',
			CopyColumnBTN4	: '.copy-adrs2 a',
			PrimeRelation	: '#MainContent_ctl00_PrimaryInsurance_ddInsuredRelationShip_ddControl',
			PrimeFirstName	: '#MainContent_ctl00_PrimaryInsurance_tbFirstName',
			PrimeLastName	: '#MainContent_ctl00_PrimaryInsurance_tbLastName',
			PrimeMiddleName	: '#MainContent_ctl00_PrimaryInsurance_tbMiddleName',
			PrimeDOB		: '#MainContent_ctl00_PrimaryInsurance_tbDOB_tbText',
			PrimeSSN		: '#MainContent_ctl00_PrimaryInsurance_tbSSN',
			PrimeGender		: '#MainContent_ctl00_PrimaryInsurance_ddGender_ddControl',
			PrimeGroupNo	: '#MainContent_ctl00_PrimaryInsurance_tbGroupNo',
			PrimeCovStart	: '#MainContent_ctl00_PrimaryInsurance_tbCoverageStartDate_tbText',
			PrimeCovEnd		: '#MainContent_ctl00_PrimaryInsurance_tbCoverageEndDate_tbText',
			PrimeAddress1	: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbAddress1',
			PrimeAddress2	: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbAddress2',
			PrimeState		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_CountryState_ddState',
			PrimeCity		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbCity',
			PrimeZip		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbZipCode',
			PrimePhone		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbPhone',
			PrimeFax		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbFax',
			PrimeEmail		: '#MainContent_ctl00_PrimaryInsurance_AddressControl1_tbEmail',
			SeconRelation	: '#MainContent_ctl00_SecondaryInsurance_ddInsuredRelationShip_ddControl',
			SeconFirstName	: '#MainContent_ctl00_SecondaryInsurance_tbFirstName',
			SeconLastName	: '#MainContent_ctl00_SecondaryInsurance_tbLastName',
			SeconMiddleName	: '#MainContent_ctl00_SecondaryInsurance_tbMiddleName',
			SeconDOB		: '#MainContent_ctl00_SecondaryInsurance_tbDOB_tbText',
			SeconSSN		: '#MainContent_ctl00_SecondaryInsurance_tbSSN',
			SeconGender		: '#MainContent_ctl00_SecondaryInsurance_ddGender_ddControl',
			SeconGroupNo	: '#MainContent_ctl00_SecondaryInsurance_tbGroupNo',
			SeconCovStart	: '#MainContent_ctl00_SecondaryInsurance_tbCoverageStartDate_tbText',
			SeconCovEnd		: '#MainContent_ctl00_SecondaryInsurance_tbCoverageEndDate_tbText',
			Seconddress1	: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbAddress1',
			Seconddress2	: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbAddress2',
			SeconState		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_CountryState_ddState',
			SeconCity		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbCity',
			SeconZip		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbZipCode',
			SeconPhone		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbPhone',
			SeconFax		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbFax',
			SeconEmail		: '#MainContent_ctl00_SecondaryInsurance_AddressControl1_tbEmail',
			Cancel			: '#MainContent_ctl00_btnCancel'};
			const removeSelectors = [
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
			IATSERV.disableTabIndex(removeSelectors);
		});
	}


	// Results
	if (IATSERV.linkId == "2461") {
		IATSERV.setSelectors({
			UploadTable	: '#uploadTable',
			UploadSpan	: '.upload span'
		});

		PCX.processEnabled('Interface','Enabled FileDrop',
			()=>{IATSERV.fileDrop({
				enabled	: true,
				acsNum	: IATSERV.getEl("#lblAccession a").textContent,
				acsID	: IATSERV.getEl("#lblAccession a").href.match(/(\d*)$/gm)[0],
				patient	: IATSERV.getEl("#lblPatient").textContent.toUpperCase().split(' '),
				result	: true
			},false,false,"#dvFooter")}
		);
	}

	// Update Location
	if (IATSERV.linkId == "2001") {
		checkAndReplaceIframe();
	}
	function checkAndReplaceIframe(){
		waitForElm(".fancybox-iframe").then((iframe)=> {
			waitForIframeElm(".fancybox-iframe","#MainContent_ctl00_tbName").then((input)=> {
				input.value=input.value.replace(/[,.\"]/,"");
				waitForElm(".fancybox-close").then((close)=> {
					close.addEventListener('click', ()=>{
						delay(1000).then(checkAndReplaceIframe);
					});
				});
			});
		})
	}
}


if (PCX.currentUser() === "Joel") {
	if (IATSERV.linkId === "2011" && IATSERV.type === "acs") {
		if (Math.random() > 0.9) { // 10% chance
			IATSERV.getEl("#MainContent_ctl00_ctl00_ctl01_btnCreateAccession", true)
				.addEventListener("click", () => {
					const easterEgg = IATSERV.createDOM("img", {
						src: "https://i.giphy.com/VgGpnYeMVljm1vRA6g.webp",
						id: "easterEgg"
					});
					const btnRect = IATSERV.getEl("#MainContent_ctl00_ctl00_ctl01_btnCreateAccession")
						.getBoundingClientRect();
					easterEgg.setAttribute(
						"style",
						`position:absolute; top:${btnRect.top + window.scrollY - 300}px; left:${btnRect.left + window.scrollX - 150}px`
					);
					document.body.appendChild(easterEgg);
				});
		}
	}
}
