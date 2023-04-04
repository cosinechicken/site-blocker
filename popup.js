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

  // Update remaining times on popup load
  updateRemainingTimes();

});


