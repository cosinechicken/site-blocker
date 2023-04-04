// Helper function to extract hostname from URL
function extractHostname(url) {
  try {
    // Prepend "https://" to the URL if no protocol is provided
    if (!url.match(/^(https?:\/\/)/i)) {
      url = 'https://' + url;
    }
    const parsedUrl = new URL(url);
    return parsedUrl.hostname;
  } catch {
    return null;
  }
}

// Helper function to validate URL using the URL constructor
function isValidUrl(url) {
  try {
    // Check if the URL starts with "http://" or "https://"
    if (!url.match(/^(https?:\/\/)/i)) {
      // Automatically prepend "https://" to the URL if no protocol is provided
      url = 'https://' + url;
    }
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Retrieve the offTaskWebsites array from the Chrome storage.
chrome.storage.local.get('offTaskWebsites', (data) => {
  const offTaskWebsites = data.offTaskWebsites || [];

  // Display the list of off-task websites in the popup.
  const offTaskWebsitesList = document.getElementById('offTaskWebsitesList');

  // Clear the contents of the offTaskWebsitesList element.
  offTaskWebsitesList.innerHTML = '';

  offTaskWebsites.forEach(website => {
    const listItem = document.createElement('li');
    listItem.textContent = website;
    offTaskWebsitesList.appendChild(listItem);
  });

  const startBreakButton = document.getElementById('startBreakButton');
  const stopBreakButton = document.getElementById('stopBreakButton');
  const remainingBreakTimeElement = document.getElementById('remainingBreakTime');
  const remainingBreakIntervalElement = document.getElementById('remainingBreakInterval');

  // Function to format milliseconds to minutes and seconds
  function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} min ${seconds} sec`;
  }

  // Function to update the display of remaining times
  function updateRemainingTimes() {
    chrome.runtime.sendMessage({ action: 'getRemainingTimes' }, response => {
      const remainingBreakTime = formatTime(response.remainingBreakTime);
      const remainingBreakInterval = formatTime(response.remainingBreakInterval);
      remainingBreakTimeElement.textContent = `${remainingBreakTime} remaining in break`;
      remainingBreakIntervalElement.textContent = `${remainingBreakInterval} before next break`;
    });
  }

  // Start a break when the button is clicked
  startBreakButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'startBreak' }, response => {
      if (response.success) {
        alert('Break started! Enjoy your break for the next 30 minutes.');
        updateRemainingTimes();
      } else {
        const remainingInterval = formatTime(response.remainingTime);
        alert(`You cannot take another break for the next ${remainingInterval}.`);
      }
    });
  });

  // Stop an ongoing break when the button is clicked
  stopBreakButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'stopBreak' }, (response) => {
      if (response.success) {
        alert('Break stopped.');
        updateRemainingTimes();
      } else {
        alert('No ongoing break to stop.');
      }
    });
  });

  const addWebsiteButton = document.getElementById('addWebsiteButton');

  // Retrieve the input field element
  const websiteInput = document.getElementById('websiteInput');

  // Function to add a new website to the block list
  function addWebsite() {
    let newWebsite = websiteInput.value.trim();
    if (!newWebsite) {
      alert('Please enter a website URL.');
      return; // Ignore empty input
    }

    // Validate the entered URL
    if (!isValidUrl(newWebsite)) {
      alert('Please enter a valid website URL.');
      return; // Ignore invalid URL format
    }

    // Extract the hostname of the new website
    const newWebsiteHostname = extractHostname(newWebsite);

    // Retrieve the existing offTaskWebsites array from the Chrome storage
    chrome.storage.local.get('offTaskWebsites', (data) => {
      const offTaskWebsites = data.offTaskWebsites || [];

      // Check for duplicates based on the hostname
      if (offTaskWebsites.includes(newWebsiteHostname)) {
        alert('This website is already in the block list.');
        return; // Ignore duplicate website
      }

      offTaskWebsites.push(newWebsiteHostname); // Add the new website to the array

      // Store the updated offTaskWebsites array in the Chrome storage
      chrome.storage.local.set({ offTaskWebsites: offTaskWebsites }, () => {
        websiteInput.value = ''; // Clear the input field
        populateOffTaskWebsites(); // Refresh the displayed list
      });
    });
  }

  // Add website to the block list when the button is clicked
  addWebsiteButton.addEventListener('click', addWebsite);

  // Add website to the block list when the Enter key is pressed in the input field
  websiteInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      addWebsite();
    }
  });
  
  // Function to populate off-task websites list
  function populateOffTaskWebsites() {
    chrome.storage.local.get('offTaskWebsites', (data) => {
      const offTaskWebsites = data.offTaskWebsites || [];
      const offTaskWebsitesList = document.getElementById('offTaskWebsitesList');
      offTaskWebsitesList.innerHTML = ''; // Clear the list
      offTaskWebsites.forEach(website => {
        const listItem = document.createElement('li');
        listItem.textContent = website;
        offTaskWebsitesList.appendChild(listItem);
      });
    });
  }

  // Populate the list on popup load
  populateOffTaskWebsites();

  // Update remaining times on popup load
  updateRemainingTimes();

});


