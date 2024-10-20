document.addEventListener('DOMContentLoaded', () => {
  if (typeof PCX_CMSInteraction === 'undefined') {
    console.error('PCX_CMSInteraction is not defined');
    return;
  }

  // Local Storage Test Functions
  document.getElementById('setStorage').addEventListener('click', () => {
    let key = document.getElementById('storageKey').value;
    let value = document.getElementById('storageValue').value;
    PCX_CMSInteraction.setLocalStorage(key, value);
  });

  document.getElementById('getStorage').addEventListener('click', () => {
    let key = document.getElementById('storageKey').value;
    PCX_CMSInteraction.getLocalStorage(key, value => {
      alert('Fetched value: ' + value);
    });
  });

  document.getElementById('removeStorage').addEventListener('click', () => {
    let key = document.getElementById('storageKey').value;
    PCX_CMSInteraction.removeLocalStorage(key);
  });

  // Clipboard Test Functions
  document.getElementById('copyClipboard').addEventListener('click', () => {
    let text = document.getElementById('clipboardText').value;
    PCX_CMSInteraction.copyToClipboard(text);
  });

  document.getElementById('readClipboard').addEventListener('click', () => {
    PCX_CMSInteraction.readFromClipboard().then(text => {
      alert('Clipboard contains: ' + text);
    });
  });

  // GUI Modal Notification
  document.getElementById('showModal').addEventListener('click', () => {
    PCX_CMSInteraction.showGUIModalNotification('Test Modal', 'This is a test GUI modal notification.', 'test1', 1);
  });

  // Simulate
  document.getElementById('simulatedClick').addEventListener('click', () => {
    alert('Clicked');
  });

  document.getElementById('simulateClick').addEventListener('click', () => {
    PCX_CMSInteraction.simulateUserEvent('#simulatedClick', 'click');
  });

  document.getElementById('focusButton').addEventListener('click', () => {
    PCX_CMSInteraction.simulateUserEvent('#interactionInput', 'focus');
  });

  document.getElementById('blurButton').addEventListener('click', () => {
    PCX_CMSInteraction.simulateUserEvent('#interactionInput', 'blur');
  });

  document.getElementById('simulateEnter').addEventListener('click', () => {
    PCX_CMSInteraction.simulateUserEvent('#formInput', 'focus');
    PCX_CMSInteraction.simulateUserEvent('#formInput', 'value', {value:'test'});
    //PCX_CMSInteraction.simulateUserEvent('#formInput', 'key', 'a');
    const eventEnter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
document.dispatchEvent(eventEnter);
  });

  // Regular Expression Check
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  document.getElementById('checkRegex').addEventListener('click', () => {
    const input = document.getElementById('regexInput').value;
    const result = regex.test(input);
    document.getElementById('regexResult').innerText = result ? "Valid Email" : "Invalid Email";
  });

  // Detect State Changes
  const keyStatusElem = document.getElementById('keyStatus');
  document.getElementById('stateChangeInput').addEventListener('keyup', (e) => {
    keyStatusElem.innerText = `Key Up: ${e.key}`;
  });

  document.getElementById('stateChangeInput').addEventListener('keydown', (e) => {
    keyStatusElem.innerText = `Key Down: ${e.key}`;
  });

  document.getElementById('stateChangeInput').addEventListener('focus', () => {
    keyStatusElem.innerText = 'Focused';
  });

  document.getElementById('stateChangeInput').addEventListener('blur', () => {
    keyStatusElem.innerText = 'Blurred';
  });

  // Detect Form Submit
  document.getElementById('testForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const inputValue = document.getElementById('formInput').value;
    document.getElementById('formSubmitResult').innerText = `Form submitted with: ${inputValue}`;
  });

  // Detect innerHTML Change
  const innerHtmlDiv = document.getElementById('innerHtmlDiv');
  document.getElementById('changeContentButton').addEventListener('click', () => {
    innerHtmlDiv.innerHTML = 'This is the new content!';
    document.getElementById('innerHtmlStatus').innerText = 'Content was changed.';
  });

  // Observer to detect innerHTML changes
  const observer = new MutationObserver(() => {
    document.getElementById('innerHtmlStatus').innerText = 'Detected innerHTML change!';
  });
  observer.observe(innerHtmlDiv, { childList: true });


  /////////////////////////////////////
  //
  // Validation
  //
  /////////////////////////////////////


  // Medicare Pattern Validation
  /////////////////////////////////////
  // Add event listeners for input restrictions and validation
  const inputElement = document.getElementById('patternInput');
  inputElement.addEventListener('blur', validateInputMedicare);
  inputElement.addEventListener('input', enforceMaxLength); // Enforce the max length dynamically

  function enforceMaxLength() {
    const inputElement = document.getElementById('patternInput');
    const maxLength = 11;

    if (inputElement.value.length > maxLength) {
      inputElement.value = inputElement.value.slice(0, maxLength);
    }
  }

  function validateInputMedicare() {
    const input = document.getElementById('patternInput').value.toUpperCase();
    const maxLength = 11;

    // Remove any existing error message dynamically
    const existingError = document.getElementById('insErrorMessage');
    if (existingError) {
      existingError.remove();
    }

    // Create and dynamically insert the error message div
    const errorMessageDiv = document.createElement('div');
    errorMessageDiv.id = 'insErrorMessage';

    // Append the error message div after the input field
    const inputElement = document.getElementById('patternInput');
    inputElement.parentNode.insertBefore(errorMessageDiv, inputElement.nextSibling);

    // Regular expressions for each position
    const positionPatterns = [
      /^[1-9]$/,                 // Position 1: numeric 1-9
      /^[A-HJ-KM-NP-RT-UWY]$/,    // Position 2: alphabetic A-Z (minus S, L, O, I, B, Z)
      /^[0-9A-HJ-KM-NP-RT-UWY]$/, // Position 3: alphanumeric (minus S, L, O, I, B, Z)
      /^[0-9]$/,                 // Position 4: numeric 0-9
      /^[A-HJ-KM-NP-RT-UWY]$/,    // Position 5: alphabetic A-Z (minus S, L, O, I, B, Z)
      /^[0-9A-HJ-KM-NP-RT-UWY]$/, // Position 6: alphanumeric (minus S, L, O, I, B, Z)
      /^[0-9]$/,                 // Position 7: numeric 0-9
      /^[A-HJ-KM-NP-RT-UWY]$/,    // Position 8: alphabetic A-Z (minus S, L, O, I, B, Z)
      /^[A-HJ-KM-NP-RT-UWY]$/,    // Position 9: alphabetic A-Z (minus S, L, O, I, B, Z)
      /^[0-9]$/,                 // Position 10: numeric 0-9
      /^[0-9]$/                  // Position 11: numeric 0-9
    ];

    let isValid = true;
    let debugOutput = [];

    // Validate the length of the input
    if (input.length == 0) {
      return;
    } else if (input.length < maxLength) {
      errorMessageDiv.textContent = "Number should contain 11 alphanumerical characters.";
      console.error("Not enough characters");
      return;
    } else if (input.length > maxLength) {
      errorMessageDiv.textContent = "Number should contain 11 alphanumerical characters.";
      console.error("Too many characters");
      return;
    }

    // Validate each character against the respective pattern
    for (let i = 0; i < maxLength; i++) {
      if (positionPatterns[i].test(input[i])) {
        debugOutput.push(1);
      } else {
        debugOutput.push(0);
        isValid = false;
      }
    }

    // Log pattern matching results
    console.log(`Debug pattern match: ${debugOutput}`);

    // If there are invalid characters, highlight them in the input
    if (!isValid) {
      let highlightedInput = '';

      for (let i = 0; i < maxLength; i++) {
        if (debugOutput[i] === 0) {
          highlightedInput += `<span class="insChar insInvalidChar">${input[i]}</span>`;
        } else {
          highlightedInput += `<span class="insChar insValidChar">${input[i]}</span>`;
        }
      }

      // Show the detailed error message with the invalid characters highlighted
      errorMessageDiv.innerHTML = `${highlightedInput}`;
    } else {
      // If everything is valid, clear the error message
      errorMessageDiv.textContent = '';
    }
  }


});
