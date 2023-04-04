// Define break timer variables and functions in the global scope
self.breakTimer = (() => {
    // Define variables and functions
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

    return {
        isOnBreak,
        getRemainingBreakTime,
        getRemainingBreakInterval,
        startBreak
    };
})();