// /js/lims/IATSERV.js
Logger.log('IATSERV Loaded',"INIT");

class IATSERV extends LIMS {
	static  {
		IATSERV.lims = "IATSERV";

		// Read URL parameters specific to IATSERV.
		const params = new URLSearchParams(window.location.search);
		IATSERV.linkId = params.get("LinkId") || null;
		IATSERV.orderId = params.get("OrderId") || null;
		IATSERV.type = params.get("type") || null;
		IATSERV.extraParams = Object.fromEntries(params.entries());
		IATSERV.blacklistUpPanel = [];
	}

	// --- Page-specific functionality ---

	/**
	 * Enhances the Accession List page (LinkId "2070") by applying table enhancements.
	 */
	static accessionList() {
		const accessionConfig = {
			"alt-id-1": {fn:accessionList_AltId1_Results,name:"Results"}
		};
		const accessionEnhancer = new TableEnhancer(
			"#MainContent_ctl00_grid_DXHeadersRow0",
			".dxgvDataRow_Metropolis",
			accessionConfig
		);
		accessionEnhancer.startObserver();
		Logger.log("IATSERV.accessionList: Table enhancer observer started.");
	}

	/**
	 * Enhances the Locations page (LinkId "2004").
	 */
	static locations() {
		const locationConfig = {
			"id1": {fn:location_ID1_Delivery,name:"Delivery"}
		};
		const locationEnhancer = new TableEnhancer(
			"#MainContent_ctl00_grid_DXHeadersRow0",
			".dxgvDataRow_Metropolis",
			locationConfig
		);
		locationEnhancer.startObserver();
		Logger.log("IATSERV.locations: Table enhancer observer started for Locations.");
	}

	/**
	 * Enhances the Reports page (LinkId "6001").
	 */
	static reports() {
		const reportsConfig = {
			"accession": {fn:results_ACS_HREF,name:false},
			"dos": {fn:results_DOS_Status,name:false}
		};
		const reportsEnhancer = new TableEnhancer(
			"#MainContent_ctl00_grid_DXHeadersRow0",
			".dxgvDataRow_Metropolis",
			reportsConfig
		);
		reportsEnhancer.startObserver();
		Logger.log("IATSERV.reports: Table enhancer observer started for Reports.");
	}

	/**
	 * Handles the Create Accession workflow (LinkId "2011", type "acs").
	 * Sets defaults, binds event handlers, and invokes a callback when complete.
	 */
	static createAccession(callback = () => {}) {
		const el = super.selectors;
		// Set default inputs.
		super.getEl(el.BillType).value = 1;
		super.getEl(el.Status).value = "Received";
		super.getEl(el.newPatientBtn, true).addEventListener("click", IATSERV.newPatientBtn);
		super.getEl(el.newPatientBtn).classList.add("disabled");
		super.getEl(el.locationInput).addEventListener("blur", IATSERV.locationBlur);
		super.getEl(el.UpPanel).addEventListener('change', (e) => {
			// Ping reloaded Elements
			if (e.target && e.target.id === el.Category.replace('#','')) {
				IATSERV.checkTestCat(super.getEl(`${el.Category} option:checked`,true),{Input: super.getEl(el.TestCodesInput,true),Output: super.getEl(el.TestCodesOutput,true)},super.testCategories);
			}
		});

		IATSERV.observeUpPanelChanges((mutations) => {
			console.log(mutations);
			IATSERV.upPanelChange(mutations);
		});

		super.getEl(el.UpPanel).addEventListener("blur", (e) => {
			if (e.target && "#" + e.target.id === el.DOC) {
				let attempt = 0;
				let lastValue = "";
				const intervalId = setInterval(() => {
					if (super.getEl(el.DOC, true).value !== lastValue) {
						PCX.processEnabled("Interface", "Show Stablity Notice", () => {
							QAManager.setStablityNotice(el.DOS, super.getEl(el.DOC).value, true);
						});
						lastValue = super.getEl(el.DOC).value;
						clearInterval(intervalId);
					}
					if (++attempt >= 5) {
						clearInterval(intervalId);
					}
				}, 100);
			}
		}, true);

		PCX.processEnabled("Interface", "ICD Code Previewer", () => {
			super.getEl(el.ICDCodesInput + "~.body", true).insertAdjacentHTML("afterbegin", `<div id="icdCodePreviewer"></div>`);
			let observer = new MutationObserver(() => {});
			super.getEl(el.UpPanel, true).addEventListener("keydown", async (e) => {
				if (e.target && "#" + e.target.id === el.ICDCodesInput && (e.key === "Enter" || e.key === "Tab")) {
					const targetElement = super.getEl(el.ICDCodesInput + "~#dvCount #lblCount", true);
					observer.disconnect();
					observer = new MutationObserver((mutations) => {
						let icdCodes = Array.from(super.getEls(el.ICDCodesInput + "~.body #dvSelectedItems #xv_param", true)).reverse();
						super.getEl("#icdCodePreviewer", true).innerHTML =
							`<span class="icdCode">` + icdCodes.map(element => element.value).join(`</span><span class="icdCode">`) + `</span>`;
					});
					observer.observe(targetElement, { childList: true });
				}
			}, true);
		});

		PCX.processEnabled("Interface", "Reduce Tabable Inputs", () => {
			const removeTabIndexSelectors = [
				el.SearchPatient, el.PatientCode, el.PatientDOB, el.PatientAddress, el.PatientPhone,
				el.PatientEmail, el.PrimaryInsurance, el.PrimaryInsurancePolicy, el.PrimaryInsuranceGroup,
				el.SecondaryInsurance, el.SecondaryInsurancePolicy, el.SecondaryInsuranceGroup, el.SpecimenType,
				el.Quantity, el.Requisition, el.DOCTime, el.ReceivedDate, el.ReceivedTime, el.ClearBTN, el.Medication,
				el.MedicationBTN, el.OtherMedication, el.PhySigCaptured, el.PTSigCaptured, el.SigSuccess, el.SigClear, el.SigToggle
			];
			super.disableTabIndex(removeTabIndexSelectors);
		});
		callback();
	}

	static upPanelChange(mutations) {
		console.log("upPanelChange");
		const el = super.selectors;
		if(`#${mutations[0].target.id}` == el.UpPanel){
			console.log(`Target:`, super.getEl(`${el.Category} option:checked`));
			console.log(`Input:`, super.getEl(el.TestCodesInput, true));
			console.log(`Output:`, super.getEl(el.TestCodesOutput, true));
			console.log(`testCategories:`, super.testCategories);
			IATSERV.checkTestCat(
				super.getEl(`${el.Category} option:checked`),
				{
					Input: super.getEl(el.TestCodesInput, true),
					Output: super.getEl(el.TestCodesOutput, true)
				},
				super.testCategories
			);
			// Process enabling "Hide Signatures" functionality
			PCX.processEnabled("Interface", "Hide Signatures", IATSERV.showSignaturesBTN);

			// Bind newPatientBtn click handler, if needed
			super.getEl(el.newPatientBtn, true).addEventListener("click", IATSERV.newPatientBtn);

			PCX.processEnabled("Interface", "Show Stablity Notice", () => {
				if (super.getEl(el.DOC, true).value !== "") {
					QAManager.setStablityNotice(el.DOS, super.getEl(el.DOC).value, true);
				}
			});
		}else{
			console.log(`Skip Targets: ${mutations}`);
		}
		return;


	}

	// Creates a toggle button to show/hide the signature section.
	static showSignaturesBTN() {
		// Add a class to mark the page as not showing signatures
		document.body.classList.add("nosignature");
		// Create the toggle button
		IATSERV.blacklistUpPanel.pushNew('#showSignature');
		let showSignatureBTN = super.createDOM("div", {
			id: "showSignature",
			innerText: "Show Signature Section",
			classList: "form-group col-lg-1 new-row btn btn-default"
		});
		// When clicked, switch the body classes to show the signature section
		showSignatureBTN.addEventListener("click", () => {
			document.body.classList.remove("nosignature");
			document.body.classList.add("signature");
		});
		// Find the target element where the button should be inserted
		const targetEl = super.getEl("#MainContent_ctl00_ctl00_PlacePhysicianAuthorizeText", true);
		if (targetEl) {
			targetEl.insertAdjacentElement("beforebegin", showSignatureBTN);
			// Append a style block to manage the signature section visibility

			IATSERV.blacklistUpPanel.pushNew('#showSignatureStyles');
			const styleEl = super.createDOM("style", {
				id: "showSignatureStyles",
				innerText: `
	.nosignature #MainContent_ctl00_ctl00_PlacePhysicianAuthorizeText,
	.nosignature #MainContent_ctl00_ctl00_PlacePatientAuthorizeText,
	.nosignature #MainContent_ctl00_ctl00_PlacePatientAuthorizeText + .form-group.col-lg-2.new-row,
	.nosignature #MainContent_ctl00_ctl00_PlacePatientAuthorizeText + .form-group.col-lg-2.new-row + .form-group.col-lg-2{
		opacity: 0;
		transition: opacity 0.26s ease, max-height 0.26s ease;
		max-height: 0px;
	}

	#showSignature {
		margin: 0 15px;
		width: calc(100% - 42px);
	}

	.signature #showSignature {
		display: none;
	}

	.signature #MainContent_ctl00_ctl00_PlacePhysicianAuthorizeText,
	.signature #MainContent_ctl00_ctl00_PlacePatientAuthorizeText,
	.signature #MainContent_ctl00_ctl00_PlacePatientAuthorizeText + .form-group.col-lg-2.new-row,
	.signature #MainContent_ctl00_ctl00_PlacePatientAuthorizeText + .form-group.col-lg-2.new-row + .form-group.col-lg-2{
		opacity: 1;
		max-height: 190px;
	}`
			});
			super.getEl("#MainContent_ctl00_ctl00_PlacePhysicianAuthorizeText").append(styleEl);
		}
	}

	// Handles file drop functionality on the page.
	static fileDrop(qa = { enabled: false, acsNum: null, acsID: null, patient: null, result: false }, target = false, targetSpan = false, scrollTo = false) {
		let isDragging = false;
		const el = super.selectors;
		// Determine drop area, scroll target, accept types, etc.
		el.DropArea = target ? target : el.UploadTable;
		el.ScrollTo = scrollTo ? scrollTo : el.DropArea;
		el.AcceptTypes = el.DropArea + " input[type='file']";
		el.TargetSpan = targetSpan ? targetSpan : el.UploadSpan;
		const dropArea = super.getEl(el.DropArea).closest("*");
		const acceptTypes = super.getEl(el.AcceptTypes).getAttribute("accept").split(",");

		// Helper functions for maintaining drop zone state
		const dropZoneKeepAlive = (e) => {
			isDragging = true;
			if (!document.body.classList.contains("dropZoneKeepAlive")) {
				document.body.classList.add("dropZoneKeepAlive");
				super.getEl(el.TargetSpan).textContent = "Drop File";
			}
		};
		
		const dropZoneTimeOut = (e) => {
			if (e.target === window || (e.clientX === 0 && e.clientY === 0)) {
				isDragging = false;
				if (document.body.classList.contains("dropZoneKeepAlive")) {
					document.body.classList.remove("dropZoneKeepAlive");
					super.getEl(el.TargetSpan).textContent = "Choose File";
				}
			}
		};
		
		// Bind event listeners for drag over and drag leave
		dropArea.addEventListener("dragover", dropZoneKeepAlive);
		dropArea.addEventListener("dragleave", dropZoneTimeOut);
		document.addEventListener("dragover", dropZoneKeepAlive);
		window.addEventListener("dragleave", dropZoneTimeOut);
		
		// Handle drop event
		dropArea.addEventListener("drop", (e) => {
			isDragging = false;
			if (document.body.classList.contains("dropZoneKeepAlive")) {
				document.body.classList.remove("dropZoneKeepAlive");
				if (super.getEl(el.TargetSpan).textContent === "Drop File") {
					super.getEl(el.TargetSpan).textContent = "Choose File";
				}
			}
			if (e.dataTransfer.files.length > 0) {
				for (const [i, file] of Object.entries(e.dataTransfer.files)) {
					let fileExt = file.name.split(".").pop();
					let fileName = file.name.replace("." + fileExt, "");
					super.getEl(el.ScrollTo).scrollIntoView({ behavior: "instant", block: "end" });
					if (acceptTypes.findIndex(a => a.toLowerCase() === ("." + fileExt).toLowerCase()) === -1) {
						return; // File not accepted
					}
					if (qa.enabled) {
						let queries = qa.patient;
						queries.push(qa.acsNum, qa.acsID);
						let showDialog = false;
						let tokens = fileName.toUpperCase()
							.replace(/(\d{2})-(\d{2})-(\d{4})/gm, `$1$2$3`)
							.replace(/(\d{2})\.(\d{2})\.(\d{4})/gm, `$1$2$3`)
							.split(/[\s\-._]/);
						if (!tokens.some(item => queries.includes(item))) {
							QAManager.addNotice("FileUpload", `<h4>Sorry to bother</h4>The file you just uploaded does not have the Patient's Name or Accession Number in its name.<br/>Double-check you haven't uploaded the wrong file: <pre>${file.name}</pre>`);
							QAManager.showQAModalNotification();
							QAManager.removeNotice("FileUpload");
						}
						if (!tokens.some(item => queries.includes(item))) {
							QAManager.addNotice("FileUpload2", `<h4>Sorry to bother</h4>The file you just uploaded does not have the Patient's Name or Accession Number in its name.<br/>Double-check you haven't uploaded the wrong file: <pre>${file.name}</pre>`);
							showDialog = true;
						}
						if (qa.result) {
							if ((tokens.includes("NEG") && tokens.includes("POS")) || (!tokens.includes("NEG") && !tokens.includes("POS"))) {
								QAManager.addNotice("FileUpload1", `<h4>Quick Note</h4>The file you just uploaded appears not to have its result status set: <pre>${file.name}</pre>`);
								showDialog = true;
							}
						}
						if (showDialog) {
							QAManager.showQAModalNotification();
							QAManager.removeNotice("FileUpload");
							QAManager.removeNotice("FileUpload1");
							QAManager.removeNotice("FileUpload2");
						}
					} else {
						Logger.log("Call to QAManager: Not Enabled");
					}
				}
			}
		});
	}

	static scanFilenamer(output = false) {
		// Define keywords and corresponding suffixes.
		let type = "REQ";
		const fs = " FS";
		const locationKeywords = {
			"ABCO": "",
			"AXXESSRX": fs,
			"MONROE": fs,
			"RELIABLE": "",
			"TKS": fs,
			"SNL": fs,
			"VIBRANT": fs
		};
		
		// Function to generate the label.
		const generateLabel = () => {
			// Use a fixed selector for the LOCATION field (or consider moving to super.selectors if appropriate)
			const locationField = document.querySelector("#MainContent_ctl00_tbLocation_tbText");
			const location = locationField ? locationField.value : "";
			
			// Check for keywords.
			for (const keyword in locationKeywords) {
				const regex = new RegExp(keyword, "i");
				if (regex.test(location)) {
					type += locationKeywords[keyword];
					break;
				}
			}
			
			// Get the PATIENT field via PCX helper.
			const patientField = super.getEl("#MainContent_ctl00_tbPatient_tbText", true);
			const patient = patientField ? patientField.value : "";
			const name = patient.replace(/,/g, "");
			
			// Get the Accession number.
			const acsField = super.getEl("#MainContent_ctl00_tbAccession", true);
			const acsNum = acsField ? acsField.value : "";
			
			const labelString = `${type} ${acsNum} ${name}`;
			
			if (output) {
				return labelString;
			} else {
				navigator.clipboard.writeText(labelString);
			}
		};
		
		// Attach the event listener to the button that uses onclick="printLables()"
		const printBtn = document.querySelector('[onclick="printLables()"]');
		if (printBtn) {
			printBtn.addEventListener("click", generateLabel);
		}
		
		if (output) {
			return generateLabel();
		}
	}


	static async newPatientBtn(eventPtBtnClick) {
		const el = super.selectors;
		// Wait for the FancyBox iframe to load.
		await waitForElm(el.FancyBox);
		await waitForIframeElm(el.FancyBox, el.IframeDOB);
		
		// Enable QA Manager to check Date of Birth.
		PCX.processEnabled("QA Manager", "Check Date of Birth", () => {
			const fancyDoc = super.getEl(el.FancyBox, true).contentWindow.document;
			const inputDOB = fancyDoc.querySelector(el.IframeDOB);
			const minorDate = new Date();
			minorDate.setFullYear(minorDate.getFullYear() - 18);
			let docLastValue = "";
			let docAttempt = 0;
			
			inputDOB.addEventListener("blur", (e) => {
				docAttempt = 0;
				const intervalId = setInterval(() => {
					if (e.target.value !== docLastValue) {
						docLastValue = e.target.value;
						clearInterval(intervalId);
						const dob = e.target.value;
						if (Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= Date.now()) {
							QAManager.addNotice("DOB", "It seems that your patient hasn't been born yet. Is this birthday correct? " + dob);
						} else if (Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= minorDate.getTime()) {
							QAManager.addNotice("DOB", "Interesting, your patient is a minor. Just a quick check. Is this birthday correct? " + dob);
						} else if (Number.isInteger(Date.parse(dob)) && Date.parse(dob) >= 946702800000) {
							QAManager.addNotice("DOB", "Just being vigilant, though I may be wrong: Is this birthday correct? " + dob);
						} else {
							QAManager.removeNotice("DOB");
						}
					}
					if (++docAttempt >= 5) {
						clearInterval(intervalId);
					}
				}, 100);
			});
		});
		
		// Update the State dropdown options.
		const fancyDoc = super.getEl(el.FancyBox, true).contentWindow.document;
		fancyDoc.querySelectorAll(el.StateDropdown + " option").forEach((option) => {
			if (["", "AA", "AE", "AP"].includes(option.value)) return;
			option.innerText = `${option.value} - ${option.innerText}`;
		});
		
		// Enable Insurance Provider suggestion.
		PCX.processEnabled("Interface", "Insurance Provider Suggestion", () => {
			const fancyDoc = super.getEl(el.FancyBox, true).contentWindow.document;
			const stateDropdown = fancyDoc.querySelector(el.StateDropdown);
			const insuranceLookup = fancyDoc.querySelector(el.InsuranceLookup);
			if (insuranceLookup) {
				insuranceLookup.addEventListener("focus", (e) => {
					if (!stateDropdown.value || !(stateDropdown.value in this.insuranceLookUp)) return;
					e.target.placeholder = this.insuranceLookUp[stateDropdown.value].name;
				});
				insuranceLookup.addEventListener("blur", (e) => {
					const input = e.target;
					if (
						!stateDropdown.value ||
						!(stateDropdown.value in this.insuranceLookUp) ||
						input.value !== "" ||
						input.placeholder === "Insurance"
					) {
						return;
					}
					if (input.placeholder === this.insuranceLookUp[stateDropdown.value].name) {
						input.value = input.placeholder;
						fancyDoc.querySelector(el.InsuranceID).value = this.insuranceLookUp[stateDropdown.value].id;
					}
					input.placeholder = "Insurance";
				});
			}
		});
		/*
		// Reduce tab indices for elements inside the FancyBox.
		PCX.processEnabled("Interface", "Reduce Tabable Inputs", () => {
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
			super.disableTabIndex(removeSelectors, el.FancyBox);
		});*/
		
		// Bind form submit event to trigger QA Manager notifications.
		fancyDoc.querySelector(el.IframeForm).addEventListener("submit", (eventSubmit) => {
			if (QAManager.getNoticeCount() > 0) {
				eventSubmit.preventDefault();
				QAManager.showQAModalNotification();
			}
		});
	}

	static locationBlur(event) {
		if (event.target.value !== "" && super.getEl(el.newPatientBtn).classList.contains("disabled")) {
			if (event.target.value.match("^(AM-|CTD-).*")) {
				waitForElm(el.PhysicianOptions).then(() => {
					super.getEl(el.Physician, true).innerHTML =
						`<option value="0" disabled selected hidden>Select a Physician</option>` +
						super.getEl(el.Physician).innerHTML;
					super.getEl(el.PhysicianId, true).value = "";
					super.getEl(el.PhysicianName, true).value = "";
				});
			}
			if(event.target.value.match("^(5556).*")){
				super.getEl(el.BillType,true).value = "3";
			}
			super.getEl(el.newPatientBtn).classList.remove("disabled");
		} else if (event.target.value === "" && !super.getEl(el.newPatientBtn).classList.contains("disabled")) {
			super.getEl(el.newPatientBtn).classList.add("disabled");
		}
	}

	static async checkTestCat(elCategory, elTestCodes, testCategories) {
		PCX.processEnabled("SOP", "Use Preset Test Category Codes", () => {

			const el = super.selectors;
			elTestCodes.Input = super.getEl("#" + elTestCodes.Input.id, true);
			console.log(testCategories, elCategory.value);
			elTestCodes.Input.value = testCategories[elCategory.value].Test;
			super.simulateUserKey(elTestCodes.Input, super.events.End, "keydown");
			super.simulateUserKey(elTestCodes.Input, super.events.Tab, "keydown");

			waitForElm('[id^="ui-id-"][style^="z-index"].autocomplete-ul').then(() => {
				super.simulateUserKey(elTestCodes.Input, super.events.Tab, "keydown");
				elTestCodes.Input.value = "";
				PCX.processEnabled("SOP", "Set Lab By Test Category", () => {
					super.getEl(el.PreformingLab, true).value = testCategories[elCategory.value].LabCode;
					super.getEl(el.PreformingLab, true).dispatchEvent(new Event("change"));
				});
			});
			super.getEl(el.ICDCodesInput + "~.body", true).insertAdjacentHTML("afterbegin", `<div id="icdCodePreviewer"></div>`);
		});
	}

/**
 * Observes mutations on the upPanel element and invokes the provided callback.
 * The observer is temporarily disconnected while the callback is executed to avoid loops,
 * then reattached once processing is complete. Debouncing is used to throttle rapid events.
 *
 * @param {Function} callback - A function that receives the mutation records.
 * @returns {number|null} The observer ID, or null if the upPanel element was not found.
 */
	static observeUpPanelChanges(callback) {
		console.log('observeUpPanelChanges init');
		const upPanelEl = super.getEl(super.selectors.UpPanel, true);
		if (!upPanelEl) {
			Logger.warn("observeUpPanelChanges: upPanel element not found.");
			return null;
		}

		let observerId = null;
		let debounceTimeout = null;

		const wrappedCallback = (mutations) => {
			console.log(mutations);
			if(IATSERV.blacklistUpPanel.length){
				const addedNodes = mutations.flatMap(mutation => Array.from(mutation.addedNodes));

				// Filter out any nodes that match any selector in the blacklist
				for (const addedNode of addedNodes) {
					let skip = false;
					for (const selector of IATSERV.blacklistUpPanel) {
						if (addedNode.matches?.(selector)) {
							skip = true;
							break;
						}
					}
					if (skip) { continue;}
				}
				return;
			}
			console.log("passed blacklistUpPanel")

			clearTimeout(debounceTimeout);
			debounceTimeout = setTimeout(() => {
				if (observerId !== null) {
					DOMObserver.removeObserver(observerId);
				}

				try {
					callback(mutations);
				} catch (err) {
					Logger.error("Error in upPanel change handler", { error: err });
				} finally {
					// Reattach the observer after processing.
					observerId = DOMObserver.observe(
						upPanelEl,
						{ childList: true, characterData: false, attributes: false, subtree: false },
						wrappedCallback
					);
				}
			}, 300); // Debounce delay in milliseconds.
		};

		observerId = DOMObserver.observe(
			upPanelEl,
			{ childList: true, characterData: false, attributes: false, subtree: false },
			wrappedCallback
		);
		return observerId;
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


/* IATServ Specific Table Enhancers */
function accessionList_AltId1_Results(cell) {
	// cell is the cell for header "Alt ID 1"
	// Get the parent row.
	const row = cell.parentNode;
	// Find the cell that holds the "Accession" data.
	// Assumes that the "Accession" column contains an anchor with an onclick attribute.
	const accCell = Array.from(row.cells).find(c => {
		const a = c.querySelector("a");
		return a && a.getAttribute("onclick") && /ShowForm\((\d+),this\)/i.test(a.getAttribute("onclick"));
	});
	if (!accCell) {
		console.warn("accessionList_AltId1_Results: Accession cell not found in row");
		return;
	}
	const accAnchor = accCell.querySelector("a");
	const onclickAttr = accAnchor.getAttribute("onclick");
	const acsId = onclickAttr.replace(/ShowForm\((\d+),this\)/i, "$1");
	// Replace current cell's content with new anchor.
	cell.innerHTML = `<a href="/?LinkId=2461&AccessionId=${acsId}" target="_blank">Results</a>`;
}

function location_ID1_Delivery(cell) {
	// cell is the cell for header "ID1"
	const row = cell.parentNode;
	// Locate the cell containing the "Code" column data.
	const codeCell = Array.from(row.cells).find(c => {
		const a = c.querySelector("a");
		return a && a.getAttribute("onclick") && /ShowForm\((\d+)\)/i.test(a.getAttribute("onclick"));
	});
	if (!codeCell) {
		console.warn("location_ID1_Delivery: Code cell not found in row");
		return;
	}
	const codeAnchor = codeCell.querySelector("a");
	const onclickAttr = codeAnchor.getAttribute("onclick");
	const locationID = onclickAttr.replace(/ShowForm\((\d+)\)/i, "$1");
	// Build a new anchor for Delivery.
	cell.innerHTML = `<a href="javascript:ShowForm(${locationID});" class="delivery">Delivery</a>`;
	// Attach an event listener to trigger a click within an iframe.
	const newAnchor = cell.querySelector("a.delivery");
	if (newAnchor) {
		newAnchor.addEventListener("click", () => {
			waitForElm(".fancybox-iframe").then((iframeEl) => {
				waitForIframeElm(".fancybox-iframe", '[href="#delivery"]').then((linkEl) => {
					PCX.getEl(".fancybox-iframe", true).contentWindow.document.querySelector('[href="#delivery"]').click();
				});
			});
		});
	}
}

function results_ACS_HREF(cell) {
	//?LinkId=2071&AccessionId=#####&_ml=9&_mlp=5
	let anchor = cell.querySelector('a[href*="/ViewAccession.aspx?AccessionId="]')

	// Regular expression to extract AccessionId
	let match = anchor.getAttribute('href').match(/AccessionId=(\d+)&?/);

	if (match) {
		anchor.setAttribute('href', `/?LinkId=2071&AccessionId=${match[1]}&_ml=9&_mlp=5`);
	}
}

function results_DOS_Status(cell) {
	// Always add the base class.
	cell.classList.add("ngsDate");
	// Extract and parse the date from the cell.
	const dateText = cell.textContent.trim();
	const dosDate = new Date(dateText);
	if (isNaN(dosDate)) {
		console.warn("results_DOS_Status: Invalid date in cell", { dateText });
		return;
	}
	const now = new Date();
	const diffDays = (now - dosDate) / (1000 * 60 * 60 * 24);
	// Add additional classes based on the difference.
	if (diffDays > 90) {
		cell.classList.add("ngsExpired"); // Over 90 days.
	} else if (diffDays >= 61) {
		cell.classList.add("ngsLow");     // 90-61 days.
	} else if (diffDays >= 46) {
		cell.classList.add("ngsMedium");  // 60-46 days.
	} else if (diffDays < 45) {
		cell.classList.add("ngsHigh");    // Under 45 days.
	}
}

window.IATSERV = IATSERV;