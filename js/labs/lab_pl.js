PCX.log("This is PL specific content script.");

IATSERV.setLabs({
	   2: {Code:"IP",Label:"Ipseity Diagnostics LLC", Stability:{NGS: 90}},
	1010: {Code:"SQ",Label:"SureQuest Diagnostics", Stability:{NGS: 90}},
	1011: {Code:"RR",Label:"Reliable Result Labs", Stability:{NGS: 30}},
	1012: {Code:"PL",Label:"Prince Laboratories", Stability:{NGS: 30}},
	1013: {Code:"PD",Label:"Principle Diagnostics", Stability:{NGS: 90}}
});

IATSERV.setTestCategories({
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
});


// Accession List
if (IATSERV.linkId == "2070") {
	const intervalID = setInterval(IATSERV.columnParser, 500);
}
// Create Accession
if (IATSERV.linkId == "2011") {

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
		CategoryOpt		: "#MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_ddTestCategory option:checked",
		TestCodesInput	: "#MainContent_ctl00_ctl00_ctrlTestCodes_tbList_tbText",
		TestCodesOutput	: "#dvSelectedItems",
		UpPanel			: "#MainContent_ctl00_ctl00_upPanel"
	});
	IATSERV.createAccession();
}

// Update Accession
if (IATSERV.linkId == "2071") {
	IATSERV.setSelectors({
		DOS				: ".dos",
		DOC				: "#MainContent_ctl00_tbCollectionDateTime_tbDate_tbText",
		newPatientBtn	: "#btnAddEditPatient",
		CategoryOpt		: "#MainContent_ctl00_ctrlOrderTestCategoryControl_ddTestCategory option:checked",
		Iframe			: '[class="fancybox-iframe"',
		FirstName		: '#tbFirstName',
		LastName		: '#tbLastName',
		MiddleName		: '#MainContent_ctl00_tbMiddleName',
		DOB				: '#MainContent_ctl00_tbDOB_tbText',
		Gender			: '#MainContent_ctl00_ddGender_ddControl option:checked',
		Race			: '#MainContent_ctl00_ddRace_ddControl option:checked',
		Address1		: '#MainContent_ctl00_AddressControl1_tbAddress1',
		Address3		: '#MainContent_ctl00_AddressControl1_tbAddress2',
		State			: '#MainContent_ctl00_AddressControl1_CountryState_ddState option:checked',
		City			: '#MainContent_ctl00_AddressControl1_tbCity',
		Zip				: '#MainContent_ctl00_AddressControl1_tbZipCode',
		Phone			: '#MainContent_ctl00_AddressControl1_tbPhone',
		Email			: '#MainContent_ctl00_AddressControl1_tbEmail',
		UploadTable		: '#uploadTable',
		UploadSpan		: '.upload span',
	});
	QAManager.setStablityNotice(IATSERV.selectors.DOS,PCX.getEl(IATSERV.selectors.DOC).value, true);



	// Site Assets

	// Add BTN to copy PT data
	function capturePTData() {
		IATSERV.capturePTData();
	}


	PCX.getEl(IATSERV.selectors.newPatientBtn).addEventListener('click', function(event) {
		const siteAssets = document.createElement('div');
		siteAssets.id = 'siteAssets';
		// Add a button to capture PL data
		const plButton = document.createElement('span');
		plButton.textContent = '⎘';
		plButton.id = 'patientCopy';
		plButton.title = 'Capture Patient Record';
		plButton.onclick = capturePLData;
		siteAssets.appendChild(plButton);
		waitForElm('.fancybox-iframe').then((elm) => {
			PCX.getEl('.fancybox-overlay').appendChild(siteAssets);
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
	const 	dropArea	= PCX.getEl(IATSERV.selectors.UploadTable).closest('*');
	const 	acceptTypes = PCX.getEl(IATSERV.selectors.UploadTable+' input[type="file"]').getAttribute('accept').split(',');

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

			if(PCX.getEl(IATSERV.selectors.UploadSpan).textContent == "Drop File"){
				PCX.getEl(IATSERV.selectors.UploadSpan).textContent = "Choose File";
			}
		}
		if(e.dataTransfer.files.length > 0) {
			for (const [i, file] of Object.entries(e.dataTransfer.files)) {
				let fileExt = file.name.split('.').pop();
				let fileName = file.name.replace('.'+fileExt,'');
				if (acceptTypes.findIndex(function (a) { return a.toLowerCase() == ('.' + fileExt).toLowerCase() }) == -1) {
					//return; // File not accepted
				}

				let acsNum 	= PCX.getEl("#MainContent_ctl00_tbAccession").value; // LIMS ID
				let acsID 	= PCX.getEl("#tbAccessionId").value; // System ID (database)
				let patient	= PCX.getEl("#MainContent_ctl00_tbPatient_tbText").value.toUpperCase().split(', ');
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
			PCX.getEl('.upload span').textContent = "Drop File";
		}
	}
	function dropZoneTimeOut(isDragging, e) {
		if (e.target === window || (e.clientX === 0 && e.clientY === 0)) {
			isDragging = false;
			if (document.body.classList.contains('dropZoneKeepAlive')) {
				document.body.classList.remove('dropZoneKeepAlive');
				PCX.getEl('.upload span').textContent = "Choose File";
			}
		}
	}
}

if (IATSERV.linkId == "2461") {
	/**
 *
 * File Drop
 *
 * Expands the Drop area of file upload and applies a QA Check
 * 
 */
	let 	isDragging 	= false;
	const 	dropArea	= PCX.getEl('#uploadTable').closest('*');
	const 	acceptTypes = PCX.getEl('#uploadTable input[type="file"]').getAttribute('accept').split(',');

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

			if(PCX.getEl('.upload span').textContent == "Drop File"){
				PCX.getEl('.upload span').textContent = "Choose File";
			}
		}
		if(e.dataTransfer.files.length > 0) {
			for (const [i, file] of Object.entries(e.dataTransfer.files)) {
				let fileExt = file.name.split('.').pop();
				let fileName = file.name.replace('.'+fileExt,'');
				if (acceptTypes.findIndex(function (a) { return a.toLowerCase() == ('.' + fileExt).toLowerCase() }) == -1) {
					return; // File not accepted
				}

				let acsNum 	= PCX.getEl("#lblAccession a").textContent; // LIMS ID
				let acsID 	= PCX.getEl("#lblAccession a").href.match(/(\d*)$/gm)[0]; // System ID (database)
				let patient	= PCX.getEl("#lblPatient").textContent.toUpperCase().split(' ');
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
			PCX.getEl('.upload span').textContent = "Drop File";
		}
	}
	function dropZoneTimeOut(isDragging, e) {
		if (e.target === window || (e.clientX === 0 && e.clientY === 0)) {
			isDragging = false;
			if (document.body.classList.contains('dropZoneKeepAlive')) {
				document.body.classList.remove('dropZoneKeepAlive');
				PCX.getEl('.upload span').textContent = "Choose File";
			}
		}
	}
}

