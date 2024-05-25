// Description: This file contains the code for the break timer functionality.
//             The break timer allows the user to take a break from work
//             for a specified duration (e.g., 10 minutes). During this time,
//             the user is blocked from accessing off-task websites.
//             The user can take another break after a specified interval
//             (e.g., 2 hours).
//
//             The break timer is implemented using the following functions:
//             - isOnBreak(): Checks if the user is currently on a break.
//             - getRemainingBreakTime(): Gets the remaining time in the current break.
//             - getRemainingBreakInterval(): Gets the remaining time before the next break is allowed.
//             - startBreak(): Starts a break.
//             - stopBreak(): Stops an ongoing break.
//
//             The break timer is used in background.js to block access to off-task websites.
//             It is also used in popup.js to display the remaining break time and to allow
//             the user to start a break.
//
//             The break timer uses chrome.storage.local to store the break start time.
//             This is necessary because chrome.storage.sync has a limit of 8,192 bytes.
//             The break start time is stored in the breakStartTime variable.
//             It is initialized to null if no break is in progress.
//             Otherwise, it is set to the time when the break started.
//             The break start time is stored in chrome.storage.local when the user starts a break.
//             It is updated when the user stops a break.
//             The break start time is retrieved from chrome.storage.local when the extension is loaded.
//             This is necessary because the extension may be reloaded while the user is on a break.
//             In this case, the break start time is retrieved from chrome.storage.local and used to
//             determine if the user is currently on a break.

// Define break timer variables and functions in the global scope
self.breakTimer = (() => {
    // Define a variable to keep track of blocked tabs and their timers
    const blockedTabs = new Map();

    // Define variables and functions
    let breakStartTime = null;
    const breakDuration = 5 * 60 * 1000; // 5 minutes in milliseconds
    const breakInterval = 30 * 60 * 1000; // 30 minutes in milliseconds

    chrome.storage.local.get('breakStartTime', (data) => {
        breakStartTime = data.breakStartTime || null;
    });

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
        const date = new Date(currentTime);
        const currentHour = date.getHours();
        console.log(currentHour);

        if (breakStartTime && currentTime - breakStartTime < breakInterval) {
            // The user cannot take another break
            return { success: false, remainingTime: getRemainingBreakInterval() };
        } else if (currentHour >= 2 && currentHour <= 6) {
            console.log("No browsing allowed.");
            return { success: false, remainingTime: getRemainingBreakInterval() };
        }
        breakStartTime = currentTime;
        // Store the break start time using chrome.storage.local
        chrome.storage.local.set({ breakStartTime });
        return { success: true, remainingTime: breakDuration };
    }

    // Function to stop an ongoing break
    function stopBreak() {
        breakStartTime = Date.now() - breakDuration;
        // Store the break start time using chrome.storage.local
        chrome.storage.local.set({ breakStartTime });
        return { success: true };
    }

    return {
        blockedTabs,
        isOnBreak,
        getRemainingBreakTime,
        getRemainingBreakInterval,
        startBreak,
        stopBreak
    };
})();