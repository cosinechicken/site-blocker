// Dynamically import the breakTimer.js module
importScripts('breakTimer.js');

// Define a list of off-task websites (domains).
let offTaskWebsites = ['facebook.com', 'twitter.com', 'youtube.com', 'reddit.com'];

chrome.storage.local.set({ offTaskWebsites: offTaskWebsites }, () => {
  console.log('Off-task websites list stored in Chrome storage.');
});

const {
  blockedTabs,
  isOnBreak,
  getRemainingBreakTime,
  getRemainingBreakInterval,
  startBreak,
  stopBreak
} = self.breakTimer;

// Retrieve the offTaskWebsites array from the Chrome storage
chrome.storage.local.get('offTaskWebsites', (data) => {
  offTaskWebsites = data.offTaskWebsites || [];

  // Store the offTaskWebsites array in the Chrome storage.
  chrome.storage.local.set({ offTaskWebsites: offTaskWebsites }, () => {
    console.log('Off-task websites list stored in Chrome storage.');
  });

  // Listen for web navigation events to detect when a user visits a website.
  chrome.webNavigation.onCommitted.addListener(details => {
    // Extract the hostname from the URL.
    const url = new URL(details.url);
    const hostname = url.hostname;

    // Check if the visited website is in the list of off-task websites.
    // Do not block access if the user is currently on a break.
    if (!isOnBreak() && offTaskWebsites.some(website => hostname.includes(website))) {
      // If the tab is already blocked, do not block it again.
      if (blockedTabs.has(details.tabId)) return;

      // Redirect to the "blocked.html" page.
      const blockedPageUrl = chrome.runtime.getURL('blocked.html');
      chrome.tabs.update(details.tabId, { url: blockedPageUrl });

      // Unblock access after a minute (60000 milliseconds).
      const timer = setTimeout(() => {
        chrome.tabs.update(details.tabId, { url: details.url });
        // Remove the tab from the set of blocked tabs
        blockedTabs.delete(details.tabId);
      }, 60000);

      // Add the tab to the map of blocked tabs with its timer
      blockedTabs.set(details.tabId, timer);
    }
  });
});


// Listen for tab removals to clean up blocked tabs map and clear timers
chrome.tabs.onRemoved.addListener(tabId => {
  if (blockedTabs.has(tabId)) {
    clearTimeout(blockedTabs.get(tabId));
    blockedTabs.delete(tabId);
 
}
});

// Expose startBreak function for use in popup script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startBreak') {
    const result = startBreak();
    sendResponse(result);
  }
  if (message.action === 'getRemainingTimes') {
    sendResponse({
      remainingBreakTime: getRemainingBreakTime(),
      remainingBreakInterval: getRemainingBreakInterval()
    });
  }
  // Handle stopBreak action
  if (message.action === 'stopBreak') {
    const result = stopBreak();
    sendResponse(result);
  }
});