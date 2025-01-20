PCX.log("Reliable Results Labs");
PCX.setLabPortal('RR');

if(PCX.preferedUserMode()) {
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
	//	-1: {Code:"Diabetes",				Test:""},				// -- 
	//	-1: {Code:"HPV",					Test:"HPV"},			// Panel - HPV Panel
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
		30: {Code:"COVID-19",				Test:"COVID"}		// Panel - COVID-19
	});
	
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
	});

	IATSERV.setGenderTranslation({
		Male	: 1,
		Female	: 2
	});

	IATSERV.setRaceTranslation({
		"African American"	: 1,
		"Hispanic"			: 2,
		"Caucasian"			: 3,
		"Mixed Race"		: 4,
		"Mixed"				: 4,
		"Asian"				: 5,
		"Native American"	: 6,
		"Other"				: 7,
		"Jewish (Ashkenazi)": 8
	});

	IATSERV.setOrderDefaults({
		Location		: "Prince",
		Physician		: '1896', //Prince, Laboratories
		BillTo			: '3', //Client
		PhysicianName	: 'Prince, Laboratories'
	});


	// Results List
	if (IATSERV.linkId == "2024") {
		IATSERV.setSelectors({
			UpdatePanel		: "#MainContent_ctl00_updatePanel1",
			DXHeaderRow		: "#MainContent_ctl00_grid_DXHeadersRow0",
			TDCheckedClass	: "dxgvSelectedRow_Metropolis",
			TDCheckBox		: "td:first-child span",
			BoxUnchecked	: "dxWeb_edtCheckBoxUnchecked_Metropolis",
			BoxChecked		: "dxWeb_edtCheckBoxChecked_Metropolis"
		});
		IATSERV.resultsDownloader();
	}

	//Create Order
	if (IATSERV.linkId == "2011") { 


		/********************************************
		*
		* Import Patient Data from Local Temp Cache.
		*
		*********************************************/

		IATSERV.setSelectors({
			Location		: '#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbLocation_tbText',
			LocationMenu	: "#ui-id-1 .ui-menu-item",
			Physician		: '#ddPhysician',
			PhysicianOptions: '#ddPhysician option',
			PhysicianId		: '#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbPhysicianId',
			PhysicianName	: '#MainContent_ctl00_ctl00_ctrlLocationPhysicianPatient_LocationPhysician_tbPhysicianName',
			BillTo			: '#MainContent_ctl00_ctl00_ddBillType_ddControl',
			Category		: "#MainContent_ctl00_ctl00_ctrlOrderTestCategoryControl1_ddTestCategory",
			DOC				: "#MainContent_ctl00_ctl00_tbCollectionDateTime_tbDate_tbText",
			FirstName		: '#tbFirstName',
			LastName		: '#tbLastName',
			MiddleName		: '#MainContent_ctl00_tbMiddleName',
			DOB				: '#MainContent_ctl00_tbDOB_tbText',
			Gender			: '#MainContent_ctl00_ddGender_ddControl',
			Race			: '#MainContent_ctl00_ddRace_ddControl',
			Address			: [
								'#MainContent_ctl00_AddressControl1_tbAddress1',
								'#MainContent_ctl00_AddressControl1_tbAddress2'
							  ],
			State			: '#MainContent_ctl00_AddressControl1_CountryState_ddState',
			City			: '#MainContent_ctl00_AddressControl1_tbCity',
			Zip				: '#MainContent_ctl00_AddressControl1_tbZipCode',
			Phone			: '#MainContent_ctl00_AddressControl1_tbPhone',
			Email			: '#MainContent_ctl00_AddressControl1_tbEmail',
			NewPatientBTN	: '#btnAddEditPatient',
			TestCodesInput	: '#MainContent_ctl00_ctl00_ctrlTestCodes_tbList_tbText',
			TestCodesOutput	: '#dvSelectedItems',
			FancyBox		: '.fancybox-overlay.fancybox-overlay-fixed iframe',
			UpPanel			: '#MainContent_ctl00_ctl00_upPanel',
			StateDropdown	: '#MainContent_ctl00_AddressControl1_CountryState_ddState',
			InsuranceLookup	: '#MainContent_ctl00_PrimaryInsurance_tbInsurance_tbText',
			InsuranceList	: '#ui-id-2',
		});


		IATSERV.createOrder(()=>{
			PCX.getEl("#noticeDisplay").appendChild(
				PCX.createDOM('span', {
					textContent: 'Paste Patient Data',
					id: 'patientDataClone'
				})
			);

			PCX.getEl("#patientDataClone").addEventListener('click', function(event) {
				IATSERV.pastePatientData();
			});
		});
	}
}