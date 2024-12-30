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

 	static noticeDisplay = "#noticeDisplay";

	// Translation Lookup Table for Prince Laboratories to Reference Lab
	static categoryTranslation = {};
	static raceTranslation = {};
	static orderDefaults = {};

	// Element DOM Selectors
	static selectors = {};


	static getLocation() {
		if(DXRESULTS.location == ""){return "Home";}
		return DXRESULTS.location;
	}

	static validTestCatLocation(Category) {
		return (DXRESULTS.getLocation() == Category)
	}

	static setCategoryTranslation(catTranslation){
		if(typeof catTranslation == "object"){
			DXRESULTS.categoryTranslation = catTranslation;
		}
	}

	static setRaceTranslation(raceTranslation){
		if(typeof raceTranslation == "object"){
			DXRESULTS.raceTranslation = raceTranslation;
		}
	}

	static setSelectors(selector){
		if(typeof selector == "object"){
			DXRESULTS.selectors = selector;
		}
	}

	static setOrderDefaults(orderDefaults){
		if(typeof orderDefaults == "object"){
			DXRESULTS.orderDefaults = orderDefaults;
		}
	}

	static createOrder(callback=()=>{return;}) {
		chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
			//if(chrome.runtime.id == undefined) return;
			if (message.action === 'noticeDisplay') {
				// If the notice is already present, don't recreate it
				if (PCX.getEl(DXRESULTS.noticeDisplay)) {
					PCX.getEl(DXRESULTS.noticeDisplay).remove();
				}
				message.patientData.Category = DXRESULTS.categoryTranslation[message.patientData.Category]
				PCX.noticeUpdate(message.patientData,message.timer,callback);

				if(message.patientData.Category == DXRESULTS.getLocation()){
					PCX.getEl(DXRESULTS.noticeDisplay).appendChild(
						Object.assign(PCX.createDOM('span', {
							textContent: 'Paste Patient Data',
							id: 'patientDataClone'
						}))
					);

					PCX.getEl("#patientDataClone").addEventListener('click', function(event) {
						DXRESULTS.pastePatientData();

						chrome.runtime.sendMessage({
							action: 'clearPTData',
						});
					});
				};
			}
			if (message.action === 'noticePing') {
				console.log(message);
				message.patientData.Category = DXRESULTS.categoryTranslation[message.patientData.Category]
				PCX.noticeUpdate(message.patientData,message.timer,callback);
			}
		});
	};
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

			const orderDefaults = DXRESULTS.orderDefaults;

			// Fill in data
			PCX.getEl(el.FirstName,true).value	= patientData.FirstName;
			PCX.getEl(el.LastName,true).value	= patientData.LastName;
			PCX.getEl(el.DOBMonth,true).value	= patientData.DOB[0];
			PCX.getEl(el.DOBDay,true).value		= patientData.DOB[1];
			PCX.getEl(el.DOBYear,true).value	= patientData.DOB[2];
			PCX.getEl(el.DOC).value				= patientData.DOC;

			PCX.getEl(el.Gender[patientData.Gender],true).click();

			PCX.getEl(el.Ethnicity[(DXRESULTS.raceTranslation[patientData.Race])[0]]).click();
			PCX.getEl(el.Race[(DXRESULTS.raceTranslation[patientData.Race])[1]]).click();

			PCX.getEl(el.Address,true).value	= patientData.Address;
			PCX.getEl(el.State,true).value		= patientData.State;
			PCX.getEl(el.City,true).value		= patientData.City;
			PCX.getEl(el.Zip,true).value		= patientData.Zip;
			PCX.getEl(el.Phone,true).value		= patientData.Phone;
			PCX.getEl(el.Email,true).value		= patientData.Email;

			if(el.TestPanel != "") {PCX.getEl(el.TestPanel,true).click();}

			PCX.getEl(el.Physician,true).value		= orderDefaults.Physician;
			PCX.getEl(el.ICDCode,true).value		= orderDefaults.ICDCode;
			PCX.getEl(el.ICDCodeAdd,true).click();
	
			if (patientData) {
				// Clear the patient data after usage
				chrome.storage.local.set({ patientData: {} }, () => {
					PCX.log('Patient data cleared after use');
					PCX.getEl(DXRESULTS.noticeDisplay).remove();
				});
			}
		});
	}
}