
# PRINCE | Validation & Quality Control

A suite of background checks to assist in the Validation and Quality Control of Accessioning; aimed to identify errors as they occur.


## Definitions
### Labs
- PL: Prince Laboratories
- PD: Principle Diagnostics
- RR: R&R Laboratories
### Pages - LinkId
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

## PL Test Categories / ID's

- **Toxicology:** 1
- **PGX:** 3
- **CGX:** 4
- **STI:** 5
- **UTI:** 6
- **HPV:** 7
- **Wound:** 8
- **COVID Flu RSV:** 9
- **Immuno:** 11
- **Neuro:** 12
- **RPP:** 13
- **Eyes Disorder:** 14
- **Thyroid:** 15
- **Diabetes:** 16
- **Cardio:** 17

## Auto QA
### File Name Check
Since we keep to a naming syntax for both the REQ's and the Results that require the PT's name to be placed in the file name, have the system question any files that don't have the patient's name in them. This will help prevent incorrect REQ's and Results from being sent out. Which has happened, and results is a lot of paperwork to document and fix. `Status: Planned`

### Default Value for Standardized Inputs
All new accessions are to be added as Received. Set *Sample Status* to Received by defualt on page load. `Status: Done`

Currently Primary Insurance is used for 98% of all REQ's with only hand delievered one-off's getting different *BillTo* settings. Set *BillTo* to Primary Insurance by defualt on page load. `Status: Done`