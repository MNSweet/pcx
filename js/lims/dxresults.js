console.log("DXResults LIMS");
class DXRESULTS {
/**
 *
 * PREP Variables/Constants
 *
 * @param INT	linkId
 * @param OBJ	labs			Lookup table for Labs by DB ID's
 * @param OBJ	testCategories	Lookup table for Test Categories by DB ID's
 * 
 */
 	static location = PCX.getUrlDirectory()[1];

 	static patientDataBanner = "#patientDataBanner";

	// Translation Lookup Table for Prince Laboratories to Reference Lab
	static categoryTranslation = {};
	static raceTranslation = {};
	static orderDefaults = {};

	// Element DOM Selectors
	static selectors = {};


	static getLocation() {
		if(this.location == ""){return "Home";}
		return this.location;
	}

	static validTestCatLocation(Category) {
		return (DXRESULTS.getLocation() == Category)
	}

	static setCategoryTranslation(catTranslation){
		if(typeof catTranslation == "object"){
			this.categoryTranslation = catTranslation;
		}
	}

	static setRaceTranslation(raceTranslation){
		if(typeof raceTranslation == "object"){
			this.raceTranslation = raceTranslation;
		}
	}

	static setSelectors(selector){
		if(typeof selector == "object"){
			this.selectors = selector;
		}
	}

	static setOrderDefaults(orderDefaults){
		if(typeof orderDefaults == "object"){
			this.orderDefaults = orderDefaults;
		}
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
			
			IATSERV.checkTestCat(PCX.getEl(`${el.Category} option:checked`),{Input: PCX.getEl(el.TestCodesInput),Output: PCX.getEl(el.TestCodesOutput)},IATSERV.testCategories).then( (elm) => {
				// Trigger inline OnClick Function via OnFocus
				PCX.getEl(el.NewPatientBTN).setAttribute('onFocus',"newPatient()");
				PCX.getEl(el.NewPatientBTN).focus();
				PCX.getEl(el.NewPatientBTN).setAttribute('onFocus',"");

				waitForElm(el.FancyBoxIframe).then( (elm) => {
					PCX.getEl(el.FancyBoxIframe).addEventListener('load', (el) => {
						iframeEl["FirstName"]	= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.FirstName);
						iframeEl["LastName"]	= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.LastName);
						iframeEl["MiddleName"]	= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.MiddleName);
						iframeEl["DOB"]			= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.DOB);
						iframeEl["Gender"]		= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.Gender);
						iframeEl["Race"]		= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.Race);
						iframeEl["Address"]		= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.Address);
						iframeEl["State"]		= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.State);
						iframeEl["City"]		= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.City);
						iframeEl["Zip"]			= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.Zip);
						iframeEl["Phone"]		= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.Phone);
						iframeEl["Email"]		= PCX.getEl(el.FancyBoxIframe).contentWindow.document.querySelector(el.Email);
						

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
						PCX.simulateUserKey(PCX.events.Tab,iframeEl.DOB);
					});
				});
			});
			if (patientData) {
				// Clear the patient data after usage
				chrome.storage.local.set({ patientData: {} }, () => {
					PCX.log('Patient data cleared after use');
					PCX.getEl(IATSERV.patientDataBanner).remove();
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
}