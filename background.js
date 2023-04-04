// Define a list of off-task websites (domains).
const offTaskWebsites = ['facebook.com', 'twitter.com', 'youtube.com'];
const blockedTabs = new Map();  // Keep track of blocked tabs and their timers

// Define break timer variables
let breakStartTime = null;
const breakDuration = 30 * 60 * 1000; // 30 minutes in milliseconds
const breakInterval = 60 * 60 * 1000; // 60 minutes in milliseconds

// Function to check if the user is currently on a break
function isOnBreak() {
  if (!breakStartTime) return false;
  const currentTime = Date.now();
  const elapsedTimeSinceBreak = currentTime - breakStartTime;
  return elapsedTimeSinceBreak < breakDuration;
}

// Function to get remaining time in current break (in milliseconds)
function getRemainingBreakTime() {
  if (!breakStartTime) return 0;
  const currentTime = Date.now();
  const elapsedTimeSinceBreak = currentTime - breakStartTime;
  return Math.max(breakDuration - elapsedTimeSinceBreak, 0);
}

// Function to get remaining time before next break is allowed (in milliseconds)
function getRemainingBreakInterval() {
  if (!breakStartTime) return 0;
  const currentTime = Date.now();
  const elapsedTimeSinceBreak = currentTime - breakStartTime;
  return Math.max(breakInterval - elapsedTimeSinceBreak, 0);
}

// Allow the user to start a break (e.g., via the extension popup)
function startBreak() {
  const currentTime = Date.now();
  if (breakStartTime && currentTime - breakStartTime < breakInterval) {
    // The user cannot take another break for another hour
    return { success: false, remainingTime: getRemainingBreakInterval() };
  }
  breakStartTime = currentTime;
  return { success: true, remainingTime: breakDuration };
}

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
});