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

			const el = DXRESULTS.selectors;

			// Fill in data
			PCX.getEl(el.DOC).value			= patientData.DOC;
			PCX.getEl(el.Category).value	= categoryTranslation[patientData.Category];
			PCX.getEl(el.FirstName,true).value	= patientData.FirstName;
			PCX.getEl(el.LastName,true).value	= patientData.LastName;
			PCX.getEl(el.MiddleName,true).value	= patientData.MiddleName;
//			PCX.getEl(el.DOB,true).value		= patientData.DOB.join('/');
			
			
			PCX.getEl(el.Gender,true).value		= genderTranslate[patientData.Gender];
			PCX.getEl(el.Race,true).value		= raceTranslate[patientData.Race];
			PCX.getEl(el.Address,true).value	= patientData.Address;
			PCX.getEl(el.State,true).value		= patientData.State;
			PCX.getEl(el.City,true).value		= patientData.City;
			PCX.getEl(el.Zip,true).value		= patientData.Zip;
			PCX.getEl(el.Phone,true).value		= patientData.Phone;
			PCX.getEl(el.Email,true).value		= patientData.Email;
						
			});
			if (patientData) {
				// Clear the patient data after usage
				chrome.storage.local.set({ patientData: {} }, () => {
					PCX.log('Patient data cleared after use');
					PCX.getEl(DXRESULTS.patientDataBanner).remove();
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