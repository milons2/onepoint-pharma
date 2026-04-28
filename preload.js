const { ipcRenderer } = require("electron");

window.electron = {
  // ✅ Universal invoke (keep for other features)
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),

  // ✅ Silent printer (existing feature)
  sendToPrinter: (silentMode) => {
    ipcRenderer.send("trigger-silent-print", silentMode);
  },

  // ✅ Professional A4 Summary PDF Export
  exportDashboardPDF: (data) => {
    if (!data) {
      console.error("exportDashboardPDF: No data provided");
      return Promise.resolve({ success: false, error: "No data provided" });
    }

    return ipcRenderer.invoke("export-dashboard-pdf", data);
  },

  // ✅ Receive stats inside PrintSummary page
  onLoadPrintData: (callback) => {
    if (typeof callback !== "function") return;

    ipcRenderer.removeAllListeners("load-print-data"); // prevent duplicate listeners

    ipcRenderer.on("load-print-data", (_, data) => {
      callback(data);
    });
  },

  // ✅ Optional safety cleanup
  removePrintListener: () => {
    ipcRenderer.removeAllListeners("load-print-data");
  }
};