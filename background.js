// Define a list of off-task websites (domains).
const offTaskWebsites = ['facebook.com', 'twitter.com', 'youtube.com', 'reddit.com'];
const blockedTabs = new Map();  // Keep track of blocked tabs and their timers

// Listen for web navigation events to detect when a user visits a website.
chrome.webNavigation.onCommitted.addListener(details => {
  // Extract the hostname from the URL.
  const url = new URL(details.url);
  const hostname = url.hostname;

  // Check if the visited website is in the list of off-task websites.
  if (offTaskWebsites.some(website => hostname.includes(website))) {
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
