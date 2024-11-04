
# PRINCE | Validation & Quality Control

A suite of background checks to assist in the Validation and Quality Control of Accessioning; aimed to identify errors as they occur.


## Definitions
### File Abbreviations for LIMS
- PL: Prince Laboratories
- PD: Principle Diagnostics
- RR: Reliable Result Labs

### LIMS Pages - LinkId
- **2070:** Accession List
	- Template: default.aspx
- **2071:** Update Accession
	- Requires: AccessionId
	- Template: default.aspx
- **2011:** Create Accession
	- Template: default.aspx
- **2078:** Preview Results 
	- Requires: AccessionId
	- Template: Popup.aspx
- **2461:** Update Results
	- Requires: AccessionId
	- Template: default.aspx
- **7006:** Preauthorization
	- Requires: PreauthorizationOrderId
	- Template: default.aspx

## PL LIMS Testing Labs
| Codes | Lab Name                  | ID   |
| ----- | --------------------------| ---- |
| IP    | Ipseity Diagnostics LLC   | 2    |
| SQ    | SureQuest Diagnostics     | 1010 |
| RR    | Reliable Result Labs      | 1011 |
| PL    | Prince Laboratories       | 1012 |
| PD    | Principle Diagnostics     | 1013 |

## PL LIMS Test Categories / ID's
| ID | Test Category	| Test Code (Shorthand) | Test Code 									|
| -- | -----------------| --------------------- | ----------------------------------------------|
|  1 | Toxicology		|	--					| --											|
|  3 | PGX				| PHARMA				| Panel - PHARMACOGENOMICSCOMPREHENSIVE			|
|  4 | **CGX**			| CANCER				| Panel - COMPREHENSICE CANCER					|
|  5 | STI				| STI					| Panel - STI Panel								|
|  6 | UTI				| UTI					| Panel - UTI Panel								|
|  7 | HPV				| HPV					| Panel - HPV Panel								|
|  8 | **Wound**		| WOUND					| Panel - Wound Panel							|
|  9 | COVID Flu RSV	| COVID					| Panel - COVIDFluRSV							|
| 11 | **Immuno**		| IMMUNO				| Panel - COMPREHENSICE PRIMARY IMMUNODEFICIENCY|
| 12 | **Neuro**		| NEURO					| Panel - COMPREHENSIVE NEUROLOGY				|
| 13 | RPP				|	--					| --											|
| 14 | Eyes Disorder	| EYE					| Panel - COMPREHENSIVE EYE DISORDER			|
| 15 | **Thyroid**		| THYROID				| Panel - THYROID GENETIC DISEASE				|
| 16 | Diabetes			| --					| --											|
| 17 | Cardio			| CARDIO				| Panel - CARDIO-PULMONARY						|

## RR LIMS Test Categories / ID's
| ID | Test Category			| Test Code (Shorthand) | Test Code 									|
| -- | -------------------------| --------------------- | ----------------------------------------------|
|  6 | Core Laboratory			| --					| --											|
|  7 | Cultures					| --					| --											|
| 10 | Dermatology				| --					| --											|
| 11 | Cytology					| --					| --											|
| 12 | Histology				| --					| --											|
| 13 | Urology					| --					| --											|
| 14 | Nail Fungal				| --					| --											|
| 15 | Pathology				| --					| --											|
| 16 | PGX						| --					| --											|
| 17 | CGX NGS					| COMPREHENSIVE			| Panel - IP-CGX Comprehensive Cancer			|
| 18 | **Immuno NGS**			| PANEL					| Panel - COMPREHENSICE PRIMARY IMMUNODEFICIENCY|
| 19 | Cardio NGS				| CARDIO				| Panel - CARDIO-PULMONARY						|
| 20 | Eyes NGS					| EYE					| Panel - Comprehensive Eye Disorder Panel		|
| 21 | **Neuro NGS**			| PANEL					| Panel - COMPREHENSIVE NEUROLOGY				|
| 22 | Thyroid NGS				| THYROID				| Panel - Comprehensive Eye Disorder Panel		|
| 23 | Toxicology				| REFLEX				| Panel - Urine Drug Screen Profile w/ Reflex to Definitive | Urine Drug Screen ONLY|
| 25 | STI						| PROFILE				| Panel - STI Profile							|
| 26 | UTI						| ABR PROFILE			| Panel - UTI w/ ABR Profile					|
| 27 | Wound					| ABR PROFILE			| Panel - Wound W/ ABR Profile					|
| 28 | Respiratory Pathogens	| PROFILE				| Panel - RPP - Respiratory Pathogen			|
| 30 | COVID-19					| COVID					| Panel - COVID-19								|
| 31 | Hereditary Metabolic Disorder NGS| --			| --								|




## Auto QA
### File Name Check
Since we keep to a naming syntax for both the REQ's and the Results that require the PT's name to be placed in the file name, have the system question any files that don't have the patient's name in them. This will help prevent incorrect REQ's and Results from being sent out. Which has happened, and results is a lot of paperwork to document and fix. `Status: Planned`

### Default Value for Standardized Inputs
All new accessions are to be added as Received. Set *Sample Status* to Received by defualt on page load. `Status: Done`

Currently Primary Insurance is used for 98% of all REQ's with only hand delievered one-off's getting different *BillTo* settings. Set *BillTo* to Primary Insurance by defualt on page load. `Status: Done`

### Use Testing Lab Selection to set Test Codes
If Test Codes is blank when Testing Labs is selected and Test Category is also selected then all the information is needed to auto select the Test Codes fields. Using the PL LIMS Testing Labs lookup table convert the Lab Name or ID into it's code and sim-type the code into the Test Code field so the dropdown suggestions will appear. There should only be one available based on current configurations and it is safe to tab select. `Status: Nearing Completion`