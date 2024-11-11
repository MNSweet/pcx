# IATSERV BASED LIMS
**[⇪ Up Directory](../../README.md)**

Currently used by Labs: Prince Laboratories and Reliable Result Labs


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
- **2006:** New Master Account
	- Template: default.aspx
- **2004:** Locations
	- Template: default.aspx

## Completed Development Log
For [OnGoing Projects](../../README.md#-OnGoing-Projects)
### QA Manager: File Name Check
Since we keep to a naming syntax for both the REQ's and the Results that require the PT's name to be placed in the file name, have the system question any files that don't have the patient's name in them. This will help prevent incorrect REQ's and Results from being sent out. Which has happened, and results is a lot of paperwork to document and fix. `Status: Done`

### Automation: Default Value for Standardized Inputs
New accessions always have the status to "Received". Set *Sample Status* to "Received" by defualt on page load. `Status: Done`

Currently Primary Insurance is used for 98% of all REQ's with only hand delievered one-off's getting different *BillTo* settings. Set *BillTo* to Primary Insurance by defualt on page load. `Status: Done`

### Automation: Use Testing Lab Selection to set Test Codes
If Test Codes is blank when Testing Labs is selected and Test Category is also selected then all the information is needed to auto select the Test Codes fields. Using the PL LIMS Testing Labs lookup table convert the Lab Name or ID into it's code and sim-type the code into the Test Code field so the dropdown suggestions will appear. There should only be one available based on current configurations and it is safe to tab select. `Status: Done`