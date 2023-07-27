// Define break timer variables and functions in the global scope
self.breakTimer = (() => {
    // Define a variable to keep track of blocked tabs and their timers
    const blockedTabs = new Map();

    // Define variables and functions
    let breakStartTime = null;
    const breakDuration = 10 * 60 * 1000; // 10 minutes in milliseconds
    const breakInterval = 120 * 60 * 1000; // 120 minutes in milliseconds

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

        if (breakStartTime && currentTime - breakStartTime < breakInterval) {
            // The user cannot take another break for another hour
            return { success: false, remainingTime: getRemainingBreakInterval() };
        } else if (currentHour >= 0) {
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