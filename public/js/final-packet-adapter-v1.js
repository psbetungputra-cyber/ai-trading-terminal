/**
 * AI SIGNALFX - Source Sync V1 Surgical Adapter
 * Bridge for __ASFX_FINAL_SIGNAL_PACKET_V5__ to Scanner Mobile V2
 * Safe Injection Strategy - Zero Rewrite Protocol
 */
(function() {
    console.log("[ASFX ADAPTER] Initializing Final Packet Adapter V1...");

    function syncSignalData() {
        if (typeof window.__ASFX_FINAL_SIGNAL_PACKET_V5__ !== 'undefined') {
            console.log("[ASFX ADAPTER] Source Packet V5 detected. Synchronizing...");
            window.currentSignalData = window.__ASFX_FINAL_SIGNAL_PACKET_V5__;
            if (typeof window.asfxScannerData === 'undefined') {
                window.asfxScannerData = window.__ASFX_FINAL_SIGNAL_PACKET_V5__;
            }
            console.log("[ASFX ADAPTER] Data mapped successfully. Ready for Scanner Engine.");
        } else {
            setTimeout(syncSignalData, 500);
        }
    }
    syncSignalData();
})();

// Surgical Patch: Inject missing smzText function
window.smzText = function(val, defaultVal) { return (val && val !== '') ? val : defaultVal; };

// Surgical Patch: Inject missing smzText function
window.smzText = function(val, defaultVal) { return (val && val !== '') ? val : defaultVal; };
