console.log("Principle Diagnostics");
PCX.setLabPortal('PD');

console.log(DXRESULTS.location);

if(PCX.preferedUserMode()) {
	const isOrderPage = ["PGx","CGX","ImmunodeficiencyReq.aspx","Neurology"].includes(DXRESULTS.location);

	DXRESULTS.setCategoryTranslation({
		 3:"PGx",						// PGX
		 4:"CGX",						// CGX
		11:"ImmunodeficiencyReq.aspx",	// Immuno
		12:"Neurology",					// Neuro
		 1:-1,	// Toxicology	- Prince only
		 5:-1,	// STI			- Prince only
		 6:-1,	// UTI			- Prince only
		 7:-1,	// HPV			- Prince only
		 8:-1,	// Wound		- Prince only
		 9:-1,	// COVID		- Prince only
		13:-1,	// RPP			- Prince only
		14:-1,	// Eyes			- Prince only
		15:-1,	// Thyroid		- Prince only
		16:-1,	// Diabetes		- Prince only
		17:-1	// Cardio		- Prince only
	});

	DXRESULTS.setRaceTranslation({
		"African American"	: ["Not Specified",		"African American"],
		"Hispanic"			: ["Hispanic/Latino",	"Other"],
		"Caucasian"			: ["Not Specified",		"Caucasian"],
		"Mixed Race"		: ["Not Specified",		"Other"],
		"Mixed"				: ["Not Specified",		"Other"],
		"Asian"				: ["Not Specified",		"Asian"],
		"Native American"	: ["Not Specified",		"Other"],
		"Other"				: ["Not Specified",		"Other"],
		"Jewish (Ashkenazi)": ["Not Specified",		"Jewish (Ashkenzai)"]
	});

	DXRESULTS.setOrderDefaults({
		Physician		: '99488', //Prince Laboratories LLC|          |8888888888
		ICDCode			: 'Z00.00'
	});
	
	if(isOrderPage) {
		const selectors = {
			FirstName		: '#ContentPlaceHolder1_txtFirstName',
			LastName		: '#ContentPlaceHolder1_txtLastName',
			DOBMonth		: '#ContentPlaceHolder1_ucDateSelector_ddlMonth',
			DOBDay			: '#ContentPlaceHolder1_ucDateSelector_ddlDay',
			DOBYear			: '#ContentPlaceHolder1_ucDateSelector_ddlYear',
			Address			: '#ContentPlaceHolder1_txtAddress1',
			City			: '#ContentPlaceHolder1_txtCity',
			State			: '#ContentPlaceHolder1_ddlStates',
			Zip				: '#ContentPlaceHolder1_txtZipCode',
			Email			: '#ContentPlaceHolder1_txtEmail',
			Phone			: '#ContentPlaceHolder1_txtphone',
			Gender			: 	{
				"Male"					:'#ContentPlaceHolder1_rblGender_0',
				"Female"				:'#ContentPlaceHolder1_rblGender_1'},
			Ethnicity		: 	{
				"Hispanic/Latino"		: '#ContentPlaceHolder1_rdrace_1',
				"Not Specified"			: '#ContentPlaceHolder1_rdrace_2'},
			Race		: 	{
				"African American"		: '#ContentPlaceHolder1_rdethnicity_0',
				"Caucasian"				: '#ContentPlaceHolder1_rdethnicity_1',
				"Jewish (Ashkenzai)"	: '#ContentPlaceHolder1_rdethnicity_2',
				"Asian"					: '#ContentPlaceHolder1_rdethnicity_4',
				"Other"					: '#ContentPlaceHolder1_rdethnicity_5'},
			DOC				: "#ContentPlaceHolder1_txtdoc",
			ICDCode			: "#ContentPlaceHolder1_txtcode",
			ICDCodeAdd		: "#ContentPlaceHolder1_divicd10code .col-md-4 a.btn-default.btn.purple",
			Physician		: "#ContentPlaceHolder1_ddlPhyName"
		}

		if(DXRESULTS.location == "PGX") {
			selectors['TestPanel'] = "";
		}

		if(DXRESULTS.location == "CGX") {
			selectors['TestPanel'] = "#cbpanel5889";
		}

		if(DXRESULTS.location == "Immuno") {
			selectors['TestPanel'] = "#cbpanel5890";
		}

		if(DXRESULTS.location == "Neuro") {
			selectors['TestPanel'] = "#cbpanel5891";
		}
		DXRESULTS.setSelectors(selectors);
		DXRESULTS.createOrder();
	}


	if(DXRESULTS.location == "ViewRequisitionOrders") {
		// Order filter - Show/Hide Read toggle
		function initCheckboxes() {
			const filterElement = document.getElementById('ViewActiveRequsitions_filter');
			if (!filterElement) {
					// If not found, check again after a short delay
					setTimeout(initCheckboxes, 100); // Poll every 100ms
					return;
			}

			// Create the form-group div
			const formGroupDiv = PCX.createDOM('div', { className: 'pull-right btn-group-toggle'});

			// Create the checkbox for "Hide Read"
			const viewedCheckbox = PCX.createDOM('input', {
				type:'checkbox',
				id: 'toggleViewed',
				checked: false
			});
			const viewedLabel = PCX.createDOM('label', {className:'btn btn-info btn-sm btn-secondary active',textContent: 'Show/Hide Read '});
			viewedLabel.setAttribute('for', 'toggleViewed');

			// Append checkboxes and labels to the form-group div
			viewedLabel.appendChild(viewedCheckbox);
			formGroupDiv.appendChild(viewedLabel);

			// Append the form-group div to the filter element
			filterElement.appendChild(formGroupDiv);

			// Function to toggle the display of .Viewed and .success
			function toggleDisplay() {
				const viewedElements = document.querySelectorAll('.Viewed');
				const oddElements = document.querySelectorAll('.odd');
				const evenElements = document.querySelectorAll('.even');

				viewedElements.forEach(el => {
					el.style.display = viewedCheckbox.checked ? 'none' : 'table-row';
				});
				oddElements.forEach(el => {
					el.style.display = viewedCheckbox.checked ? 'none' : 'table-row';
				});
				evenElements.forEach(el => {
					el.style.display = viewedCheckbox.checked ? 'none' : 'table-row';
				});
			}

			// Initial toggle display based on default checkbox states
			toggleDisplay();

			// Add event listeners to checkboxes
			//viewedCheckbox.addEventListener('change', toggleDisplay);
			viewedLabel.addEventListener('change', toggleDisplay);
		}

		// Start checking for the element
		initCheckboxes();
	}
}