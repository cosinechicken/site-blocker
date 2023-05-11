// Dynamically import the breakTimer.js module
importScripts('breakTimer.js');

// Define a list of off-task websites (domains).
let offTaskWebsites = ['facebook.com', 'twitter.com', 'youtube.com', 'reddit.com'];

// Retrieve the offTaskWebsites array from the Chrome storage
chrome.storage.local.get('offTaskWebsites', (data) => {
  offTaskWebsites = data.offTaskWebsites || offTaskWebsites;
  chrome.storage.local.set({ offTaskWebsites: offTaskWebsites }, () => {
    console.log('Off-task websites list stored in Chrome storage.');
  });
});

// Listen for changes in Chrome storage
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.offTaskWebsites) {
    offTaskWebsites = changes.offTaskWebsites.newValue || [];
  }
});

const {
  blockedTabs,
  isOnBreak,
  getRemainingBreakTime,
  getRemainingBreakInterval,
  startBreak,
  stopBreak
} = self.breakTimer;

// Listen for web navigation events to detect when a user visits a website.
chrome.webNavigation.onCommitted.addListener(details => {
  // Ignore navigation events that are not of type "main_frame"
  if (details.frameId !== 0) {
    return;
  }

  // Extract the hostname from the URL.
  const url = new URL(details.url);
  const hostname = url.hostname;

  // Check if the visited website is in the list of off-task websites.
  // Do not block access if the user is currently on a break.
  if (!isOnBreak() && offTaskWebsites.some(website => {
    const match = hostname === website || hostname.endsWith('.' + website);
    return match;
  })) {
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

// Listen for tab update events to detect when a tab's status or URL changes.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab's status has changed to 'complete' and the user is not on a break.
  if (changeInfo.status === 'complete' && !isOnBreak()) {
    // Extract the hostname from the URL.
    const url = new URL(tab.url);
    const hostname = url.hostname;

    // Check if the visited website is in the list of off-task websites.
    if (offTaskWebsites.some(website => hostname.includes(website))) {
      // Redirect to the "blocked.html" page.
      const blockedPageUrl = chrome.runtime.getURL('blocked.html');
      chrome.tabs.update(tabId, { url: blockedPageUrl });

      // Unblock access after a minute (60000 milliseconds).
      const timer = setTimeout(() => {
        chrome.tabs.update(tabId, { url: tab.url });
        // Remove the tab from the set of blocked tabs
        blockedTabs.delete(tabId);
      }, 60000);

      // Add the tab to the map of blocked tabs with its timer
      blockedTabs.set(tabId, timer);
    }
  }
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

// Function to check and block tabs if break timer is over
function checkAndBlockTabs() {
  // If we are on a break, we do not need to block any tabs.
  if (isOnBreak()) return;
  
  // Get all the tabs.
  chrome.tabs.query({}, tabs => {
    for (let tab of tabs) {
      // Extract the hostname from the URL.
      const url = new URL(tab.url);
      const hostname = url.hostname;

      // Check if the visited website is in the list of off-task websites.
      if (offTaskWebsites.some(website => hostname.includes(website))) {
        // Redirect to the "blocked.html" page.
        const blockedPageUrl = chrome.runtime.getURL('blocked.html');
        chrome.tabs.update(tab.id, { url: blockedPageUrl });

        // Unblock access after a minute (60000 milliseconds).
        const timer = setTimeout(() => {
          chrome.tabs.update(tab.id, { url: tab.url });
          // Remove the tab from the set of blocked tabs
          blockedTabs.delete(tab.id);
        }, 60000);

        // Add the tab to the map of blocked tabs with its timer
        blockedTabs.set(tab.id, timer);
      }
    }
  });
}

// Check and block tabs every 1 minute.
setInterval(checkAndBlockTabs, 60000);