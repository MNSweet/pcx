console.log("This is PD specific content script.");

/********************************************
*
* Import Patient Data from Local Temp Cache.
*
*********************************************/

function pastePDPatientData() {
  chrome.storage.local.get('patientData', ({ patientData }) => {
    if (patientData) {
    }
  });
}

// Add a button to paste PD patient data
const pdButton = document.createElement('button');
pdButton.textContent = 'Paste Patient Data';
pdButton.style.cssText = 'position:fixed; bottom:10px; right:10px; z-index:1000;';
pdButton.onclick = pastePDPatientData;
//document.body.appendChild(pdButton);

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startCountdownBanner') {
    // If the banner is already present, don't recreate it
    if (!document.querySelector('#patientDataBanner')) {
      initializeBanner(message.patientData);
    }
  }
});


/*
.CreatePaCheckboxes {
    font-size: 10px;
    line-height: 9px;
    display: block;
    text-align: left;
    margin: 0px;
}
.CreatePaCheckboxes input {
    width: 20px;
    min-width: inherit;
    transform: translateY(2px);
}

<div style="
    display: inline-block;
    transform: translateY(6px);
    margin-top: -15px;
">
<label class="CreatePaCheckboxes"><input type="checkbox" id="CreatePaNoComment" checked="">No Comment</label>
<label class="CreatePaCheckboxes"><input type="checkbox" id="CreatePaNewAccession" checked="">Start New Accession</label>    
</div>








    
.iconPA {
    max-width: 14px;
    margin-top: -6px;
    transform: translateY(4px);
}
.iconLettering {
  
}

    <svg viewBox="0 0 55 65" xmlns="http://www.w3.org/2000/svg" fill="#000000" class="iconPA">
  <g>
    <path d="M5.111-.006c-2.801 0-5.072 2.272-5.072 5.074v53.841c0 2.803 2.271 5.074 5.072 5.074h45.775c2.801 0 5.074-2.271 5.074-5.074v-38.605l-18.903-20.31h-31.946z" fill-rule="evenodd" clip-rule="evenodd" fill="#e0e0ff">
    </path>
    <g fill-rule="evenodd" clip-rule="evenodd">
      <path d="M55.976 20.352v1h-12.799s-6.312-1.26-6.129-6.707c0 0 .208 5.707 6.004 5.707h12.924z" fill="#ad3fdf">
      </path>
      <path d="M37.074 0v14.561c0 1.656 1.104 5.791 6.104 5.791h12.799l-18.903-20.352z" opacity=".5" fill="#ffffff">
      </path>
    </g>
    <path style="transform: scale(2.4) translate(-7px, -33px);" d="M14.959 49.006h-3.331v4.142c0 .414-.324.738-.756.738-.414 0-.738-.324-.738-.738v-10.3c0-.594.486-1.08 1.081-1.08h3.745c2.413 0 3.763 1.656 3.763 3.619s-1.388 3.619-3.764 3.619zm-.18-5.905h-3.151v4.573h3.151c1.422 0 2.395-.937 2.395-2.287s-.973-2.286-2.395-2.286zm12.06 10.911 c-.306 0-.594-.18-.72-.486l-.9-2.287h-5.978l-.9 2.287c-.126.306-.414.486-.72.486-.468 0-.811-.378-.811-.792 0-.09.018-.198.054-.288l4.141-10.335c.198-.486.667-.811 1.225-.811.522 0 .99.324 1.188.811l4.177 10.335c.036.09.054.198.054.288 0 .359-.324.792-.81.792zm-4.609-10.569l-2.557 6.464h5.095l-2.538-6.464z" fill="#000000" style="
    transform: scale(2.4) translate(-7px, -33px);
">
    </path>
  </g>
</svg>


<svg xmlns="http://www.w3.org/2000/svg" width="15px" height="15px" viewBox="0 0 56 64" enable-background="new 0 0 56 64" xml:space="preserve" fill="#000000" style="
    transform: translateY(2px);
"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill="#3ab686" d="M5.113-0.026c-2.803,0-5.074,2.272-5.074,5.074v53.841c0,2.803,2.271,5.074,5.074,5.074h45.773 c2.801,0,5.074-2.271,5.074-5.074V20.284L37.059-0.026C37.059-0.026,5.113-0.026,5.113-0.026z"></path> <path fill="#175e43" d="M55.977,20.352v1H43.178c0,0-6.312-1.26-6.129-6.707c0,0,0.208,5.707,6.004,5.707H55.977z"></path> <path opacity="0.5" fill="#FFFFFF" enable-background="new " d="M37.074,0v14.561c0,1.656,1.104,5.791,6.104,5.791h12.799 L37.074,0z"></path> <path fill="#FFFFFF" d="M12.739,39.41c0-0.4-0.3-0.7-0.7-0.7h-1.3c-0.4,0-0.7,0.3-0.7,0.7v1.3c0,0.4,0.3,0.7,0.7,0.7h1.3 c0.4,0,0.7-0.3,0.7-0.7V39.41z M31.539,39.41c0-0.4-0.3-0.7-0.7-0.7h-15.7c-0.4,0-0.7,0.3-0.7,0.7v1.3c0,0.4,0.3,0.7,0.7,0.7h15.7 c0.4,0,0.7-0.3,0.7-0.7V39.41z M12.739,45.71c0-0.4-0.3-0.7-0.7-0.7h-1.3c-0.4,0-0.7,0.3-0.7,0.7v1.3c0,0.4,0.3,0.7,0.7,0.7h1.3 c0.4,0,0.7-0.3,0.7-0.7V45.71z M31.539,45.71c0-0.4-0.4-0.7-0.8-0.7h-15.5c-0.4,0-0.8,0.3-0.8,0.7v1.3c0,0.4,0.4,0.7,0.8,0.7h15.5 c0.4,0,0.8-0.3,0.8-0.7V45.71z M12.739,51.91c0-0.4-0.3-0.7-0.7-0.7h-1.3c-0.4,0-0.7,0.3-0.7,0.7v1.3c0,0.4,0.3,0.7,0.7,0.7h1.3 c0.4,0,0.7-0.3,0.7-0.7V51.91z M31.539,51.91c0-0.4-0.3-0.7-0.7-0.7h-15.7c-0.4,0-0.7,0.3-0.7,0.7v1.3c0,0.4,0.3,0.7,0.7,0.7h15.7 c0.4,0,0.7-0.3,0.7-0.7V51.91z"></path> </g></svg>
 */
