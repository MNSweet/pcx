# PRINCE - Validation & Quality Control

A suite of background checks to assist in the Validation and Quality Control of Accessioning; aimed to identify errors as they occur.

## Directory
### LIMS
- [IATServ](js/lims/README_IATSERV.md)
  > Used by Prince Laboratories & Reliable Result Labs
- [DXResults](js/lims/README_DXRESULTS.md)
  > Used by Principle Diagnostics
### LABS
- [Prince Laboratories](js/labs/README_PL.md)
- [Reliable Result](js/labs/README_RR.md)
- [Principle Diagnostics](js/labs/README_PD.md)

## OnGoing Projects
### Code Base Refactor - Repo
Consolidate duplicated code by LIMS, and Lab. Move global functionality not depentant on a state/environment/url to PCX class. Generalize code/functions to accept unique variables based on state/environment/url to preform same functionality regardless of initator
> `Status: In Progress`

### Document System / Functionality - Repo
Add overview to all of the system to the main components in the README Markdown Format
>`Status: In Progress`

### Document Code in comment blocks - Repo
Per Class / Function / Global Variable group, document functionality.
> `Status: In Progress`

### System Active Preference Toggle - Automation / QA Manager
Using the Chrome Popup and/or sidebar give user the ability to toggle on of off each "Feature" of the Automation and Non-Essential component of the QA Manager.
> `Status: Planned`