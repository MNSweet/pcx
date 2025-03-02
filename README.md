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

## Folder Structure
- **/css/**
  - `LabPL.css` – Stylesheet for PL (prince.iatserv.com)
  - `LabPD.css` – Stylesheet for PL (pnc.dxresults.com)
  - `LabRR.css` – Stylesheet for RR (reliable.iatserv.com)
  - `Modal.css` – Stylesheet Modal; Used primarialy as a UX element of the QaManager class
  - `sidePanel.css` – Stylesheet for the Side Panel
- **/icons/** - Extension Icons alt and default. 16px, 48px, and 128px of each.
- **/js/serviceworker/** – Javascript Files
  - `background.js` – Extension Main Service Worker.
  - `SidePanel.js` – Extension Side Panel Service Worker.
  - `SWMessageRouter.js` – Handles message passing from the service workers to the site content scripts.
  - `SWLogger.js` – Logging tool for service worker that notifies Logger.js of events to display.
- **/js/data/** – Javascript Files
  - `permissions.json` – Permission meta data look up containing: groupings, title, description, priotiy sort order, and tags
- **/js/labs/** – Contains Lab‑specific files.
  - `LabPL.js` – The page router file for PL (prince.iatserv.com); Uses the IATServ CMS.
  - `LabPD.js` – The page router file for PL (pnc.dxresults.com); Uses the DxResults CMS.
  - `LabRR.js` – The page router file for RR (reliable.iatserv.com); Uses the IATServ CMS.
- **/js/libs/** – Contains Library files.
  - `marked.min.js` – A markdown compiler libaray.
- **/js/lims/** – Contains LIMS‑specific files.
  - `IATSERV.js` – For the IATServ CMS.
  - `DXRESULTS.js` – For the DxResults CMS.
  - `LIMS.js` – The shared parent class that contains common setters and DOM utilities.
- **/js/modules/** – Contains general controllers and utilities:
  - `PCX.js` – Our general controller for UX, settings, and global functions.
  - `MessageRouter.js` – Handles message passing from the site content scripts to the service workers.
- **/js/modules/helpers/** – Contains helper classes:
  - `AsyncHelpers.js` – Contains async functions to preform tasks at a delay or on DOM change.
  - `Data.js` – Data Application Layer to communitcate with LocalStorage, Chrome.Storage, amd IndexDB.
  - `DOMHelper.js` – Scan, alter, and interact with the DOM.
  - `DOMObserver.js` – Mutation DOM Observer Class.
  - `KeyBinding.js` – Framework to recongize key patterns and execute callbacks.
  - `Logger.js` – Developer Tool for displaying events, functions, and files.
  - `QAManager.js` – For quality assurance notifications.
  - `Settings.js` – Permission checking class.
  - `TableEnhancer.js` – Manipulate search table columns and rows.
  - `Utils.js` – Catch all for uncategorized functions
- **/js/modules/patientTransfer/** – Contains patient transfer functionality:
  - `TransferNoticeController.js`
  - `DestinationFormFiller.js`
  - `PatientDataCapture.js`
  - `DataMapping.js`