PCX.log("Prince Laboratories");
PCX.log(IATSERV.linkId);

IATSERV.setLabs({
	   2: {Code:"IP",	Label:"Ipseity Diagnostics LLC",Stability:{NGS: 90}},
	1010: {Code:"SQ",	Label:"SureQuest Diagnostics", 	Stability:{NGS: 90}},
	1011: {Code:"RR",	Label:"Reliable Result Labs", 	Stability:{NGS: 30}},
	1012: {Code:"PL",	Label:"Prince Laboratories", 	Stability:{NGS: 30}},
	1013: {Code:"PD",	Label:"Principle Diagnostics", 	Stability:{NGS: 90}}
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
		UpPanel			: "#MainContent_ctl00_ctl00_upPanel",
		UploadTable		: '#uploadTable',
		UploadSpan		: '.upload span',
		ICDCodesInput	: '#MainContent_ctl00_ctl00_ctrlICDCodes_tbList_tbText'
	});
	IATSERV.createAccession();

	IATSERV.fileDrop({
		enabled:false
	});
}

// Update Accession
if (IATSERV.linkId == "2071") {
console.log("Update Accession");
	IATSERV.setSelectors({
		DOS				: ".dos",
		DOC				: "#MainContent_ctl00_tbCollectionDateTime_tbDate_tbText",
		newPatientBtn	: "#lblAddPatientTitle",
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
		State			: '#MainContent_ctl00_AddressControl1_CountryState_ddState option:checked',
		City			: '#MainContent_ctl00_AddressControl1_tbCity',
		Zip				: '#MainContent_ctl00_AddressControl1_tbZipCode',
		Phone			: '#MainContent_ctl00_AddressControl1_tbPhone',
		Email			: '#MainContent_ctl00_AddressControl1_tbEmail',
		UploadTable		: '#uploadTable',
		UploadSpan		: '.upload span'
	});
	QAManager.setStablityNotice(
		IATSERV.selectors.DOS,
		PCX.getEl(IATSERV.selectors.DOC).value,
		true
	);

	// Add BTN to copy PT data
	IATSERV.capturePTData();

	IATSERV.fileDrop({
		enabled	: true,
		acsNum	: PCX.getEl("#MainContent_ctl00_tbAccession").value,
		acsID	: PCX.getEl("#tbAccessionId").value,
		patient	: PCX.getEl("#MainContent_ctl00_tbPatient_tbText").value.toUpperCase().split(', ')
	});
}

// Results
if (IATSERV.linkId == "2461") {
	IATSERV.setSelectors({
		UploadTable	: '#uploadTable',
		UploadSpan	: '.upload span'
	});

	IATSERV.fileDrop({
		enabled	: true,
		acsNum	: PCX.getEl("#lblAccession a").textContent,
		acsID	: PCX.getEl("#lblAccession a").href.match(/(\d*)$/gm)[0],
		patient	: PCX.getEl("#lblPatient").textContent.toUpperCase().split(' '),
		result	: true
	});
}

